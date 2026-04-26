import { supabase } from '@/integrations/supabase/client';
import type { MediaAsset } from '@/types';

export interface VaultSearchResult {
    id: string;
    url: string;
    type: 'image' | 'video' | 'gif';
    ai_description: string;
    tags: string[];
    source: 'seedream' | 'klipy' | 'upload' | 'remotion';
    similarity?: number;
}

class VaultService {
    private async getUserId(): Promise<string | null> {
        const { data: { user } } = await supabase.auth.getUser();
        return user?.id ?? null;
    }

    async uploadAsset(
        file: File,
        options: {
            type: 'image' | 'video' | 'gif';
            source?: 'upload';
            aiDescription?: string;
            tags?: string[];
        }
    ): Promise<MediaAsset | null> {
        const userId = await this.getUserId();
        if (!userId) {
            console.error('User not authenticated');
            return null;
        }

        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}_${Math.random().toString(36).slice(2)}.${fileExt}`;
            const filePath = `vault/${userId}/${fileName}`;

            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('media_vault')
                .upload(filePath, file, { upsert: true });

            if (uploadError) {
                console.error('Upload error:', uploadError);
                return null;
            }

            const { data: { publicUrl } } = supabase.storage
                .from('media_vault')
                .getPublicUrl(filePath);

            const { data: assetData, error: dbError } = await supabase
                .from('media_assets')
                .insert([{
                    user_id: userId,
                    url: publicUrl,
                    type: options.type,
                    ai_description: options.aiDescription || '',
                    tags: options.tags || [],
                    source: options.source || 'upload'
                }])
                .select()
                .single();

            if (dbError) {
                console.error('Database error:', dbError);
                return null;
            }

            return assetData as MediaAsset;
        } catch (error) {
            console.error('Upload failed:', error);
            return null;
        }
    }

    async getAssets(options?: {
        type?: 'image' | 'video' | 'gif';
        limit?: number;
        offset?: number;
    }): Promise<MediaAsset[]> {
        const userId = await this.getUserId();
        if (!userId) return [];

        let query = supabase
            .from('media_assets')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (options?.type) {
            query = query.eq('type', options.type);
        }
        if (options?.limit) {
            query = query.limit(options.limit);
        }
        if (options?.offset) {
            query = query.range(options.offset, options.offset + (options.limit || 20) - 1);
        }

        const { data, error } = await query;
        if (error) {
            console.error('Error fetching assets:', error);
            return [];
        }

        return data as MediaAsset[];
    }

    async semanticSearch(query: string, options?: {
        type?: 'image' | 'video' | 'gif';
        limit?: number;
    }): Promise<VaultSearchResult[]> {
        const userId = await this.getUserId();
        if (!userId) return [];

        try {
            const searchQuery = query.toLowerCase();
            const searchTerms = searchQuery.split(' ').filter(t => t.length > 0);

            let dbQuery = supabase
                .from('media_assets')
                .select('*')
                .eq('user_id', userId);

            if (options?.type) {
                dbQuery = dbQuery.eq('type', options.type);
            }

            const { data, error } = await dbQuery;
            if (error || !data) {
                console.error('Search error:', error);
                return [];
            }

            const results = data
                .map(asset => {
                    let score = 0;
                    const descLower = (asset.ai_description || '').toLowerCase();
                    const tagsLower = (asset.tags || []).map(t => t.toLowerCase());

                    for (const term of searchTerms) {
                        if (descLower.includes(term)) score += 3;
                        if (tagsLower.some(t => t.includes(term))) score += 2;
                    }

                    return { ...asset, similarity: score };
                })
                .filter(r => r.similarity > 0)
                .sort((a, b) => (b.similarity || 0) - (a.similarity || 0))
                .slice(0, options?.limit || 20);

            return results as VaultSearchResult[];
        } catch (error) {
            console.error('Semantic search failed:', error);
            return [];
        }
    }

    async deleteAsset(assetId: string): Promise<boolean> {
        const userId = await this.getUserId();
        if (!userId) return false;

        try {
            const { data: asset, error: fetchError } = await supabase
                .from('media_assets')
                .select('url')
                .eq('id', assetId)
                .single();

            if (fetchError || !asset) return false;

            const urlParts = asset.url.split('/');
            const filePath = urlParts.slice(-2).join('/');

            await supabase.storage.from('media_vault').remove([filePath]);

            const { error: deleteError } = await supabase
                .from('media_assets')
                .delete()
                .eq('id', assetId);

            if (deleteError) {
                console.error('Delete error:', deleteError);
                return false;
            }

            return true;
        } catch (error) {
            console.error('Delete failed:', error);
            return false;
        }
    }

    async updateAssetMetadata(
        assetId: string,
        updates: {
            ai_description?: string;
            tags?: string[];
        }
    ): Promise<boolean> {
        const userId = await this.getUserId();
        if (!userId) return false;

        const { error } = await supabase
            .from('media_assets')
            .update({
                ai_description: updates.ai_description,
                tags: updates.tags
            })
            .eq('id', assetId)
            .eq('user_id', userId);

        return !error;
    }

    async autoTagAsset(assetId: string): Promise<string[]> {
        const userId = await this.getUserId();
        if (!userId) return [];

        try {
            const { data: asset, error: fetchError } = await supabase
                .from('media_assets')
                .select('url, type')
                .eq('id', assetId)
                .single();

            if (fetchError || !asset) return [];

            const suggestedTags: string[] = [];

            const { data: { user } } = await supabase.auth.getUser();
            
            const { data, error } = await supabase.functions.invoke('auto-tag-asset', {
                body: {
                    assetUrl: asset.url,
                    assetType: asset.type,
                    userId: user?.id
                }
            });

            if (!error && data?.tags) {
                suggestedTags.push(...data.tags);
            }

            await supabase
                .from('media_assets')
                .update({ tags: suggestedTags })
                .eq('id', assetId);

            return suggestedTags;
        } catch (error) {
            console.error('Auto-tag failed:', error);
            return [];
        }
    }
}

export const vaultService = new VaultService();
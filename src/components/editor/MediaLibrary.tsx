/**
 * MediaLibrary
 * ────────────
 * Left-side panel with tabs: Uploads · GIFs · Stock (Seedream).
 * Lets users add media to the timeline by dragging or clicking.
 */
import React, { useCallback, useRef, useState } from 'react';
import { Upload, Image, Film, Music, Loader2, Plus, Sparkles } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useEditor } from '@/contexts/EditorContext';
import { GIFPicker } from './GIFPicker';
import { supabase } from '@/integrations/supabase/client';

interface MediaItem {
  id: string;
  name: string;
  url: string;
  type: 'image' | 'video' | 'audio';
  thumbnailUrl?: string;
}

export function MediaLibrary() {
  const { addClip, playheadFrame, fps, tracks } = useEditor();
  const [uploads, setUploads] = useState<MediaItem[]>([]);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [seedreamPrompt, setSeedreamPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Upload to Supabase Storage ─────────────────────────────────────
  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    for (const file of files) {
      setUploadProgress(`Uploading ${file.name}…`);
      const ext = file.name.split('.').pop();
      const path = `uploads/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

      const { data, error } = await supabase.storage.from('assets').upload(path, file, { upsert: true });
      if (error) { console.error(error); continue; }

      const { data: urlData } = supabase.storage.from('assets').getPublicUrl(path);
      const url = urlData.publicUrl;
      const type: MediaItem['type'] = file.type.startsWith('audio') ? 'audio'
        : file.type.startsWith('video') ? 'video' : 'image';

      setUploads(prev => [...prev, { id: path, name: file.name, url, type, thumbnailUrl: type === 'image' ? url : undefined }]);
    }
    setUploadProgress(null);
    e.target.value = '';
  }, []);

  // ── Add uploaded item to timeline ──────────────────────────────────
  const addMediaToTimeline = useCallback((item: MediaItem) => {
    const targetTrack = tracks.find(t =>
      item.type === 'audio' ? (t.type === 'voiceover' || t.type === 'bgm') :
      item.type === 'video' ? t.type === 'video' :
      t.type === 'video'
    );
    if (!targetTrack) return;

    addClip(targetTrack.id, {
      type: targetTrack.type,
      name: item.name.slice(0, 30),
      src: item.url,
      startFrame: playheadFrame,
      durationInFrames: fps * 5, // default 5 seconds
      volume: 1,
      opacity: 1,
    });
  }, [addClip, tracks, playheadFrame, fps]);

  // ── Seedream image generation ──────────────────────────────────────
  const handleGenerateImage = useCallback(async () => {
    if (!seedreamPrompt.trim()) return;
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-visuals', {
        body: { prompt: seedreamPrompt }
      });
      if (error) throw error;
      setGeneratedImages(prev => [data.url, ...prev]);
    } catch (err) {
      console.error('Seedream error:', err);
    } finally {
      setGenerating(false);
    }
  }, [seedreamPrompt]);

  const addGeneratedToTimeline = useCallback((url: string) => {
    const videoTrack = tracks.find(t => t.type === 'video');
    if (!videoTrack) return;
    addClip(videoTrack.id, {
      type: 'video',
      name: seedreamPrompt.slice(0, 30) || 'AI Scene',
      src: url,
      startFrame: playheadFrame,
      durationInFrames: fps * 5,
      kenBurns: true,
      transitionType: 'fade',
      volume: 1,
      opacity: 1,
    });
  }, [addClip, tracks, playheadFrame, fps, seedreamPrompt]);

  return (
    <div className="flex flex-col h-full bg-zinc-950">
      <Tabs defaultValue="uploads" className="flex-1 flex flex-col min-h-0">
        <TabsList className="grid grid-cols-3 mx-2 mt-2 bg-zinc-800 shrink-0">
          <TabsTrigger value="uploads" className="text-xs">Uploads</TabsTrigger>
          <TabsTrigger value="gifs"    className="text-xs">GIFs</TabsTrigger>
          <TabsTrigger value="stock"   className="text-xs">AI Stock</TabsTrigger>
        </TabsList>

        {/* ── Uploads ──────────────────────────────────────────────── */}
        <TabsContent value="uploads" className="flex-1 flex flex-col min-h-0 mt-0 px-2 py-2 overflow-y-auto">
          <Button
            variant="outline"
            size="sm"
            className="w-full mb-3 border-dashed border-zinc-600 bg-transparent text-zinc-400 hover:bg-zinc-800"
            onClick={() => fileInputRef.current?.click()}
            disabled={!!uploadProgress}
          >
            {uploadProgress
              ? <><Loader2 size={13} className="animate-spin mr-2" />{uploadProgress}</>
              : <><Upload size={13} className="mr-2" />Upload Media (image / video / audio)</>
            }
          </Button>
          <input ref={fileInputRef} type="file" multiple accept="image/*,video/*,audio/*"
            className="hidden" onChange={handleFileChange} />

          {uploads.length === 0 ? (
            <div className="text-center text-zinc-600 text-xs py-6">
              No uploads yet — drag files here or click above
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {uploads.map(item => (
                <div
                  key={item.id}
                  className="relative group rounded overflow-hidden bg-zinc-800 cursor-pointer aspect-video"
                  onClick={() => addMediaToTimeline(item)}
                >
                  {item.thumbnailUrl ? (
                    <img src={item.thumbnailUrl} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      {item.type === 'audio' ? <Music size={20} className="text-zinc-500" /> : <Film size={20} className="text-zinc-500" />}
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center">
                    <Plus size={18} className="text-white" />
                  </div>
                  <p className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent text-[10px] text-white px-1 py-1 truncate">
                    {item.name}
                  </p>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── GIFs (Klipy) ─────────────────────────────────────────── */}
        <TabsContent value="gifs" className="flex-1 min-h-0 mt-0 overflow-hidden">
          <GIFPicker />
        </TabsContent>

        {/* ── AI Stock (Seedream) ───────────────────────────────────── */}
        <TabsContent value="stock" className="flex-1 flex flex-col min-h-0 mt-0 px-2 py-2 overflow-y-auto">
          <div className="space-y-2 mb-3">
            <Label className="text-xs text-zinc-400">Generate with Seedream 5.0 Lite</Label>
            <Input
              placeholder="Describe the scene…"
              value={seedreamPrompt}
              onChange={e => setSeedreamPrompt(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleGenerateImage()}
              className="h-8 text-xs bg-zinc-800 border-zinc-700"
            />
            <Button size="sm" className="w-full" onClick={handleGenerateImage} disabled={generating}>
              {generating
                ? <><Loader2 size={12} className="animate-spin mr-2" />Generating…</>
                : <><Sparkles size={12} className="mr-2" />Generate Image</>
              }
            </Button>
          </div>

          {generatedImages.length > 0 && (
            <div className="grid grid-cols-2 gap-2">
              {generatedImages.map((url, i) => (
                <div
                  key={i}
                  className="relative group rounded overflow-hidden aspect-video bg-zinc-800 cursor-pointer"
                  onClick={() => addGeneratedToTimeline(url)}
                >
                  <img src={url} alt={`Generated ${i}`} className="w-full h-full object-cover" loading="lazy" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center">
                    <Plus size={18} className="text-white" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

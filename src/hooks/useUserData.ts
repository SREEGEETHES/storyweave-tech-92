// Helper hooks for loading user data from Supabase
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUser } from '@/contexts/UserContext';

export const useUserStyles = () => {
    const { user } = useUser();
    const [styles, setStyles] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStyles = async () => {
            if (!user) {
                setStyles([]);
                setLoading(false);
                return;
            }

            const { data, error } = await supabase
                .from('styles')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (!error && data) {
                setStyles(data);
            }
            setLoading(false);
        };

        fetchStyles();
    }, [user]);

    const deleteStyle = async (styleId: string) => {
        const { error } = await supabase
            .from('styles')
            .delete()
            .eq('id', styleId);

        if (!error) {
            setStyles(styles.filter((s: any) => s.id !== styleId));
        }
    };

    return { styles, loading, deleteStyle };
};

export const useUserCharacters = () => {
    const { user } = useUser();
    const [characters, setCharacters] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCharacters = async () => {
            if (!user) {
                setCharacters([]);
                setLoading(false);
                return;
            }

            const { data, error } = await supabase
                .from('characters')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (!error && data) {
                setCharacters(data);
            }
            setLoading(false);
        };

        fetchCharacters();
    }, [user]);

    const deleteCharacter = async (characterId: string) => {
        const { error } = await supabase
            .from('characters')
            .delete()
            .eq('id', characterId);

        if (!error) {
            setCharacters(characters.filter((c: any) => c.id !== characterId));
        }
    };

    return { characters, loading, deleteCharacter };
};

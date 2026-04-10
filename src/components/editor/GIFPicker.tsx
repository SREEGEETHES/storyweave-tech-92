/**
 * GIFPicker
 * ─────────
 * Browses the Klipy GIF API and lets users add GIF clips to the timeline.
 *
 * API base: https://api.klipy.co/api/v1
 *   GET /gifs/search?q=<query>&api_key=<key>&per_page=20  → search
 *   GET /gifs/trending?api_key=<key>&per_page=20           → trending
 *
 * The Klipy API key is stored in VITE_KLIPY_API_KEY.
 * If the key is absent the picker falls back to Tenor public API.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Search, Loader2, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useEditor } from '@/contexts/EditorContext';
import type { KlipyGIF } from '@/types/editor';

const KLIPY_API_KEY = import.meta.env.VITE_KLIPY_API_KEY ?? '';
const KLIPY_BASE    = 'https://api.klipy.co/api/v1';

// Tenor fallback (no key required for low-volume usage)
const TENOR_BASE    = 'https://tenor.googleapis.com/v2';
const TENOR_KEY     = import.meta.env.VITE_TENOR_API_KEY ?? 'AIzaSyDbS3kF3GvGOJGMOHVP55Ibb7NXPZLBNA4';

async function fetchKlipy(q?: string): Promise<KlipyGIF[]> {
  if (!KLIPY_API_KEY) return [];
  const endpoint = q
    ? `${KLIPY_BASE}/gifs/search?q=${encodeURIComponent(q)}&api_key=${KLIPY_API_KEY}&per_page=24`
    : `${KLIPY_BASE}/gifs/trending?api_key=${KLIPY_API_KEY}&per_page=24`;
  const res = await fetch(endpoint);
  if (!res.ok) return [];
  const json = await res.json();
  return (json.data ?? []).map((g: any): KlipyGIF => ({
    id: String(g.id),
    title: g.title ?? '',
    url: g.images?.original?.url ?? g.url ?? '',
    preview: g.images?.fixed_height_small?.url ?? g.images?.preview?.url ?? g.url ?? '',
    width: parseInt(g.images?.original?.width ?? '480'),
    height: parseInt(g.images?.original?.height ?? '270'),
  }));
}

async function fetchTenor(q?: string): Promise<KlipyGIF[]> {
  const endpoint = q
    ? `${TENOR_BASE}/search?q=${encodeURIComponent(q)}&key=${TENOR_KEY}&limit=24&media_filter=gif`
    : `${TENOR_BASE}/featured?key=${TENOR_KEY}&limit=24&media_filter=gif`;
  const res = await fetch(endpoint);
  if (!res.ok) return [];
  const json = await res.json();
  return (json.results ?? []).map((g: any): KlipyGIF => {
    const media = g.media_formats ?? {};
    return {
      id: String(g.id),
      title: g.content_description ?? g.title ?? '',
      url: media.gif?.url ?? '',
      preview: media.tinygif?.url ?? media.gif?.url ?? '',
      width: media.gif?.dims?.[0] ?? 480,
      height: media.gif?.dims?.[1] ?? 270,
    };
  });
}

interface Props {
  /** Called after a GIF has been added to the timeline */
  onAdded?: () => void;
}

export function GIFPicker({ onAdded }: Props) {
  const { addClip, playheadFrame, fps, tracks } = useEditor();

  const [query, setQuery] = useState('');
  const [gifs, setGifs] = useState<KlipyGIF[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async (q?: string) => {
    setLoading(true);
    try {
      const results = KLIPY_API_KEY
        ? await fetchKlipy(q || undefined)
        : await fetchTenor(q || undefined);
      setGifs(results);
    } catch { setGifs([]); }
    finally { setLoading(false); }
  }, []);

  // Load trending on mount
  useEffect(() => { load(); }, [load]);

  const handleSearch = (val: string) => {
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => load(val || undefined), 400);
  };

  const handleAdd = useCallback((gif: KlipyGIF) => {
    const gifTrack = tracks.find(t => t.type === 'gif');
    if (!gifTrack) return;

    const durationInFrames = fps * 4; // default 4 seconds

    addClip(gifTrack.id, {
      type: 'gif',
      name: gif.title.slice(0, 30) || 'GIF',
      src: gif.url,
      startFrame: playheadFrame,
      durationInFrames,
      opacity: 1,
      volume: 0,
    });
    onAdded?.();
  }, [addClip, tracks, playheadFrame, fps, onAdded]);

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="relative px-3 py-2">
        <Search size={13} className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-500" />
        <Input
          placeholder="Search GIFs via Klipy…"
          value={query}
          onChange={e => handleSearch(e.target.value)}
          className="pl-7 h-8 text-xs bg-zinc-800 border-zinc-700"
        />
      </div>

      {/* Source badge */}
      <div className="px-3 pb-1">
        <span className="text-[10px] text-zinc-600">
          {KLIPY_API_KEY ? 'Powered by Klipy' : 'Powered by Tenor (add VITE_KLIPY_API_KEY for Klipy)'}
        </span>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto px-2 pb-2">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 size={18} className="animate-spin text-zinc-500" />
          </div>
        ) : gifs.length === 0 ? (
          <div className="text-center text-zinc-600 text-xs py-8">No GIFs found</div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {gifs.map(gif => (
              <div
                key={gif.id}
                className="relative group rounded overflow-hidden aspect-video bg-zinc-800 cursor-pointer"
                onClick={() => handleAdd(gif)}
              >
                <img
                  src={gif.preview}
                  alt={gif.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Plus size={20} className="text-white" />
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-1 py-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-[10px] text-white truncate">{gif.title}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

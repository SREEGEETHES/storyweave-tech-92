/**
 * InspectorPanel
 * ──────────────
 * Right-side panel showing properties for the currently selected clip.
 * Tabs: Transform · Style · Audio · Caption
 *
 * All changes are committed immediately via EditorContext.updateClipProps()
 * which records the action to the undo history.
 */
import React, { useCallback } from 'react';
import { AlignCenter, AlignLeft, AlignRight, AlignVerticalJustifyCenter, AlignVerticalJustifyStart, AlignVerticalJustifyEnd } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useEditor } from '@/contexts/EditorContext';
import type { TimelineClip, CaptionPosition } from '@/types/editor';

// ── Small row helper ──────────────────────────────────────────────────────

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <Label className="text-xs text-zinc-400 w-24 shrink-0">{label}</Label>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}

function NumInput({ value, onChange, min, max, step = 1 }: {
  value: number; onChange: (v: number) => void;
  min?: number; max?: number; step?: number;
}) {
  return (
    <Input
      type="number"
      value={Math.round(value * 100) / 100}
      min={min} max={max} step={step}
      onChange={e => onChange(parseFloat(e.target.value) || 0)}
      className="h-7 text-xs bg-zinc-800 border-zinc-700 text-zinc-200"
    />
  );
}

function SliderRow({ label, value, min = 0, max = 100, step = 1, onChange }: {
  label: string; value: number; min?: number; max?: number; step?: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between">
        <Label className="text-xs text-zinc-400">{label}</Label>
        <span className="text-xs text-zinc-500">{Math.round(value)}</span>
      </div>
      <Slider value={[value]} onValueChange={([v]) => onChange(v)} min={min} max={max} step={step} />
    </div>
  );
}

// ── Main panel ────────────────────────────────────────────────────────────

export function InspectorPanel() {
  const { tracks, selectedClipIds, updateClipProps } = useEditor();
  const fps = 30; // Default FPS for fade slider max

  // Find the first selected clip
  const selectedClip: TimelineClip | undefined = (() => {
    for (const tr of tracks) {
      const c = tr.clips.find(c => selectedClipIds.includes(c.id));
      if (c) return c;
    }
    return undefined;
  })();

  const update = useCallback((props: Partial<TimelineClip>) => {
    if (!selectedClip) return;
    updateClipProps(selectedClip.id, props);
  }, [selectedClip, updateClipProps]);

  if (!selectedClip) {
    return (
      <div className="h-full flex items-center justify-center text-zinc-600 text-sm text-center px-4">
        <div>
          <div className="text-2xl mb-2">✦</div>
          <div>Select a clip to edit its properties</div>
        </div>
      </div>
    );
  }

  const isAudio   = selectedClip.type === 'voiceover' || selectedClip.type === 'bgm';
  const isVideo   = selectedClip.type === 'video' || selectedClip.type === 'gif';
  const isCaption = selectedClip.type === 'caption';

  return (
    <div className="h-full flex flex-col overflow-hidden bg-zinc-950">
      {/* Clip name header */}
      <div className="px-3 py-2 border-b border-zinc-800 bg-zinc-900">
        <Input
          value={selectedClip.name}
          onChange={e => update({ name: e.target.value })}
          className="h-7 text-xs font-medium bg-transparent border-zinc-700 text-zinc-200"
        />
        <p className="text-[10px] text-zinc-600 mt-1">{selectedClip.type} · {selectedClip.id.slice(0, 8)}</p>
      </div>

      <Tabs defaultValue={isCaption ? 'caption' : isAudio ? 'audio' : 'transform'} className="flex-1 flex flex-col min-h-0">
        <TabsList className="mx-3 mt-2 bg-zinc-800 grid w-auto"
          style={{ gridTemplateColumns: `repeat(${isCaption ? 3 : isAudio ? 2 : 4}, 1fr)` }}>
          {!isAudio && <TabsTrigger value="transform" className="text-xs">Transform</TabsTrigger>}
          {isVideo  && <TabsTrigger value="style"     className="text-xs">Style</TabsTrigger>}
          {(isAudio || isVideo) && <TabsTrigger value="audio" className="text-xs">Audio</TabsTrigger>}
          {isCaption && <TabsTrigger value="transform" className="text-xs">Position</TabsTrigger>}
          {isCaption && <TabsTrigger value="caption"   className="text-xs">Caption</TabsTrigger>}
          {isCaption && <TabsTrigger value="audio"     className="text-xs">Anim</TabsTrigger>}
        </TabsList>

        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4 min-h-0">

          {/* ── Transform ─────────────────────────────────────────── */}
          <TabsContent value="transform" className="mt-0 space-y-3">
            {!isCaption && (
              <>
                <Row label="Opacity">
                  <SliderRow label="" value={(selectedClip.opacity ?? 1) * 100} onChange={v => update({ opacity: v / 100 })} />
                </Row>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs text-zinc-400">X</Label>
                    <NumInput value={selectedClip.x ?? 0} onChange={v => update({ x: v })} />
                  </div>
                  <div>
                    <Label className="text-xs text-zinc-400">Y</Label>
                    <NumInput value={selectedClip.y ?? 0} onChange={v => update({ y: v })} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs text-zinc-400">Scale X</Label>
                    <NumInput value={selectedClip.scaleX ?? 1} onChange={v => update({ scaleX: v })} min={0.01} max={5} step={0.01} />
                  </div>
                  <div>
                    <Label className="text-xs text-zinc-400">Scale Y</Label>
                    <NumInput value={selectedClip.scaleY ?? 1} onChange={v => update({ scaleY: v })} min={0.01} max={5} step={0.01} />
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-zinc-400">Rotation</Label>
                  <NumInput value={selectedClip.rotation ?? 0} onChange={v => update({ rotation: v })} min={-360} max={360} />
                </div>
              </>
            )}

            {/* Align buttons */}
            <div>
              <Label className="text-xs text-zinc-400 mb-1 block">Align to canvas</Label>
              <div className="flex gap-1 flex-wrap">
                {[
                  { icon: <AlignLeft size={12} />, label: 'Left',   action: () => update({ x: 0 }) },
                  { icon: <AlignCenter size={12} />, label: 'Center H', action: () => update({ x: 960 }) },
                  { icon: <AlignRight size={12} />, label: 'Right',  action: () => update({ x: 1920 }) },
                  { icon: <AlignVerticalJustifyStart size={12} />, label: 'Top',    action: () => update({ y: 0 }) },
                  { icon: <AlignVerticalJustifyCenter size={12} />, label: 'Center V', action: () => update({ y: 540 }) },
                  { icon: <AlignVerticalJustifyEnd size={12} />, label: 'Bottom', action: () => update({ y: 1080 }) },
                ].map(btn => (
                  <Button key={btn.label} variant="outline" size="sm"
                    className="h-7 w-7 p-0 border-zinc-700 bg-zinc-800"
                    title={btn.label} onClick={btn.action}>
                    {btn.icon}
                  </Button>
                ))}
              </div>
            </div>

            {/* Ken Burns (video only) */}
            {isVideo && (
              <Row label="Ken Burns">
                <Switch
                  checked={selectedClip.kenBurns ?? false}
                  onCheckedChange={v => update({ kenBurns: v })}
                />
              </Row>
            )}

            {/* Transition */}
            {isVideo && (
              <Row label="Transition">
                <Select
                  value={selectedClip.transitionType ?? 'fade'}
                  onValueChange={v => update({ transitionType: v as any })}
                >
                  <SelectTrigger className="h-7 text-xs bg-zinc-800 border-zinc-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-800 border-zinc-700">
                    <SelectItem value="fade">Fade</SelectItem>
                    <SelectItem value="slide">Slide</SelectItem>
                    <SelectItem value="none">None</SelectItem>
                  </SelectContent>
                </Select>
              </Row>
            )}
          </TabsContent>

          {/* ── Style ─────────────────────────────────────────────── */}
          <TabsContent value="style" className="mt-0 space-y-3">
            <div>
              <Label className="text-xs text-zinc-400 mb-1 block">Crop</Label>
              <div className="grid grid-cols-2 gap-2">
                {(['cropLeft', 'cropRight', 'cropTop', 'cropBottom'] as const).map(k => (
                  <div key={k}>
                    <Label className="text-[10px] text-zinc-500 capitalize">{k.replace('crop', '')}</Label>
                    <SliderRow
                      label="" value={(selectedClip[k] ?? 0) * 100}
                      onChange={v => update({ [k]: v / 100 })}
                    />
                  </div>
                ))}
              </div>
            </div>
            <SliderRow
              label="Border Radius"
              value={selectedClip.borderRadius ?? 0}
              max={200} step={1}
              onChange={v => update({ borderRadius: v })}
            />
            <SliderRow
              label="Opacity"
              value={(selectedClip.opacity ?? 1) * 100}
              onChange={v => update({ opacity: v / 100 })}
            />
          </TabsContent>

          {/* ── Audio ─────────────────────────────────────────────── */}
          <TabsContent value="audio" className="mt-0 space-y-3">
            <SliderRow
              label="Volume"
              value={(selectedClip.volume ?? 1) * 100}
              onChange={v => update({ volume: v / 100 })}
            />
            <SliderRow
              label="Fade In"
              value={selectedClip.fadeIn ?? 0}
              max={fps * 5} step={1}
              onChange={v => update({ fadeIn: Math.round(v) })}
            />
            <SliderRow
              label="Fade Out"
              value={selectedClip.fadeOut ?? 0}
              max={fps * 5} step={1}
              onChange={v => update({ fadeOut: Math.round(v) })}
            />
            {isCaption && (
              <Row label="Animation">
                <Select
                  value={selectedClip.captionAnimationIn ?? 'fade'}
                  onValueChange={v => update({ captionAnimationIn: v as any })}
                >
                  <SelectTrigger className="h-7 text-xs bg-zinc-800 border-zinc-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-800 border-zinc-700">
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="fade">Fade</SelectItem>
                    <SelectItem value="slide-up">Slide Up</SelectItem>
                  </SelectContent>
                </Select>
              </Row>
            )}
          </TabsContent>

          {/* ── Caption ────────────────────────────────────────────── */}
          <TabsContent value="caption" className="mt-0 space-y-3">
            <div>
              <Label className="text-xs text-zinc-400 mb-1 block">Caption Text</Label>
              <textarea
                value={selectedClip.text ?? ''}
                onChange={e => update({ text: e.target.value, name: e.target.value.slice(0, 24) })}
                rows={3}
                className="w-full text-xs bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-zinc-200 resize-none"
              />
            </div>
            <Row label="Position">
              <Select
                value={selectedClip.captionPosition ?? 'bottom'}
                onValueChange={v => update({ captionPosition: v as CaptionPosition })}
              >
                <SelectTrigger className="h-7 text-xs bg-zinc-800 border-zinc-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700">
                  <SelectItem value="top">Top</SelectItem>
                  <SelectItem value="center">Center</SelectItem>
                  <SelectItem value="bottom">Bottom</SelectItem>
                </SelectContent>
              </Select>
            </Row>
            <SliderRow
              label="Font Size"
              value={selectedClip.fontSize ?? 72}
              min={12} max={200} step={2}
              onChange={v => update({ fontSize: v })}
            />
            <Row label="Color">
              <input
                type="color"
                value={selectedClip.fontColor ?? '#ffffff'}
                onChange={e => update({ fontColor: e.target.value })}
                className="h-7 w-full cursor-pointer bg-zinc-800 border border-zinc-700 rounded"
              />
            </Row>
            <Row label="Bold">
              <Switch
                checked={selectedClip.fontWeight === 'bold'}
                onCheckedChange={v => update({ fontWeight: v ? 'bold' : 'normal' })}
              />
            </Row>
            <Row label="Background">
              <Switch
                checked={selectedClip.captionBackground ?? true}
                onCheckedChange={v => update({ captionBackground: v })}
              />
            </Row>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

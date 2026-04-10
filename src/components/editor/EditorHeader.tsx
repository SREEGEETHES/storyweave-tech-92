/**
 * EditorHeader
 * ─────────────
 * Top toolbar for the video editor:
 *   - Back navigation
 *   - Project name
 *   - Tool mode buttons (Select / Split / Text / Hand)
 *   - Undo / Redo (with label tooltips)
 *   - Snap toggle
 *   - Zoom controls
 *   - AI Generate button
 *   - Export button
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Undo2, Redo2, Scissors, MousePointer2,
  Type, Hand, Magnet, ZoomIn, ZoomOut, Download,
  Sparkles, Save, Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { useEditor } from '@/contexts/EditorContext';
import { aiService } from '@/services/aiService';
import { useVideoState } from '@/contexts/VideoStateContext';
import type { ToolMode } from '@/types/editor';

interface ToolBtn {
  mode: ToolMode;
  icon: React.ReactNode;
  label: string;
  shortcut: string;
}

const TOOLS: ToolBtn[] = [
  { mode: 'select', icon: <MousePointer2 size={14} />, label: 'Select',    shortcut: 'V' },
  { mode: 'split',  icon: <Scissors size={14} />,      label: 'Split',     shortcut: 'B' },
  { mode: 'text',   icon: <Type size={14} />,           label: 'Caption',   shortcut: 'T' },
  { mode: 'hand',   icon: <Hand size={14} />,           label: 'Pan',       shortcut: 'H' },
];

interface EditorHeaderProps {
  onRenderClick?: () => void;
}

export function EditorHeader({ onRenderClick }: EditorHeaderProps = {}) {
  const navigate = useNavigate();
  const {
    toolMode, setToolMode,
    undo, redo, canUndo, canRedo, undoLabel, redoLabel,
    snapEnabled, setSnapEnabled,
    zoomLevel, setZoomLevel,
    loadFromVideoState,
  } = useEditor();
  const { videoState } = useVideoState();

  const [projectName, setProjectName] = useState('Untitled Project');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const vs = await aiService.generateVideo(projectName, 'short');
      loadFromVideoState(vs);
    } catch (e) {
      console.error('AI generation error:', e);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise(r => setTimeout(r, 600));
    setIsSaving(false);
  };

  return (
    <TooltipProvider delayDuration={300}>
      <header className="flex items-center gap-2 px-3 h-11 bg-zinc-900 border-b border-zinc-800 shrink-0 overflow-x-auto">
        {/* Back */}
        <Button variant="ghost" size="sm" className="h-7 px-2 text-zinc-400 hover:text-white shrink-0"
          onClick={() => navigate(-1)}>
          <ArrowLeft size={14} className="mr-1" />
          <span className="text-xs hidden sm:inline">Dashboard</span>
        </Button>

        <Separator orientation="vertical" className="h-5 bg-zinc-700 shrink-0" />

        {/* Project Name */}
        <Input
          value={projectName}
          onChange={e => setProjectName(e.target.value)}
          className="h-7 w-36 text-xs bg-transparent border-0 border-b border-zinc-700 rounded-none focus-visible:ring-0 text-zinc-200 px-1 shrink-0"
        />

        <Separator orientation="vertical" className="h-5 bg-zinc-700 shrink-0" />

        {/* Tool Mode Buttons */}
        <div className="flex gap-0.5 shrink-0">
          {TOOLS.map(tool => (
            <Tooltip key={tool.mode}>
              <TooltipTrigger asChild>
                <Button
                  variant={toolMode === tool.mode ? 'secondary' : 'ghost'}
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={() => setToolMode(tool.mode)}
                >
                  {tool.icon}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                {tool.label} <span className="text-zinc-500 ml-1">({tool.shortcut})</span>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>

        <Separator orientation="vertical" className="h-5 bg-zinc-700 shrink-0" />

        {/* Undo / Redo */}
        <div className="flex gap-0.5 shrink-0">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0"
                onClick={undo} disabled={!canUndo}>
                <Undo2 size={13} />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              {canUndo ? `Undo: ${undoLabel}` : 'Nothing to undo'} <span className="text-zinc-500">(⌘Z)</span>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0"
                onClick={redo} disabled={!canRedo}>
                <Redo2 size={13} />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              {canRedo ? `Redo: ${redoLabel}` : 'Nothing to redo'} <span className="text-zinc-500">(⌘⇧Z)</span>
            </TooltipContent>
          </Tooltip>
        </div>

        <Separator orientation="vertical" className="h-5 bg-zinc-700 shrink-0" />

        {/* Snap toggle */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={snapEnabled ? 'secondary' : 'ghost'}
              size="sm" className="h-7 w-7 p-0 shrink-0"
              onClick={() => setSnapEnabled(!snapEnabled)}
            >
              <Magnet size={13} />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">
            Snapping {snapEnabled ? 'ON' : 'OFF'}
          </TooltipContent>
        </Tooltip>

        {/* Zoom */}
        <div className="flex items-center gap-1 shrink-0">
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0"
            onClick={() => setZoomLevel(Math.max(0.5, zoomLevel / 1.25))}>
            <ZoomOut size={13} />
          </Button>
          <span className="text-xs text-zinc-500 font-mono w-10 text-center">
            {Math.round(zoomLevel * 50)}%
          </span>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0"
            onClick={() => setZoomLevel(Math.min(20, zoomLevel * 1.25))}>
            <ZoomIn size={13} />
          </Button>
        </div>

        {/* Spacer */}
        <div className="flex-1 min-w-2" />

        {/* AI Generate */}
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs border-violet-700 text-violet-400 hover:bg-violet-900/30 shrink-0"
          onClick={handleGenerate}
          disabled={isGenerating}
        >
          {isGenerating
            ? <><Loader2 size={11} className="animate-spin mr-1" />Generating…</>
            : <><Sparkles size={11} className="mr-1" />AI Generate</>
          }
        </Button>

        {/* Save */}
        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 shrink-0" onClick={handleSave}>
          {isSaving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
        </Button>

        {/* Export / Render */}
        <Button
          size="sm"
          className="h-7 text-xs bg-violet-600 hover:bg-violet-500 shrink-0"
          onClick={onRenderClick}
          disabled={!videoState}
        >
          <Download size={11} className="mr-1" />
          Export
        </Button>
      </header>
    </TooltipProvider>
  );
}

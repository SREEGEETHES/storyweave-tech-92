/**
 * VideoEditor Page
 * ─────────────────
 * Full StoryWeave Hybrid Visual Editor.
 *
 * Layout (ResizablePanels):
 * ┌────────────────────────────────────────────────────────────────┐
 * │ EditorHeader (toolbar)                                         │
 * ├──────────────┬──────────────────────────────┬─────────────────┤
 * │ MediaLibrary │ PreviewCanvas                │ InspectorPanel  │
 * │  (18%)       │ (52%)                        │ (22%)           │
 * ├──────────────┴──────────────────────────────┴─────────────────┤
 * │ MultiTrackTimeline  (38% default, resizable)                  │
 * └────────────────────────────────────────────────────────────────┘
 */
import React, { useState } from 'react';
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@/components/ui/resizable';
import { VideoStateProvider } from '@/contexts/VideoStateContext';
import { EditorProvider } from '@/contexts/EditorContext';
import { EditorHeader } from '@/components/editor/EditorHeader';
import { MultiTrackTimeline } from '@/components/editor/MultiTrackTimeline';
import { PreviewCanvas } from '@/components/editor/PreviewCanvas';
import { InspectorPanel } from '@/components/editor/InspectorPanel';
import { MediaLibrary } from '@/components/editor/MediaLibrary';
import { RenderProgress } from '@/components/editor/RenderProgress';
import { useVideoState } from '@/contexts/VideoStateContext';

function EditorLayout() {
  const { videoState } = useVideoState();
  const [showRenderModal, setShowRenderModal] = useState(false);

  return (
    <div className="flex flex-col h-screen bg-zinc-950 overflow-hidden">
      {/* Render progress modal */}
      {showRenderModal && videoState && (
        <RenderProgress
          videoState={videoState}
          onClose={() => setShowRenderModal(false)}
        />
      )}

      {/* Top toolbar */}
      <EditorHeader onRenderClick={() => setShowRenderModal(true)} />

      {/* Main body — vertical split: upper workspace / lower timeline */}
      <ResizablePanelGroup direction="vertical" className="flex-1 min-h-0">

        {/* ── Upper workspace ── */}
        <ResizablePanel defaultSize={62} minSize={35}>
          {/* Horizontal split: media / preview / inspector */}
          <ResizablePanelGroup direction="horizontal" className="h-full">

            {/* Media Library */}
            <ResizablePanel defaultSize={18} minSize={14} maxSize={30}>
              <div className="h-full overflow-hidden border-r border-zinc-800">
                <div className="h-8 flex items-center px-3 border-b border-zinc-800 bg-zinc-900">
                  <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Media</span>
                </div>
                <div className="h-[calc(100%-2rem)] overflow-hidden">
                  <MediaLibrary />
                </div>
              </div>
            </ResizablePanel>

            <ResizableHandle withHandle className="bg-zinc-800 hover:bg-violet-600 transition-colors" />

            {/* Preview Canvas */}
            <ResizablePanel defaultSize={52} minSize={35}>
              <div className="h-full overflow-hidden">
                <div className="h-8 flex items-center px-3 border-b border-zinc-800 bg-zinc-900">
                  <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Preview</span>
                </div>
                <div className="h-[calc(100%-2rem)] overflow-hidden">
                  <PreviewCanvas />
                </div>
              </div>
            </ResizablePanel>

            <ResizableHandle withHandle className="bg-zinc-800 hover:bg-violet-600 transition-colors" />

            {/* Inspector Panel */}
            <ResizablePanel defaultSize={22} minSize={18} maxSize={35}>
              <div className="h-full overflow-hidden border-l border-zinc-800">
                <div className="h-8 flex items-center px-3 border-b border-zinc-800 bg-zinc-900">
                  <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Inspector</span>
                </div>
                <div className="h-[calc(100%-2rem)] overflow-hidden">
                  <InspectorPanel />
                </div>
              </div>
            </ResizablePanel>

          </ResizablePanelGroup>
        </ResizablePanel>

        <ResizableHandle withHandle className="bg-zinc-800 hover:bg-violet-600 transition-colors" />

        {/* ── Lower timeline ── */}
        <ResizablePanel defaultSize={38} minSize={20} maxSize={65}>
          <div className="h-full overflow-hidden border-t border-zinc-800">
            <div className="h-8 flex items-center px-3 border-b border-zinc-800 bg-zinc-900 gap-3">
              <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Timeline</span>
              <span className="text-[10px] text-zinc-600">
                Ctrl+Scroll to zoom · Shift+click for multi-select · Space to play · Del to delete
              </span>
            </div>
            <div className="h-[calc(100%-2rem)]">
              <MultiTrackTimeline />
            </div>
          </div>
        </ResizablePanel>

      </ResizablePanelGroup>
    </div>
  );
}

/**
 * The page wraps EditorLayout in the required context providers.
 * VideoStateProvider is the outer provider so EditorContext can
 * read & write VideoState.
 */
const VideoEditor = () => (
  <VideoStateProvider>
    <EditorProvider>
      <EditorLayout />
    </EditorProvider>
  </VideoStateProvider>
);

export default VideoEditor;

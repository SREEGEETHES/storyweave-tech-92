import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    AlertCircle,
    CheckCircle2,
    Download,
    Film,
    Loader2,
    RefreshCw,
    X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getRenderProgress, startRender } from '@/services/renderService';
import type { RenderProgressResponse, RenderStatus } from '@/services/renderService';
import type { VideoState } from '@/types';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface RenderProgressProps {
    videoState: VideoState;
    onClose: () => void;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const POLL_INTERVAL_MS = 3_000;

const STATUS_LABELS: Record<RenderStatus, string> = {
    QUEUED:     'Queued…',
    RENDERING:  'Rendering frames in parallel…',
    UPLOADING:  'Uploading to S3…',
    COMPLETED:  'Render complete!',
    FAILED:     'Render failed',
};

// ---------------------------------------------------------------------------
// RenderProgress Modal
// ---------------------------------------------------------------------------

export const RenderProgress: React.FC<RenderProgressProps> = ({ videoState, onClose }) => {
    const [phase, setPhase] = useState<'starting' | 'running' | 'done' | 'error'>('starting');
    const [jobId,     setJobId]     = useState<string | null>(null);
    const [progress,  setProgress]  = useState(0);
    const [status,    setStatus]    = useState<RenderStatus>('QUEUED');
    const [outputUrl, setOutputUrl] = useState<string | null>(null);
    const [errorMsg,  setErrorMsg]  = useState<string | null>(null);

    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // ── Stop polling ───────────────────────────────────────────────────────
    const stopPolling = useCallback(() => {
        if (pollRef.current) {
            clearInterval(pollRef.current);
            pollRef.current = null;
        }
    }, []);

    // ── Poll Lambda for progress ───────────────────────────────────────────
    const poll = useCallback(async (id: string) => {
        try {
            const data: RenderProgressResponse = await getRenderProgress(id);
            setProgress(data.progress);
            setStatus(data.status);

            if (data.status === 'COMPLETED') {
                setOutputUrl(data.outputUrl ?? null);
                setPhase('done');
                stopPolling();
            } else if (data.status === 'FAILED') {
                setErrorMsg(data.error ?? 'Render failed. Check the server logs.');
                setPhase('error');
                stopPolling();
            }
        } catch (e: any) {
            // Non-fatal poll error — keep trying
            console.error('[RenderProgress] poll error:', e.message);
        }
    }, [stopPolling]);

    // ── Start render job ───────────────────────────────────────────────────
    const launch = useCallback(async () => {
        setPhase('starting');
        setProgress(0);
        setErrorMsg(null);
        setOutputUrl(null);
        setStatus('QUEUED');

        try {
            const res = await startRender(videoState);
            setJobId(res.jobId);
            setPhase('running');
            setStatus('RENDERING');
            // Begin polling immediately, then every POLL_INTERVAL_MS
            await poll(res.jobId);
            pollRef.current = setInterval(() => poll(res.jobId), POLL_INTERVAL_MS);
        } catch (e: any) {
            setErrorMsg(e.message ?? 'Failed to start render.');
            setPhase('error');
        }
    }, [videoState, poll]);

    // Auto-start on mount
    useEffect(() => {
        launch();
        return () => stopPolling();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // ── Derived values ─────────────────────────────────────────────────────
    const isTerminal  = phase === 'done' || phase === 'error';
    const sceneCount  = videoState.scenes.length;
    const totalFrames = videoState.global.durationInFrames;

    // ── Render ─────────────────────────────────────────────────────────────
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm">
            <div
                className="relative w-full max-w-md mx-4 rounded-2xl bg-zinc-900 border border-white/10 shadow-2xl overflow-hidden"
                role="dialog"
                aria-modal="true"
                aria-label="Render progress"
            >
                {/* Header gradient accent */}
                <div className="h-1 w-full bg-gradient-to-r from-violet-600 via-fuchsia-500 to-violet-600" />

                <div className="p-7">
                    {/* Title row */}
                    <div className="flex items-start justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-violet-600/20 flex items-center justify-center shrink-0">
                                <Film size={18} className="text-violet-400" />
                            </div>
                            <div>
                                <h2 className="text-white font-semibold text-base leading-tight">
                                    Rendering Video
                                </h2>
                                <p className="text-white/40 text-xs mt-0.5">
                                    Remotion Lambda · {sceneCount} scene{sceneCount !== 1 ? 's' : ''} · {totalFrames} frames
                                </p>
                            </div>
                        </div>
                        {isTerminal && (
                            <button
                                onClick={() => { stopPolling(); onClose(); }}
                                className="text-white/30 hover:text-white transition-colors mt-0.5"
                                aria-label="Close"
                            >
                                <X size={17} />
                            </button>
                        )}
                    </div>

                    {/* ── Starting / Running ──────────────────────────────── */}
                    {(phase === 'starting' || phase === 'running') && (
                        <div>
                            {/* Status label + percentage */}
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-white/60 text-sm">
                                    {STATUS_LABELS[status]}
                                </span>
                                <span className="text-violet-400 font-mono text-sm font-semibold tabular-nums">
                                    {progress}%
                                </span>
                            </div>

                            {/* Progress bar */}
                            <div className="h-2 w-full rounded-full bg-white/8 overflow-hidden mb-4">
                                {phase === 'starting' ? (
                                    // Indeterminate shimmer while Lambda cold-starts
                                    <div className="h-full w-1/3 rounded-full bg-violet-500 animate-[shimmer_1.5s_ease-in-out_infinite]" />
                                ) : (
                                    <div
                                        className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all duration-700 ease-out"
                                        style={{ width: `${progress}%` }}
                                    />
                                )}
                            </div>

                            {/* Sub-status */}
                            <div className="flex items-center gap-2 text-white/35 text-xs">
                                <Loader2 size={11} className="animate-spin shrink-0" />
                                {phase === 'starting'
                                    ? 'Deploying Lambda function and warming up workers…'
                                    : `Processing ${sceneCount} scenes in parallel across Lambda workers`}
                            </div>

                            {/* Job ID */}
                            {jobId && (
                                <p className="mt-5 text-white/20 text-[10px] font-mono truncate">
                                    Job: {jobId}
                                </p>
                            )}
                        </div>
                    )}

                    {/* ── Complete ────────────────────────────────────────── */}
                    {phase === 'done' && (
                        <div className="text-center py-2">
                            <CheckCircle2 size={48} className="text-emerald-400 mx-auto mb-4" />
                            <p className="text-white font-semibold text-lg mb-1">Render Complete!</p>
                            <p className="text-white/50 text-sm mb-6">
                                Your video has been rendered and is ready to download.
                            </p>
                            {outputUrl ? (
                                <a
                                    href={outputUrl}
                                    download
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={cn(
                                        'inline-flex items-center gap-2 px-7 py-3 rounded-xl',
                                        'bg-violet-600 hover:bg-violet-500 active:bg-violet-700',
                                        'text-white font-semibold text-sm transition-colors'
                                    )}
                                >
                                    <Download size={16} />
                                    Download MP4
                                </a>
                            ) : (
                                <p className="text-white/40 text-sm">
                                    Output URL unavailable — check your S3 bucket.
                                </p>
                            )}
                        </div>
                    )}

                    {/* ── Error ───────────────────────────────────────────── */}
                    {phase === 'error' && (
                        <div className="text-center py-2">
                            <AlertCircle size={48} className="text-red-400 mx-auto mb-4" />
                            <p className="text-white font-semibold text-lg mb-1">Render Failed</p>
                            <p className="text-white/50 text-sm mb-6 max-w-xs mx-auto leading-relaxed">
                                {errorMsg ?? 'An unknown error occurred. Check server logs for details.'}
                            </p>
                            <button
                                onClick={launch}
                                className={cn(
                                    'inline-flex items-center gap-2 px-7 py-3 rounded-xl',
                                    'bg-zinc-700 hover:bg-zinc-600 active:bg-zinc-800',
                                    'text-white font-semibold text-sm transition-colors'
                                )}
                            >
                                <RefreshCw size={14} />
                                Retry Render
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

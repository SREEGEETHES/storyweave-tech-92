import React, { useState, useEffect, useCallback } from 'react';
import { Command } from 'cmdk';
import { 
    Play, Pause, SkipForward, Volume2, VolumeX, 
    Scissors, Music, Type, Image, Undo, Redo,
    Sparkles, Zap, Clock, Layers, Trash2, Copy,
    Save, Download, Settings, HelpCircle
} from 'lucide-react';
import { useEditor } from '@/contexts/EditorContext';
import { useVideoState } from '@/contexts/VideoStateContext';
import { aiService } from '@/services/aiService';

interface CommandBarProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function CommandBar({ open, onOpenChange }: CommandBarProps) {
    const { 
        isPlaying, setIsPlaying, currentTime, setCurrentTime,
        selectedClipId, tracks, deleteClip, undo, redo
    } = useEditor();
    const { videoState, saveVideoState, createNewVideoState } = useVideoState();
    const [inputValue, setInputValue] = useState('');

    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                onOpenChange(!open);
            }
            if (e.key === 'Escape') {
                onOpenChange(false);
            }
        };
        document.addEventListener('keydown', down);
        return () => document.removeEventListener('keydown', down);
    }, [open, onOpenChange]);

    const executeCommand = useCallback(async (command: string) => {
        const cmd = command.toLowerCase().trim();
        
        switch (true) {
            case cmd === 'play' || cmd === 'pause':
                setIsPlaying(!isPlaying);
                break;
                
            case cmd === 'stop':
                setIsPlaying(false);
                setCurrentTime(0);
                break;
                
            case cmd === 'next frame':
                setCurrentTime(currentTime + 1);
                break;
                
            case cmd === 'mute' || cmd === 'unmute':
                break;
                
            case cmd.startsWith('seek '):
                const frameMatch = cmd.match(/seek (\d+)/);
                if (frameMatch) {
                    setCurrentTime(parseInt(frameMatch[1], 10));
                }
                break;
                
            case cmd.startsWith('goto '):
                const timeMatch = cmd.match(/goto (\d+):?(\d*)/);
                if (timeMatch) {
                    const minutes = parseInt(timeMatch[1], 10) || 0;
                    const seconds = parseInt(timeMatch[2], 10) || 0;
                    const fps = videoState?.global.fps || 30;
                    setCurrentTime((minutes * 60 + seconds) * fps);
                }
                break;
                
            case cmd === 'delete' || cmd === 'delete clip':
                if (selectedClipId) {
                    deleteClip(selectedClipId);
                }
                break;
                
            case cmd === 'undo':
                undo();
                break;
                
            case cmd === 'redo':
                redo();
                break;
                
            case cmd.startsWith('caption style:'):
                const style = cmd.replace('caption style:', '').trim();
                console.log('Setting caption style:', style);
                break;
                
            case cmd.startsWith('generate b-roll:') || cmd.startsWith('b-roll:'):
                const brollPrompt = cmd.replace(/^(generate b-roll:|b-roll:)/, '').trim();
                if (brollPrompt) {
                    console.log('Generating B-Roll for:', brollPrompt);
                }
                break;
                
            case cmd.startsWith('generate idea:') || cmd.startsWith('idea:'):
                const ideaTopic = cmd.replace(/^(generate idea:|idea:)/, '').trim();
                if (ideaTopic) {
                    console.log('Generating ideas for:', ideaTopic);
                }
                break;
                
            case cmd === 'new video' || cmd === 'new project':
                createNewVideoState();
                break;
                
            case cmd === 'save':
                await saveVideoState();
                break;
                
            case cmd === 'export' || cmd === 'render':
                console.log('Opening render dialog...');
                break;
                
            default:
                if (cmd.startsWith('/')) {
                    console.log('Unknown command:', cmd);
                }
        }
        
        onOpenChange(false);
        setInputValue('');
    }, [isPlaying, currentTime, selectedClipId, videoState, setIsPlaying, setCurrentTime, deleteClip, undo, redo, saveVideoState, createNewVideoState, onOpenChange]);

    return (
        <Command.Dialog
            open={open}
            onOpenChange={onOpenChange}
            label="Global Command Menu"
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-xl bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl overflow-hidden z-50"
        >
            <div className="border-b border-zinc-800">
                <Command.Input
                    value={inputValue}
                    onValueChange={setInputValue}
                    placeholder="Type a command or search..."
                    className="w-full px-4 py-4 bg-transparent text-zinc-100 placeholder:text-zinc-500 focus:outline-none text-lg"
                />
            </div>
            
            <Command.List className="max-h-96 overflow-y-auto p-2">
                <Command.Empty className="py-6 text-center text-zinc-500">
                    No results found. Try a different command.
                </Command.Empty>
                
                <Command.Group heading="Playback" className="text-xs text-zinc-500 mb-2">
                    <Command.Item 
                        onSelect={() => executeCommand('play')}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer hover:bg-zinc-800 text-zinc-200"
                    >
                        <Play className="w-4 h-4" />
                        <span>Play / Pause</span>
                    </Command.Item>
                    <Command.Item 
                        onSelect={() => executeCommand('stop')}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer hover:bg-zinc-800 text-zinc-200"
                    >
                        <Pause className="w-4 h-4" />
                        <span>Stop</span>
                    </Command.Item>
                    <Command.Item 
                        onSelect={() => executeCommand('next frame')}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer hover:bg-zinc-800 text-zinc-200"
                    >
                        <SkipForward className="w-4 h-4" />
                        <span>Next Frame</span>
                    </Command.Item>
                </Command.Group>
                
                <Command.Group heading="Edit" className="text-xs text-zinc-500 mb-2">
                    <Command.Item 
                        onSelect={() => executeCommand('undo')}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer hover:bg-zinc-800 text-zinc-200"
                    >
                        <Undo className="w-4 h-4" />
                        <span>Undo</span>
                    </Command.Item>
                    <Command.Item 
                        onSelect={() => executeCommand('redo')}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer hover:bg-zinc-800 text-zinc-200"
                    >
                        <Redo className="w-4 h-4" />
                        <span>Redo</span>
                    </Command.Item>
                    <Command.Item 
                        onSelect={() => executeCommand('delete')}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer hover:bg-zinc-800 text-zinc-200"
                    >
                        <Trash2 className="w-4 h-4" />
                        <span>Delete Selected</span>
                    </Command.Item>
                </Command.Group>
                
                <Command.Group heading="AI Actions" className="text-xs text-zinc-500 mb-2">
                    <Command.Item 
                        onSelect={() => executeCommand('generate b-roll:')}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer hover:bg-zinc-800 text-zinc-200"
                    >
                        <Sparkles className="w-4 h-4 text-violet-400" />
                        <span>Generate B-Roll...</span>
                    </Command.Item>
                    <Command.Item 
                        onSelect={() => executeCommand('generate idea:')}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer hover:bg-zinc-800 text-zinc-200"
                    >
                        <Zap className="w-4 h-4 text-yellow-400" />
                        <span>Generate Ideas...</span>
                    </Command.Item>
                    <Command.Item 
                        onSelect={() => executeCommand('caption style:')}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer hover:bg-zinc-800 text-zinc-200"
                    >
                        <Type className="w-4 h-4" />
                        <span>Set Caption Style...</span>
                    </Command.Item>
                </Command.Group>
                
                <Command.Group heading="Project" className="text-xs text-zinc-500 mb-2">
                    <Command.Item 
                        onSelect={() => executeCommand('new video')}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer hover:bg-zinc-800 text-zinc-200"
                    >
                        <Layers className="w-4 h-4" />
                        <span>New Video</span>
                    </Command.Item>
                    <Command.Item 
                        onSelect={() => executeCommand('save')}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer hover:bg-zinc-800 text-zinc-200"
                    >
                        <Save className="w-4 h-4" />
                        <span>Save Project</span>
                    </Command.Item>
                    <Command.Item 
                        onSelect={() => executeCommand('export')}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer hover:bg-zinc-800 text-zinc-200"
                    >
                        <Download className="w-4 h-4" />
                        <span>Export / Render</span>
                    </Command.Item>
                </Command.Group>
                
                <Command.Group heading="Quick Navigation" className="text-xs text-zinc-500">
                    <Command.Item 
                        onSelect={() => executeCommand('goto 0')}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer hover:bg-zinc-800 text-zinc-200"
                    >
                        <Clock className="w-4 h-4" />
                        <span>Go to Beginning</span>
                    </Command.Item>
                </Command.Group>
            </Command.List>
            
            <div className="px-4 py-3 border-t border-zinc-800 text-xs text-zinc-500 flex justify-between">
                <span>Press <kbd className="bg-zinc-800 px-1.5 py-0.5 rounded">Enter</kbd> to execute</span>
                <span>Press <kbd className="bg-zinc-800 px-1.5 py-0.5 rounded">Esc</kbd> to close</span>
            </div>
        </Command.Dialog>
    );
}
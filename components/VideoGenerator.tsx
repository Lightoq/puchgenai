
import React, { useState, useEffect, useCallback } from 'react';
import { GoogleGenAI } from '@google/genai';
import { Loader } from './Loader';
import { keyManager } from '../services/keyManager';

type VideoResult = {
    url: string | null;
    prompt: string;
    status: 'success' | 'error' | 'processing';
    error?: string;
    resolution: '720p' | '1080p';
    aspectRatio: '16:9' | '9:16';
};

export const VideoGenerator: React.FC = () => {
    const [prompt, setPrompt] = useState<string>('A neon hologram of a cat driving at top speed in a futuristic city');
    const [resolution, setResolution] = useState<'720p' | '1080p'>('720p');
    const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [videoResult, setVideoResult] = useState<VideoResult | null>(null);
    const [hasKey, setHasKey] = useState<boolean>(false);

    useEffect(() => {
        const checkKey = async () => {
            if (window.aistudio) {
                const selected = await window.aistudio.hasSelectedApiKey();
                setHasKey(selected);
            }
        };
        checkKey();
    }, []);

    const handleSelectKey = async () => {
        if (window.aistudio) {
            await window.aistudio.openSelectKey();
            setHasKey(true);
        }
    };

    const handleGenerate = async () => {
        if (!prompt.trim()) return;
        
        setLoading(true);
        setError(null);
        setVideoResult({ prompt, status: 'processing', resolution, aspectRatio, url: null });

        try {
            // Create a new instance right before making an API call to ensure it uses the most up-to-date API key
            const apiKey = process.env.API_KEY || keyManager.getKey('image_video');
            const ai = new GoogleGenAI({ apiKey });

            let operation = await ai.models.generateVideos({
                model: 'veo-3.1-fast-generate-preview',
                prompt: prompt,
                config: {
                    numberOfVideos: 1,
                    resolution: resolution,
                    aspectRatio: aspectRatio
                }
            });

            // Poll for completion
            while (!operation.done) {
                await new Promise(resolve => setTimeout(resolve, 10000));
                operation = await ai.operations.getVideosOperation({ operation: operation });
            }

            const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
            if (downloadLink) {
                // To fetch the video, append the Gemini API key to the x-goog-api-key header
                const response = await fetch(downloadLink, {
                    method: 'GET',
                    headers: {
                        'x-goog-api-key': apiKey,
                    },
                });
                const blob = await response.blob();
                const url = URL.createObjectURL(blob);
                setVideoResult({ url, prompt, status: 'success', resolution, aspectRatio });
            } else {
                throw new Error('Video generation failed: No download link returned.');
            }
        } catch (e: any) {
            console.error(e);
            if (e.message?.includes('Requested entity was not found.')) {
                setHasKey(false);
                setError('API Key selection reset. Please select a paid API key again.');
            } else {
                setError(e.message || 'An unexpected error occurred during video generation.');
            }
            setVideoResult(null);
        } finally {
            setLoading(false);
        }
    };

    if (!hasKey) {
        return (
            <div className="max-w-2xl mx-auto glass-effect p-12 rounded-[40px] text-center space-y-8 animate-in fade-in zoom-in duration-500">
                <div className="w-20 h-20 bg-rose-500/20 rounded-full flex items-center justify-center mx-auto">
                    <svg className="w-10 h-10 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                </div>
                <div className="space-y-4">
                    <h2 className="text-2xl font-black italic tracking-tighter uppercase text-white">AI Video Generation</h2>
                    <p className="text-sm text-white/60 leading-relaxed">
                        To use high-quality video generation (Veo), you must select a paid API key from a Google Cloud project with billing enabled.
                    </p>
                    <p className="text-[10px] text-white/40 uppercase tracking-widest">
                        Check <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noreferrer" className="text-rose-400 hover:underline">billing documentation</a> for more details.
                    </p>
                </div>
                <button 
                    onClick={handleSelectKey}
                    className="w-full py-5 bg-rose-600 hover:bg-rose-500 text-white rounded-[2rem] text-xs font-black uppercase tracking-[0.3em] transition-all shadow-[0_20px_40px_-10px_rgba(225,29,72,0.4)] active:scale-95"
                >
                    Select API Key to Continue
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto glass-effect p-8 rounded-[40px] animate-rgb-border shadow-2xl">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                <div className="lg:col-span-1 space-y-8">
                    <div>
                        <h2 className="text-2xl font-black italic tracking-tighter animate-rgb-text uppercase">Sáng tạo Video AI</h2>
                        <div className="h-[2px] w-20 bg-gradient-to-r from-rose-500 to-transparent mt-2"></div>
                    </div>

                    <div className="space-y-4">
                         <label className="text-[10px] font-black text-white uppercase tracking-widest ml-1">Mô tả Video</label>
                         <textarea 
                            value={prompt} 
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="Describe the video you want to generate..."
                            rows={5}
                            className="w-full bg-black/60 border border-white/10 rounded-3xl p-5 text-sm text-white focus:border-rose-500/50 outline-none transition-all resize-none shadow-inner"
                         />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-white/40 uppercase tracking-widest ml-1">Độ phân giải</label>
                            <select 
                                value={resolution} 
                                onChange={(e) => setResolution(e.target.value as any)}
                                className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-[10px] font-black text-rose-400 outline-none appearance-none cursor-pointer focus:border-rose-500/50 transition-all"
                            >
                                <option value="720p">720p</option>
                                <option value="1080p">1080p</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-white/40 uppercase tracking-widest ml-1">Khung hình</label>
                            <select 
                                value={aspectRatio} 
                                onChange={(e) => setAspectRatio(e.target.value as any)}
                                className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-[10px] font-black text-rose-400 outline-none appearance-none cursor-pointer focus:border-rose-500/50 transition-all"
                            >
                                <option value="16:9">16:9 (Ngang)</option>
                                <option value="9:16">9:16 (Dọc)</option>
                            </select>
                        </div>
                    </div>

                    <button 
                        onClick={handleGenerate} 
                        disabled={loading || !prompt.trim()} 
                        className="neon-button w-full py-5 rounded-[2rem] text-xs font-black uppercase tracking-[0.3em] text-white shadow-2xl active:scale-95 disabled:opacity-20 transition-all"
                    >
                        {loading ? 'Processing...' : 'Khởi tạo Video'}
                    </button>

                    {error && (
                        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl">
                            <p className="text-[10px] text-rose-400 font-bold uppercase text-center">{error}</p>
                        </div>
                    )}
                </div>

                <div className="lg:col-span-2 min-h-[400px]">
                    {loading ? (
                        <div className="h-full flex flex-col items-center justify-center bg-black/20 rounded-[3rem] border border-white/5 space-y-6">
                             <div className="w-16 h-16"><Loader /></div>
                             <div className="text-center space-y-2">
                                <p className="text-[10px] font-black uppercase tracking-[0.4em] animate-pulse text-rose-500">Neural Synthesis in progress</p>
                                <p className="text-[9px] text-white/30 uppercase tracking-widest">This may take a few minutes. Please wait...</p>
                             </div>
                             <div className="max-w-xs w-full bg-white/5 h-1 rounded-full overflow-hidden">
                                <div className="h-full bg-rose-500 animate-[progress_20s_ease-in-out_infinite]"></div>
                             </div>
                        </div>
                    ) : videoResult?.status === 'success' && videoResult.url ? (
                        <div className="space-y-6 animate-in fade-in zoom-in duration-700">
                            <div className={`relative group ${videoResult.aspectRatio === '16:9' ? 'aspect-video' : 'aspect-[9/16]'} bg-black rounded-[2.5rem] overflow-hidden border border-white/10 shadow-2xl mx-auto max-h-[600px]`}>
                                <video 
                                    src={videoResult.url} 
                                    controls 
                                    autoPlay 
                                    loop 
                                    className="w-full h-full object-contain"
                                />
                                <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <a 
                                        href={videoResult.url} 
                                        download={`video_${Date.now()}.mp4`}
                                        className="p-4 bg-black/60 hover:bg-rose-600 text-white rounded-2xl backdrop-blur-xl border border-white/10 transition-all shadow-2xl flex items-center gap-2 text-[10px] font-black uppercase tracking-widest"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                                        Download
                                    </a>
                                </div>
                            </div>
                            <div className="flex items-center justify-between px-4">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Prompt</p>
                                    <p className="text-xs text-white italic truncate max-w-md">{videoResult.prompt}</p>
                                </div>
                                <div className="text-right space-y-1">
                                    <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Format</p>
                                    <p className="text-xs text-rose-400 font-bold">{videoResult.resolution} • {videoResult.aspectRatio}</p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full border-2 border-dashed border-white/5 rounded-[3rem] flex flex-col items-center justify-center opacity-20 space-y-4">
                            <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                            <span className="text-4xl font-black italic uppercase tracking-tighter text-white">Video Studio</span>
                            <p className="text-[10px] font-black uppercase tracking-[0.3em]">Ready for synthesis</p>
                        </div>
                    )}
                </div>
            </div>
            
            <style dangerouslySetInnerHTML={{ __html: `
                @keyframes progress {
                    0% { width: 0%; }
                    50% { width: 70%; }
                    100% { width: 95%; }
                }
            `}} />
        </div>
    );
};

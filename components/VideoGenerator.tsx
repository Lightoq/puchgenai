
import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import { Loader } from './Loader';
import { keyManager } from '../services/keyManager';

const MODELS = [
    { id: 'veo-3.1-fast-generate-preview', name: 'Veo 3.1 Fast' },
    { id: 'veo-3.1-generate-preview', name: 'Veo 3.1 Pro' },
];

export const VideoGenerator: React.FC = () => {
    const [prompt, setPrompt] = useState('');
    const [selectedModel, setSelectedModel] = useState(MODELS[0].id);
    const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
    const [resolution, setResolution] = useState<'720p' | '1080p'>('720p');
    const [startImage, setStartImage] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [hasApiKey, setHasApiKey] = useState(false);

    useEffect(() => {
        const checkKey = async () => {
            if (window.aistudio && typeof window.aistudio.hasSelectedApiKey === 'function') {
                const selected = await window.aistudio.hasSelectedApiKey();
                setHasApiKey(selected);
            }
        };
        checkKey();
    }, []);

    const handleSelectKey = async () => {
        if (window.aistudio && typeof window.aistudio.openSelectKey === 'function') {
            await window.aistudio.openSelectKey();
            setHasApiKey(true); // Proceed assuming selection success as per race condition guideline
        }
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => setStartImage((ev.target?.result as string).split(',')[1]);
        reader.readAsDataURL(file);
    };

    const handleGenerate = async () => {
        // MANDATORY check for API key selection for Veo models
        if (!hasApiKey && window.aistudio) {
            setError('Vui lòng chọn API Key trả phí (billing enabled) để sử dụng Veo.');
            return;
        }

        const apiKey = keyManager.getKey('image_video');
        if (!apiKey) { setError('Missing Key (Row 2)'); return; }
        setIsGenerating(true); setError(null); setVideoUrl(null);
        
        try {
            // Correct initialization using named parameter and creating instance right before use
            const ai = new GoogleGenAI({ apiKey });
            let op = await ai.models.generateVideos({
                model: selectedModel, prompt,
                image: startImage ? { imageBytes: startImage, mimeType: 'image/jpeg' } : undefined,
                config: { 
                    resolution, 
                    aspectRatio,
                    numberOfVideos: 1 // Must be exactly 1
                }
            });
            while (!op.done) { 
                await new Promise(r => setTimeout(r, 10000)); 
                op = await ai.operations.getVideosOperation({ operation: op }); 
            }
            const link = op.response?.generatedVideos?.[0]?.video?.uri;
            if (link) {
                // Must append API key when fetching from download link
                const res = await fetch(`${link}&key=${process.env.API_KEY || apiKey}`);
                setVideoUrl(URL.createObjectURL(await res.blob()));
            } else throw new Error("Video link not found");
        } catch (e: any) { 
            if (e.message?.includes("Requested entity was not found.")) {
                setHasApiKey(false);
                setError("Dự án chưa bật Billing hoặc API Key không hợp lệ. Vui lòng chọn lại.");
            } else {
                setError(e.message); 
            }
        } finally { 
            setIsGenerating(false); 
        }
    };

    return (
        <div className="max-w-6xl mx-auto glass-effect p-8 rounded-[40px] animate-rgb-border shadow-2xl">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <div className="space-y-8">
                    <div>
                        <h2 className="text-2xl font-black italic tracking-tighter animate-rgb-text uppercase">Sáng tạo Video AI</h2>
                        <div className="h-[2px] w-20 bg-gradient-to-r from-blue-500 to-transparent mt-2"></div>
                    </div>

                    {!hasApiKey && window.aistudio && (
                        <div className="p-6 bg-blue-500/10 border border-blue-500/20 rounded-3xl space-y-4">
                            <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Yêu cầu API Key trả phí cho Veo</p>
                            <p className="text-[11px] text-gray-400 leading-relaxed">Bạn cần chọn một API Key từ dự án Google Cloud có bật thanh toán để sử dụng Veo 3.1.</p>
                            <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noreferrer" className="block text-[10px] font-bold text-blue-500 underline uppercase tracking-tighter">Xem tài liệu Billing</a>
                            <button onClick={handleSelectKey} className="w-full py-3 bg-blue-600 text-white text-[10px] font-black uppercase rounded-xl hover:bg-blue-500 transition-all shadow-lg active:scale-95">
                                Chọn API Key
                            </button>
                        </div>
                    )}

                    <div className="space-y-4">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Mô tả chuyển động</label>
                        <textarea 
                            value={prompt} onChange={(e) => setPrompt(e.target.value)}
                            placeholder="Describe your scene..." rows={4}
                            className="w-full bg-black/60 border border-white/10 rounded-3xl p-5 text-sm text-gray-300 focus:border-blue-500/50 outline-none transition-all resize-none shadow-inner"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Mô hình</label>
                            <select value={selectedModel} onChange={(e) => setSelectedModel(e.target.value)} className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-xs text-gray-400 outline-none">
                                {MODELS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                            </select>
                        </div>
                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Khung hình</label>
                            <select value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value as any)} className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-xs text-gray-400 outline-none">
                                <option value="16:9">Ngang (16:9)</option>
                                <option value="9:16">Dọc (9:16)</option>
                            </select>
                        </div>
                    </div>

                    <div className="p-6 bg-white/5 rounded-3xl border border-white/5 group relative cursor-pointer overflow-hidden transition-all hover:border-blue-500/30">
                        <input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 opacity-0 z-10 cursor-pointer" />
                        <div className="flex items-center gap-4">
                            {startImage ? (
                                <img src={`data:image/jpeg;base64,${startImage}`} className="w-12 h-12 rounded-lg object-cover" />
                            ) : (
                                <div className="p-3 bg-black/40 rounded-xl text-blue-400"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg></div>
                            )}
                            <div>
                                <p className="text-xs font-bold text-gray-300 uppercase">Ảnh tham chiếu (Tùy chọn)</p>
                                <p className="text-[10px] text-gray-600 uppercase tracking-widest">Click to upload frame</p>
                            </div>
                        </div>
                    </div>

                    <button onClick={handleGenerate} disabled={isGenerating} className="neon-button w-full py-5 rounded-[2rem] text-xs font-black uppercase tracking-[0.3em] text-white shadow-2xl active:scale-95 disabled:opacity-20 transition-all">
                        {isGenerating ? 'Neural Rendering...' : 'Tạo Phim AI'}
                    </button>

                    {error && <div className="p-4 bg-red-900/10 border border-red-500/20 rounded-2xl text-[10px] text-red-500 font-black uppercase text-center">{error}</div>}
                </div>

                <div className="relative">
                    {videoUrl ? (
                        <div className={`w-full overflow-hidden rounded-[3rem] border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] bg-black ${aspectRatio === '16:9' ? 'aspect-video' : 'aspect-[9/16] max-w-sm mx-auto'}`}>
                            <video src={videoUrl} controls autoPlay className="w-full h-full object-contain" />
                        </div>
                    ) : (
                        <div className="h-full border-2 border-dashed border-white/5 rounded-[3rem] flex flex-col items-center justify-center opacity-10 gap-6">
                            <svg className="w-20 h-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2-2v8a2 2 0 002 2z" /></svg>
                            <span className="text-3xl font-black italic uppercase tracking-tighter">Ready for Production</span>
                        </div>
                    )}
                    {isGenerating && (
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-md rounded-[3rem] flex flex-col items-center justify-center text-center p-8 z-20">
                             <div className="w-16 h-16 mb-6"><Loader /></div>
                             <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-400 animate-pulse">Veo 3.1 is painting your vision</p>
                             <p className="text-[10px] text-gray-500 mt-4 max-w-xs italic leading-relaxed">Quá trình xử lý video chất lượng cao có thể mất vài phút. Vui lòng không đóng trình duyệt.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

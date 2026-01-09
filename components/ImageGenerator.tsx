
import React, { useState, useMemo } from 'react';
import { GoogleGenAI } from '@google/genai';
import { Loader } from './Loader';
import { keyManager } from '../services/keyManager';

type GeneratedImageResult = {
    url: string | null;
    prompt: string;
    status: 'success' | 'error';
    error?: string;
    aspectRatio: '1:1' | '16:9' | '9:16';
};

const ImageResultCard: React.FC<{ result: GeneratedImageResult; index: number }> = ({ result, index }) => {
    const { url, prompt, status, error, aspectRatio } = result;
    const aspectRatioClass = aspectRatio === '16:9' ? 'aspect-video' : aspectRatio === '9:16' ? 'aspect-[9/16]' : 'aspect-square';

    return (
        <div className={`relative group ${aspectRatioClass} bg-black/40 rounded-3xl overflow-hidden border border-white/5 hover:border-purple-500/50 transition-all animate-in zoom-in duration-500 shadow-2xl`}>
            {status === 'success' && url ? (
                <>
                    <img src={url} alt={prompt} className="w-full h-full object-contain" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                         <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                             <p className="text-[10px] text-white/70 truncate max-w-[70%] font-medium italic">{prompt}</p>
                             <a href={url} download={`image_${index+1}.png`} className="p-3 bg-white/10 hover:bg-purple-600 text-white rounded-2xl transition-all shadow-xl backdrop-blur-md border border-white/10">
                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                             </a>
                         </div>
                    </div>
                </>
            ) : (
                <div className="p-6 flex flex-col items-center justify-center text-center h-full">
                    <span className="text-red-500 font-black uppercase text-xs">Generation Failed</span>
                    <p className="mt-2 text-[10px] text-white/40 line-clamp-3">{error}</p>
                </div>
            )}
        </div>
    );
};

export const ImageGenerator: React.FC = () => {
    const [mode, setMode] = useState<'single' | 'batch'>('single');
    const [singlePrompt, setSinglePrompt] = useState<string>('A photorealistic futuristic city, neon lights, 8k resolution');
    const [batchPrompts, setBatchPrompts] = useState<string>('');
    const [aspectRatio, setAspectRatio] = useState<'1:1' | '16:9' | '9:16'>('1:1');
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [generatedImages, setGeneratedImages] = useState<GeneratedImageResult[]>([]);

    const handleGenerate = async () => {
        const prompts = mode === 'single' ? [singlePrompt.trim()] : batchPrompts.split('\n').filter(p => p.trim());
        if (prompts.length === 0) return;

        const apiKey = keyManager.getKey('image_video');
        if (!apiKey) { setError('Missing API Key in Settings (Row 2)'); return; }

        setLoading(true); setError(null); setGeneratedImages([]);
        try {
            const ai = new GoogleGenAI({ apiKey });
            const results = await Promise.all(prompts.map(async (p) => {
                try {
                    const res = await ai.models.generateContent({
                        model: 'gemini-2.5-flash-image',
                        contents: { parts: [{ text: p }] },
                        config: { imageConfig: { aspectRatio } },
                    });
                    const part = res.candidates?.[0]?.content?.parts.find(pt => pt.inlineData);
                    if (part) return { url: `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`, prompt: p, status: 'success' as const, aspectRatio };
                    throw new Error('No image data');
                } catch (e: any) { return { url: null, prompt: p, status: 'error' as const, error: e.message, aspectRatio }; }
            }));
            setGeneratedImages(results);
        } catch (e: any) { setError(e.message); } finally { setLoading(false); }
    };

    return (
        <div className="max-w-6xl mx-auto glass-effect p-8 rounded-[40px] animate-rgb-border shadow-2xl">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                <div className="lg:col-span-1 space-y-8">
                    <div>
                        <h2 className="text-2xl font-black italic tracking-tighter animate-rgb-text uppercase">Sáng tạo Ảnh AI</h2>
                        <div className="h-[2px] w-20 bg-gradient-to-r from-purple-500 to-transparent mt-2"></div>
                    </div>

                    <div className="flex p-1 bg-black/40 rounded-2xl border border-white/5">
                        <button onClick={() => setMode('single')} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${mode === 'single' ? 'bg-white text-black' : 'text-white/40'}`}>Tạo đơn</button>
                        <button onClick={() => setMode('batch')} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${mode === 'batch' ? 'bg-white text-black' : 'text-white/40'}`}>Hàng loạt</button>
                    </div>

                    <div className="space-y-4">
                         <label className="text-[10px] font-black text-white uppercase tracking-widest ml-1">Mô tả chi tiết</label>
                         <textarea 
                            value={mode === 'single' ? singlePrompt : batchPrompts} 
                            onChange={(e) => mode === 'single' ? setSinglePrompt(e.target.value) : setBatchPrompts(e.target.value)}
                            placeholder={mode === 'single' ? "Enter your prompt..." : "One prompt per line..."}
                            rows={mode === 'single' ? 4 : 8}
                            className="w-full bg-black/60 border border-white/10 rounded-3xl p-5 text-sm text-white focus:border-purple-500/50 outline-none transition-all resize-none shadow-inner"
                         />
                    </div>

                    <div className="space-y-4">
                         <label className="text-[10px] font-black text-white uppercase tracking-widest ml-1">Khung hình</label>
                         <div className="grid grid-cols-3 gap-2">
                             {(['1:1', '16:9', '9:16'] as const).map(r => (
                                 <button key={r} onClick={() => setAspectRatio(r)} className={`py-3 rounded-xl text-[10px] font-bold border transition-all ${aspectRatio === r ? 'border-purple-500 bg-purple-500/10 text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.2)]' : 'border-white/5 text-white/40 hover:border-white/20'}`}>{r}</button>
                             ))}
                         </div>
                    </div>

                    <button onClick={handleGenerate} disabled={loading} className="neon-button w-full py-5 rounded-[2rem] text-xs font-black uppercase tracking-[0.3em] text-white shadow-2xl active:scale-95 disabled:opacity-20 transition-all">
                        {loading ? 'Processing...' : 'Khởi tạo Hình ảnh'}
                    </button>
                </div>

                <div className="lg:col-span-2 min-h-[400px]">
                    {loading ? (
                        <div className="h-full flex flex-col items-center justify-center opacity-40">
                             <div className="w-12 h-12 mb-4"><Loader /></div>
                             <p className="text-[10px] font-black uppercase tracking-widest animate-pulse text-white">Neural engine is thinking...</p>
                        </div>
                    ) : generatedImages.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {generatedImages.map((res, i) => <ImageResultCard key={i} result={res} index={i} />)}
                        </div>
                    ) : (
                        <div className="h-full border-2 border-dashed border-white/5 rounded-[3rem] flex items-center justify-center opacity-10">
                            <span className="text-4xl font-black italic uppercase tracking-tighter text-white">No Output yet</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};


import React, { useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import { Loader } from './Loader';
import { keyManager } from '../services/keyManager';

export const AudioTranscriber: React.FC = () => {
    const [audioFile, setAudioFile] = useState<File | null>(null);
    const [audioBase64, setAudioBase64] = useState<string | null>(null);
    const [srtResult, setSrtResult] = useState<string>('');
    const [isTranscribing, setIsTranscribing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        
        setAudioFile(file);
        const reader = new FileReader();
        reader.onload = (ev) => {
            const base64 = (ev.target?.result as string).split(',')[1];
            setAudioBase64(base64);
        };
        reader.readAsDataURL(file);
        setSrtResult('');
        setError(null);
    };

    const handleTranscribe = async () => {
        if (!audioBase64 || !audioFile) return;

        const apiKey = process.env.API_KEY || keyManager.getKey('translate');
        if (!apiKey) {
            setError('Thiếu API Key (Vui lòng cấu hình Dòng 3 trong phần Cài đặt).');
            return;
        }

        setIsTranscribing(true);
        setError(null);
        setSrtResult('');

        try {
            const ai = new GoogleGenAI({ apiKey });
            // Sử dụng gemini-3-flash-preview vì nó hỗ trợ multimodal (âm thanh) cực tốt
            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: [
                    {
                        parts: [
                            {
                                inlineData: {
                                    mimeType: audioFile.type || 'audio/mpeg',
                                    data: audioBase64
                                }
                            },
                            {
                                text: "Bạn là một chuyên gia tạo phụ đề. Hãy nghe kỹ file âm thanh này và tạo file phụ đề định dạng .srt hoàn chỉnh. Yêu cầu: 1. Mốc thời gian (timestamps) phải khớp chính xác với lời nói. 2. Nội dung text phải đúng chính tả tiếng Việt. 3. Chỉ trả về nội dung file .srt, không thêm bất kỳ lời dẫn hay giải thích nào khác."
                            }
                        ]
                    }
                ],
                config: {
                    temperature: 0.1, // Thấp để đảm bảo tính chính xác
                }
            });

            const text = response.text;
            if (text) {
                // Đôi khi AI trả về markdown code block, ta cần lọc lấy nội dung bên trong
                const cleanedText = text.replace(/```srt/g, '').replace(/```/g, '').trim();
                setSrtResult(cleanedText);
            } else {
                throw new Error("Không nhận được dữ liệu từ Neural Engine.");
            }
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Lỗi khi xử lý âm thanh. File có thể quá lớn hoặc định dạng không khớp.');
        } finally {
            setIsTranscribing(false);
        }
    };

    const downloadSrt = () => {
        if (!srtResult) return;
        const blob = new Blob([srtResult], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${audioFile?.name.split('.')[0] || 'subtitle'}.srt`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="max-w-6xl mx-auto glass-effect p-8 rounded-[40px] animate-rgb-border shadow-2xl">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                <div className="lg:col-span-1 space-y-8">
                    <div>
                        <h2 className="text-2xl font-black italic tracking-tighter animate-rgb-text uppercase leading-none">Tạo Phụ Đề .SRT</h2>
                        <div className="h-[2px] w-20 bg-gradient-to-r from-teal-500 to-transparent mt-2"></div>
                        <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mt-2 opacity-60">Audio to Text Neural Sync</p>
                    </div>

                    <div className="p-8 bg-black/40 rounded-[2.5rem] border border-dashed border-white/10 hover:border-teal-500/30 transition-all group relative cursor-pointer overflow-hidden text-center shadow-inner">
                        <input type="file" accept="audio/*" onChange={handleFileChange} className="absolute inset-0 opacity-0 z-10 cursor-pointer" />
                        <div className="space-y-4">
                            <div className="mx-auto w-16 h-16 bg-teal-500/10 rounded-2xl flex items-center justify-center text-teal-400 group-hover:scale-110 transition-transform border border-teal-500/20 shadow-[0_0_20px_rgba(20,184,166,0.1)]">
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" /></svg>
                            </div>
                            <div>
                                <p className="text-xs font-black text-gray-300 uppercase tracking-widest truncate max-w-full px-2">
                                    {audioFile ? audioFile.name : 'Chọn File Âm Thanh'}
                                </p>
                                <p className="text-[9px] text-gray-600 uppercase tracking-[0.2em] mt-2">Hỗ trợ MP3, WAV, M4A...</p>
                            </div>
                        </div>
                    </div>

                    <button 
                        onClick={handleTranscribe} 
                        disabled={isTranscribing || !audioBase64} 
                        className="neon-button w-full py-5 rounded-[2rem] text-xs font-black uppercase tracking-[0.3em] text-white shadow-2xl active:scale-95 disabled:opacity-20 transition-all"
                    >
                        {isTranscribing ? 'AI Đang Phân Tích...' : 'Bắt Đầu Chuyển Đổi'}
                    </button>

                    {error && (
                        <div className="p-4 bg-red-900/10 border border-red-500/20 rounded-2xl text-[10px] text-red-500 font-black uppercase text-center animate-in fade-in duration-300">
                            {error}
                        </div>
                    )}

                    <div className="bg-black/60 p-6 rounded-3xl border border-white/5 space-y-4 shadow-inner relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-teal-500/50"></div>
                        <h3 className="text-[10px] font-black text-teal-500 uppercase tracking-widest flex items-center gap-2 pl-2">
                             System Logic
                        </h3>
                        <p className="text-[10px] text-gray-500 leading-relaxed font-bold uppercase tracking-tight pl-2">
                            Gemini Neural Engine sẽ "nghe" trực tiếp file của bạn để tạo ra các mốc thời gian (start/end) khớp nhất với giọng nói.
                        </p>
                    </div>
                </div>

                <div className="lg:col-span-2 space-y-6">
                    <div className="flex justify-between items-center px-1">
                        <label className="text-[10px] font-black text-teal-500 uppercase tracking-widest flex items-center gap-2">
                            <span className="h-1.5 w-1.5 rounded-full bg-teal-500 animate-pulse"></span>
                            Bản thảo Phụ Đề (SRT)
                        </label>
                        {srtResult && (
                            <div className="flex items-center gap-4">
                                <button 
                                    onClick={() => {
                                        navigator.clipboard.writeText(srtResult);
                                        alert("Đã copy phụ đề!");
                                    }}
                                    className="text-[9px] font-black text-gray-500 hover:text-white uppercase tracking-widest transition-all"
                                >
                                    Copy
                                </button>
                                <button onClick={downloadSrt} className="text-[9px] font-black text-teal-400 hover:text-white uppercase tracking-[0.2em] transition-all flex items-center gap-2">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                                    Tải Xuống File
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="w-full h-[600px] bg-black/80 border border-white/10 rounded-[2.5rem] p-8 text-xs font-mono text-teal-500/80 shadow-[inset_0_2px_30px_rgba(0,0,0,0.8)] relative overflow-hidden leading-relaxed">
                        {isTranscribing && (
                            <div className="absolute inset-0 bg-black/60 backdrop-blur-md z-20 flex flex-col items-center justify-center">
                                <Loader />
                                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-teal-500 mt-6 animate-pulse">Neural Deciphering...</span>
                            </div>
                        )}
                        {srtResult ? (
                            <pre className="whitespace-pre-wrap h-full overflow-y-auto no-scrollbar selection:bg-teal-500/40 pr-2">
                                {srtResult}
                            </pre>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center opacity-10 text-center space-y-4">
                                <svg className="w-20 h-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                                <span className="text-3xl font-black italic uppercase tracking-tighter">Ready for Transcription</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

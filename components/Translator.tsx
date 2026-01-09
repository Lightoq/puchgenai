
import React, { useState, useCallback } from 'react';
import { GoogleGenAI } from '@google/genai';
import { Loader } from './Loader';
import { FileUpload } from './FileUpload';
import { keyManager } from '../services/keyManager';

const LANGUAGES = [
    { code: 'en', name: 'English' },
    { code: 'vi', name: 'Vietnamese' },
    { code: 'ja', name: 'Japanese' },
    { code: 'ko', name: 'Korean' },
    { code: 'zh', name: 'Chinese' },
];

const ENGINES = [
    { id: 'gemini-3-flash-preview', name: 'Gemini 3 Flash (Latest)' },
    { id: 'gemini-flash-lite-latest', name: 'Gemini Flash Lite' },
    { id: 'google-translate', name: 'Google Translate Mode' },
];

export const Translator: React.FC = () => {
    const [inputText, setInputText] = useState('');
    const [translatedText, setTranslatedText] = useState('');
    const [targetLanguage, setTargetLanguage] = useState('en');
    const [selectedEngine, setSelectedEngine] = useState('gemini-3-flash-preview');
    const [loading, setLoading] = useState(false);

    const handleTranslate = useCallback(async () => {
        // Favor process.env.API_KEY exclusively for Gemini API calls.
        const apiKey = process.env.API_KEY || keyManager.getKey('translate');
        if (!apiKey) {
            alert("Vui lòng cấu hình API Key (process.env.API_KEY) để tiếp tục.");
            return;
        }
        
        setLoading(true); 
        setTranslatedText('');
        
        try {
            // Always initialize using process.env.API_KEY directly where possible
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || apiKey });
            const langObj = LANGUAGES.find(l => l.code === targetLanguage);
            const langName = langObj?.name || 'English';
            
            let modelId = selectedEngine;
            let systemPrompt = "You are a professional multi-language translator. Return ONLY the translated text without any explanations or conversational filler. Keep original formatting.";
            
            if (selectedEngine === 'google-translate') {
                modelId = 'gemini-3-flash-preview';
                systemPrompt = "You are Google Translate. Provide a direct, high-accuracy translation into the target language. No conversational filler, no explanations, just the translated text.";
            }

            // Using ai.models.generateContent for translation task
            const response = await ai.models.generateContent({
                model: modelId,
                contents: `Translate the following text to ${langName}, maintaining all formatting:\n\n${inputText}`,
                config: { 
                    systemInstruction: systemPrompt, 
                    temperature: 0.1
                }
            });
            
            // Accessing the .text property directly from the response object
            setTranslatedText(response.text || '');
        } catch (e: any) { 
            console.error(e);
            setTranslatedText(`Lỗi hệ thống: ${e.message}`);
        } finally { 
            setLoading(false); 
        }
    }, [inputText, targetLanguage, selectedEngine]);

    const handleDownloadTxt = () => {
        if (!translatedText) return;
        const blob = new Blob([translatedText], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `translation_${targetLanguage}_${new Date().getTime()}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="max-w-6xl mx-auto glass-effect p-8 rounded-[40px] animate-rgb-border shadow-2xl">
            {/* Header Area */}
            <div className="border-b border-white/5 pb-6 mb-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h2 className="text-2xl font-black italic tracking-tighter animate-rgb-text uppercase leading-none">Dịch thuật AI</h2>
                        <div className="flex items-center gap-x-3 text-[9px] font-black mt-2 uppercase tracking-widest text-green-500/50">
                            Neural Linguistic Engine
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        {/* Engine Selector */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[9px] font-black text-white uppercase tracking-widest ml-1">Engine</label>
                            <select 
                                value={selectedEngine} 
                                onChange={(e) => setSelectedEngine(e.target.value)} 
                                className="bg-black border border-white/10 rounded-xl px-4 py-2.5 text-[10px] font-black text-green-400 outline-none appearance-none cursor-pointer focus:border-green-500/50 transition-all shadow-inner"
                            >
                                {ENGINES.map(e => (
                                    <option key={e.id} value={e.id} className="bg-black text-white">{e.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Language Selector */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[9px] font-black text-white uppercase tracking-widest ml-1">Đích</label>
                            <select 
                                value={targetLanguage} 
                                onChange={(e) => setTargetLanguage(e.target.value)} 
                                className="bg-black border border-white/10 rounded-xl px-4 py-2.5 text-[10px] font-black text-green-400 outline-none appearance-none cursor-pointer focus:border-green-500/50 transition-all shadow-inner"
                            >
                                {LANGUAGES.map(l => (
                                    <option key={l.code} value={l.code} className="bg-black text-white">{l.name}</option>
                                ))}
                            </select>
                        </div>

                        <button 
                            onClick={handleTranslate} 
                            disabled={loading || !inputText.trim()} 
                            className="h-fit mt-auto bg-green-600 hover:bg-green-500 text-black px-8 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all shadow-[0_10px_20px_-5px_rgba(34,197,94,0.3)] active:scale-95 disabled:opacity-10"
                        >
                            {loading ? 'Processing...' : 'Translate'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Translation Workspace */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Input Section */}
                <div className="space-y-4">
                    <div className="flex justify-between items-center px-1">
                        <label className="text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-2">
                            <span className="h-1.5 w-1.5 rounded-full bg-white/20"></span>
                            Nội dung gốc
                        </label>
                        <FileUpload onFileProcessed={(c) => setInputText(typeof c === 'string' ? c : c.map(i => i.text).join('\n'))} />
                    </div>
                    <div className="relative group">
                        <textarea 
                            value={inputText} 
                            onChange={(e) => setInputText(e.target.value)} 
                            rows={12} 
                            className="w-full bg-black/60 border border-white/10 rounded-[2.5rem] p-8 text-sm text-white/90 focus:border-green-500/50 outline-none transition-all resize-none shadow-[inset_0_2px_15px_rgba(0,0,0,0.5)] leading-relaxed" 
                            placeholder="Nhập hoặc dán văn bản cần dịch..." 
                        />
                        <div className="absolute bottom-6 right-6 text-[9px] font-black text-white/20 uppercase tracking-widest">
                            {inputText.length} Chars
                        </div>
                    </div>
                </div>

                {/* Output Section */}
                <div className="space-y-4">
                    <div className="flex justify-between items-center px-1">
                        <label className="text-[10px] font-black text-green-500 uppercase tracking-widest flex items-center gap-2">
                            <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse"></span>
                            Kết quả Neural
                        </label>
                        {translatedText && (
                            <div className="flex items-center gap-4">
                                <button 
                                    onClick={() => {
                                        navigator.clipboard.writeText(translatedText);
                                        alert("Đã sao chép bản dịch!");
                                    }} 
                                    className="text-[9px] font-black text-green-400 hover:text-white uppercase tracking-widest transition-colors flex items-center gap-1.5"
                                >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"></path></svg>
                                    Copy Result
                                </button>
                                <button 
                                    onClick={handleDownloadTxt} 
                                    className="text-[9px] font-black text-blue-400 hover:text-white uppercase tracking-widest transition-colors flex items-center gap-1.5"
                                >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                                    Download TXT
                                </button>
                            </div>
                        )}
                    </div>
                    <div className="w-full bg-black/80 border border-white/10 rounded-[2.5rem] p-8 text-sm text-white/80 min-h-[300px] h-full shadow-[inset_0_2px_15px_rgba(0,0,0,0.8)] relative overflow-hidden leading-relaxed">
                        {loading ? (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm z-20">
                                <Loader />
                                <span className="text-[9px] font-black uppercase tracking-[0.3em] text-green-500 mt-4 animate-pulse">
                                    Deep Learning in progress
                                </span>
                            </div>
                        ) : translatedText ? (
                            <div className="animate-in fade-in duration-700 whitespace-pre-wrap">
                                {translatedText}
                            </div>
                        ) : (
                            <span className="text-white/10 italic font-medium">Bản dịch sẽ hiển thị tại đây sau khi xử lý...</span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

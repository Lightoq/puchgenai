
import React, { useState } from 'react';
import type { SpeakerGroup } from '../types';
import { FileUpload } from './FileUpload';

interface ConfigurationProps {
    speaker: string;
    setSpeaker: (speakerId: string) => void;
    selectedCountry: string;
    onCountryChange: (country: string) => void;
    speakerGroups: SpeakerGroup[];
    isProcessing: boolean;
    onProcessQueue: () => void;
    onAddContent: (content: string | Array<{ text: string; timestamp: string }>) => void;
    pendingChunksCount: number;
    maxChars: number;
    setMaxChars: (value: number) => void;
    minCharsToMerge: number;
    setMinCharsToMerge: (value: number) => void;
    concurrentThreads: number;
    setConcurrentThreads: (value: number) => void;
    requestDelay: number;
    setRequestDelay: (value: number) => void;
    speed: number;
    setSpeed: (value: number) => void;
}

const SPEED_PRESETS = [0.8, 1.0, 1.2, 1.5, 2.0];

export const Configuration: React.FC<ConfigurationProps> = ({
    speaker, setSpeaker, selectedCountry, onCountryChange, speakerGroups, isProcessing,
    onProcessQueue, onAddContent, pendingChunksCount,
    maxChars, setMaxChars, minCharsToMerge, setMinCharsToMerge,
    concurrentThreads, setConcurrentThreads, requestDelay, setRequestDelay,
    speed, setSpeed
}) => {
    const [textToAdd, setTextToAdd] = useState('');
    const [showAdvanced, setShowAdvanced] = useState(false);

    const handleAddTextJob = () => {
        if (!textToAdd.trim()) return;
        onAddContent(textToAdd.trim());
        setTextToAdd('');
    };

    const handleFileAdded = (content: string | Array<{ text: string; timestamp: string }>) => {
        onAddContent(content);
    };
    
    const availableSpeakers = speakerGroups.find(g => g.country === selectedCountry)?.speakers || [];

    return (
        <div className="glass-effect p-7 rounded-[2.5rem] shadow-2xl h-fit flex flex-col animate-rgb-border">
            <div className="space-y-6">
                <div className="border-b border-white/5 pb-5 mb-6">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-teal-500/10 rounded-xl border border-teal-500/20 shadow-[0_0_15px_rgba(20,184,166,0.1)]">
                                <svg className="w-5 h-5 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path></svg>
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-white uppercase tracking-tighter italic leading-none">Cấu hình Voice</h2>
                                <div className="flex items-center gap-x-3 text-[9px] font-black mt-1.5 uppercase tracking-widest">
                                    <span className="text-teal-500">Neural Generation Core</span>
                                </div>
                            </div>
                        </div>
                        <span className="text-[8px] font-black bg-white/10 px-3 py-1 rounded-full text-white tracking-widest border border-white/10 uppercase">V1.3.5</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-white uppercase tracking-widest ml-1">Ngôn ngữ</label>
                        <select
                            value={selectedCountry}
                            onChange={(e) => onCountryChange(e.target.value)}
                            className="w-full bg-black border border-white/10 rounded-2xl p-3.5 text-sm text-gray-200 focus:border-teal-500/50 outline-none transition-all shadow-inner appearance-none"
                        >
                            {speakerGroups.map(group => (
                                <option key={group.country} value={group.country} className="bg-black text-white">{group.country}</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-white uppercase tracking-widest ml-1">Giọng đọc</label>
                        <select
                            value={speaker}
                            onChange={(e) => setSpeaker(e.target.value)}
                            className="w-full bg-black border border-white/10 rounded-2xl p-3.5 text-sm text-gray-200 focus:border-teal-500/50 outline-none transition-all shadow-inner appearance-none"
                            disabled={availableSpeakers.length === 0}
                        >
                            {availableSpeakers.map(spk => (
                                <option key={spk.id} value={spk.id} className="bg-black text-white">{spk.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="bg-black/40 p-5 rounded-2xl border border-white/5 space-y-4 shadow-inner">
                    <div className="flex items-center justify-between">
                        <label className="text-xs font-black text-white flex items-center gap-2 uppercase tracking-tighter">
                            <span className="text-teal-500 text-[8px]">●</span> Tốc độ: <span className="text-teal-400 font-mono text-sm">{speed.toFixed(1)}x</span>
                        </label>
                    </div>
                    <input 
                        type="range" min="0.5" max="2.0" step="0.1" 
                        value={speed} onChange={e => setSpeed(parseFloat(e.target.value))}
                        className="w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-teal-500"
                    />
                    <div className="flex flex-wrap gap-2">
                        {SPEED_PRESETS.map(val => (
                            <button
                                key={val}
                                onClick={() => setSpeed(val)}
                                className={`px-3 py-1.5 text-[10px] font-black rounded-xl transition-all ${speed === val ? 'bg-teal-500 text-black shadow-[0_0_15px_rgba(20,184,166,0.4)]' : 'bg-gray-900 text-white/40 hover:text-white'}`}
                            >
                                {val}x
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <button 
                        onClick={() => setShowAdvanced(!showAdvanced)} 
                        className="w-full flex items-center justify-between p-4 rounded-2xl bg-black/20 border border-white/5 hover:border-white/10 transition-all group"
                    >
                        <span className="flex items-center gap-3 text-white group-hover:text-white/80 font-black uppercase tracking-widest text-[10px]">
                            Tham số nâng cao
                        </span>
                        <svg className={`h-4 w-4 text-white/40 transition-transform duration-500 ${showAdvanced ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7"></path></svg>
                    </button>
                    
                    {showAdvanced && (
                        <div className="mt-4 grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-white uppercase tracking-widest ml-1">Luồng xử lý</label>
                                <input 
                                    type="number" value={concurrentThreads} 
                                    onChange={e => setConcurrentThreads(Math.min(10, parseInt(e.target.value, 10)))}
                                    className="w-full bg-black/60 border border-white/10 rounded-xl p-3 text-sm text-gray-200 outline-none focus:border-teal-500/40 shadow-inner"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-white uppercase tracking-widest ml-1">Độ trễ (ms)</label>
                                <input 
                                    type="number" value={requestDelay} 
                                    onChange={e => setRequestDelay(parseInt(e.target.value, 10))}
                                    className="w-full bg-black/60 border border-white/10 rounded-xl p-3 text-sm text-gray-200 outline-none focus:border-teal-500/40 shadow-inner"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-white uppercase tracking-widest ml-1">Ký tự tối đa/đoạn</label>
                                <input 
                                    type="number" value={maxChars} 
                                    onChange={e => setMaxChars(parseInt(e.target.value, 10))}
                                    className="w-full bg-black/60 border border-white/10 rounded-xl p-3 text-sm text-gray-200 outline-none focus:border-teal-500/40 shadow-inner"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-white uppercase tracking-widest ml-1">Ký tự tối thiểu gộp</label>
                                <input 
                                    type="number" value={minCharsToMerge} 
                                    onChange={e => setMinCharsToMerge(parseInt(e.target.value, 10))}
                                    className="w-full bg-black/60 border border-white/10 rounded-xl p-3 text-sm text-gray-200 outline-none focus:border-teal-500/40 shadow-inner"
                                />
                            </div>
                        </div>
                    )}
                </div>

                <div className="space-y-4 pt-4 border-t border-white/5">
                    <div className="bg-black/60 border border-white/10 rounded-[2rem] overflow-hidden focus-within:border-teal-500/40 transition-all shadow-[inset_0_2px_15px_rgba(0,0,0,0.5)] relative group">
                        <textarea
                            value={textToAdd}
                            onChange={(e) => setTextToAdd(e.target.value)}
                            placeholder="Dán nội dung văn bản..."
                            rows={6}
                            className="w-full border-0 resize-none p-6 text-sm bg-transparent text-gray-300 placeholder-white/10 focus:ring-0 leading-relaxed font-medium"
                        />
                        <div className="flex items-center justify-between p-4 bg-white/[0.02] border-t border-white/5">
                            <FileUpload onFileProcessed={handleFileAdded} />
                            <button
                                onClick={handleAddTextJob}
                                disabled={!textToAdd.trim()}
                                className="flex items-center gap-2 py-2.5 px-8 rounded-2xl text-[10px] font-black uppercase tracking-widest text-black bg-white hover:bg-teal-400 transition-all shadow-xl disabled:opacity-5 active:scale-95"
                            >
                                Thêm Queue
                            </button>
                        </div>
                    </div>
                </div>

                <button
                    onClick={onProcessQueue}
                    disabled={isProcessing || pendingChunksCount === 0}
                    className="neon-button w-full py-5 rounded-[2rem] text-[11px] font-black uppercase tracking-[0.4em] text-white shadow-2xl transition-all active:scale-[0.98] disabled:opacity-20"
                >
                    {isProcessing ? 'ENGINE RUNNING...' : `START SYNTHESIS (${pendingChunksCount})`}
                </button>
            </div>
        </div>
    );
};

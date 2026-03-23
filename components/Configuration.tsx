
import React, { useState, memo } from 'react';
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
}

export const Configuration: React.FC<ConfigurationProps> = memo(({
    speaker, setSpeaker, selectedCountry, onCountryChange, speakerGroups, isProcessing,
    onProcessQueue, onAddContent, pendingChunksCount,
    maxChars, setMaxChars, minCharsToMerge, setMinCharsToMerge,
    concurrentThreads, setConcurrentThreads, requestDelay, setRequestDelay
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
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm h-fit flex flex-col overflow-hidden">
            <div className="p-6 space-y-6">
                <div className="border-b border-gray-100 pb-4">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-50 rounded-lg border border-blue-100">
                                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path></svg>
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">Cấu hình Tổng hợp</h2>
                                <p className="text-xs text-gray-500 font-medium">Tùy chỉnh các tham số giọng nói neural</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-gray-700 ml-1">Ngôn ngữ</label>
                        <select
                            value={selectedCountry}
                            onChange={(e) => onCountryChange(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                        >
                            {speakerGroups.map(group => (
                                <option key={group.country} value={group.country}>{group.country}</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-gray-700 ml-1">Hồ sơ Giọng nói</label>
                        <select
                            value={speaker}
                            onChange={(e) => setSpeaker(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all disabled:opacity-50"
                            disabled={availableSpeakers.length === 0}
                        >
                            {availableSpeakers.map(spk => (
                                <option key={spk.id} value={spk.id}>{spk.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div>
                    <button 
                        onClick={() => setShowAdvanced(!showAdvanced)} 
                        className="w-full flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-all group"
                    >
                        <span className="flex items-center gap-2 text-gray-700 font-semibold text-xs">
                            Tham số Nâng cao
                        </span>
                        <svg className={`h-4 w-4 text-gray-400 transition-transform duration-300 ${showAdvanced ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                    </button>
                    
                    {showAdvanced && (
                        <div className="mt-4 grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider ml-1">Luồng</label>
                                <input 
                                    type="number" value={concurrentThreads} 
                                    onChange={e => setConcurrentThreads(Math.min(10, parseInt(e.target.value, 10)))}
                                    className="w-full bg-white border border-gray-200 rounded-lg p-2 text-sm text-gray-900 outline-none focus:border-blue-500"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider ml-1">Độ trễ (ms)</label>
                                <input 
                                    type="number" value={requestDelay} 
                                    onChange={e => setRequestDelay(parseInt(e.target.value, 10))}
                                    className="w-full bg-white border border-gray-200 rounded-lg p-2 text-sm text-gray-900 outline-none focus:border-blue-500"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider ml-1">Ký tự tối đa</label>
                                <input 
                                    type="number" value={maxChars} 
                                    onChange={e => setMaxChars(parseInt(e.target.value, 10))}
                                    className="w-full bg-white border border-gray-200 rounded-lg p-2 text-sm text-gray-900 outline-none focus:border-blue-500"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider ml-1">Gộp tối thiểu</label>
                                <input 
                                    type="number" value={minCharsToMerge} 
                                    onChange={e => setMinCharsToMerge(parseInt(e.target.value, 10))}
                                    className="w-full bg-white border border-gray-200 rounded-lg p-2 text-sm text-gray-900 outline-none focus:border-blue-500"
                                />
                            </div>
                        </div>
                    )}
                </div>

                <div className="space-y-4 pt-4 border-t border-gray-100">
                    <div className="bg-gray-50 border border-gray-200 rounded-xl overflow-hidden focus-within:border-blue-500/50 transition-all relative">
                        <textarea
                            value={textToAdd}
                            onChange={(e) => setTextToAdd(e.target.value)}
                            placeholder="Nhập hoặc dán nội dung văn bản tại đây..."
                            rows={6}
                            className="w-full border-0 resize-none p-4 text-sm bg-transparent text-gray-900 placeholder-gray-400 focus:ring-0 leading-relaxed font-medium"
                        />
                        <div className="flex items-center justify-between p-3 bg-white border-t border-gray-100">
                            <FileUpload onFileProcessed={handleFileAdded} />
                            <button
                                onClick={handleAddTextJob}
                                disabled={!textToAdd.trim()}
                                className="flex items-center gap-2 py-2 px-6 rounded-lg text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-all disabled:opacity-20 active:scale-95"
                            >
                                Thêm vào Hàng chờ
                            </button>
                        </div>
                    </div>
                </div>

                <button
                    onClick={onProcessQueue}
                    disabled={isProcessing || pendingChunksCount === 0}
                    className="w-full py-4 rounded-xl text-sm font-bold uppercase tracking-widest text-white bg-gray-900 hover:bg-black transition-all active:scale-[0.98] disabled:opacity-10 shadow-lg shadow-gray-200"
                >
                    {isProcessing ? 'Đang xử lý...' : `Bắt đầu Tổng hợp (${pendingChunksCount})`}
                </button>
            </div>
        </div>
    );
});

Configuration.displayName = 'Configuration';


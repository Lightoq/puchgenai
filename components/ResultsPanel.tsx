
import React from 'react';
import type { ChunkJob, ProcessingState } from '../types';
import { ChunkCard } from './ChunkCard';

interface ResultsPanelProps {
    chunks: ChunkJob[];
    processingState: ProcessingState;
    mergedAudioUrl: string | null;
    onCancel: () => void;
    removeChunk: (chunkId: string) => void;
    onClearQueue: () => void;
    onDownloadAll: () => void;
    onDownloadSrt: () => void;
    onRetryChunk: (chunkId: string) => void;
    onRetryAllFailed: () => void;
    successfulChunksCount: number;
    failedChunksCount: number;
    remainingChunksCount: number;
    totalChunksCount: number;
}

export const ResultsPanel: React.FC<ResultsPanelProps> = ({ 
    chunks, processingState, mergedAudioUrl, onCancel, removeChunk, onClearQueue, onDownloadAll, onDownloadSrt,
    onRetryChunk, onRetryAllFailed, successfulChunksCount, failedChunksCount, remainingChunksCount, totalChunksCount
}) => {
    
    return (
        <div className="glass-effect p-7 rounded-[2.5rem] shadow-2xl h-full flex flex-col animate-rgb-border">
             <div className="border-b border-white/5 pb-5 mb-6">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-500/10 rounded-xl border border-indigo-500/20 shadow-[0_0_15px_rgba(79,70,229,0.1)]">
                            <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-gray-100 uppercase tracking-tighter italic">Hàng đợi & Phân đoạn</h2>
                            {totalChunksCount > 0 && (
                                <div className="flex items-center gap-x-3 text-[9px] font-black mt-1.5 uppercase tracking-widest">
                                    <span className="text-gray-600">Total: {totalChunksCount}</span>
                                    <span className="text-teal-500">Done: {successfulChunksCount}</span>
                                    {failedChunksCount > 0 && <span className="text-red-500">Fail: {failedChunksCount}</span>}
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {processingState === 'idle' && chunks.length > 0 && !mergedAudioUrl && (
                             <button
                                onClick={onClearQueue}
                                className="p-2.5 text-gray-600 hover:text-white hover:bg-white/5 rounded-2xl transition-all active:scale-90"
                                title="Xóa hàng đợi"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                            </button>
                        )}
                        {processingState === 'processing' && (
                             <button
                                onClick={onCancel}
                                className="flex items-center gap-2 py-2 px-5 bg-red-600/10 text-red-500 border border-red-500/30 rounded-2xl text-[10px] font-black uppercase hover:bg-red-600 hover:text-white transition-all shadow-xl active:scale-95"
                            >
                                <span className="relative flex h-2 w-2">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                                </span>
                                Hủy Bỏ
                            </button>
                        )}
                    </div>
                 </div>
             </div>
            
             {mergedAudioUrl && (
                <div className="mb-6 p-6 bg-white/[0.03] rounded-[2rem] border border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.5)] relative overflow-hidden group animate-in zoom-in duration-500">
                    <div className="relative z-10 space-y-6">
                        <div className="flex justify-between items-center">
                            <h3 className="text-[10px] font-black text-teal-400 uppercase tracking-widest flex items-center gap-3">
                                <span className="h-1.5 w-1.5 rounded-full bg-teal-500 animate-pulse"></span>
                                Production Ready (Full Length)
                            </h3>
                        </div>
                        <audio controls src={mergedAudioUrl} className="w-full h-11 accent-teal-500 filter invert grayscale opacity-70 hover:opacity-100 transition-opacity">
                            Trình duyệt không hỗ trợ.
                        </audio>
                        <div className="flex gap-4">
                            <button
                                onClick={onDownloadAll}
                                className="flex-1 flex items-center justify-center gap-3 py-4.5 px-4 rounded-2xl text-[10px] font-black text-white bg-teal-600 hover:bg-teal-500 shadow-[0_10px_20px_-5px_rgba(20,184,166,0.3)] transition-all active:scale-[0.97] uppercase tracking-widest"
                            >
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                                Tải Audio
                            </button>
                            <button
                                onClick={onDownloadSrt}
                                className="flex-1 flex items-center justify-center gap-3 py-4.5 px-4 rounded-2xl text-[10px] font-black text-white bg-indigo-600 hover:bg-indigo-500 shadow-[0_10px_20px_-5px_rgba(79,70,229,0.3)] transition-all active:scale-[0.97] uppercase tracking-widest"
                            >
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"></path></svg>
                                Tải Phụ Đề
                            </button>
                        </div>
                    </div>
                </div>
            )}

             <div className="flex-grow overflow-y-auto no-scrollbar pr-1 space-y-4">
                {chunks.map((chunk, index) => (
                    <ChunkCard 
                        key={chunk.id} 
                        chunk={chunk} 
                        index={index} 
                        onRemove={removeChunk}
                        onRetry={onRetryChunk}
                    />
                ))}
                
                {chunks.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-center text-gray-800 space-y-8 py-20 opacity-20 filter grayscale">
                        <svg className="w-24 h-24" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
                        <div className="space-y-2">
                             <p className="font-black text-2xl uppercase tracking-tighter italic">System Idle</p>
                             <p className="text-[10px] uppercase tracking-[0.4em] font-bold">Input content to initialize</p>
                        </div>
                    </div>
                )}
             </div>
        </div>
    );
};

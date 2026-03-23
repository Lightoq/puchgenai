
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
    onRetryChunk: (chunkId: string) => void;
    onRetryAllFailed: () => void;
    successfulChunksCount: number;
    failedChunksCount: number;
    remainingChunksCount: number;
    totalChunksCount: number;
}

export const ResultsPanel: React.FC<ResultsPanelProps> = ({ 
    chunks, processingState, mergedAudioUrl, onCancel, removeChunk, onClearQueue, onDownloadAll,
    onRetryChunk, onRetryAllFailed, successfulChunksCount, failedChunksCount, remainingChunksCount, totalChunksCount
}) => {
    
    return (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm h-full flex flex-col overflow-hidden">
             <div className="p-6 border-b border-gray-100">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-50 rounded-lg border border-indigo-100">
                            <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900">Hàng chờ & Phân đoạn</h2>
                            {totalChunksCount > 0 && (
                                <div className="flex items-center gap-x-3 text-[10px] font-bold mt-0.5 uppercase tracking-wider">
                                    <span className="text-gray-400">Tổng: {totalChunksCount}</span>
                                    <span className="text-emerald-600">Xong: {successfulChunksCount}</span>
                                    {failedChunksCount > 0 && <span className="text-red-600">Lỗi: {failedChunksCount}</span>}
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {processingState === 'idle' && chunks.length > 0 && !mergedAudioUrl && (
                             <button
                                onClick={onClearQueue}
                                className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all"
                                title="Xóa Hàng chờ"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                            </button>
                        )}
                        {processingState === 'processing' && (
                             <button
                                onClick={onCancel}
                                className="flex items-center gap-2 py-1.5 px-4 bg-red-50 text-red-600 border border-red-100 rounded-lg text-xs font-bold uppercase hover:bg-red-600 hover:text-white transition-all active:scale-95"
                            >
                                <span className="relative flex h-2 w-2">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                                </span>
                                Hủy bỏ
                            </button>
                        )}
                    </div>
                 </div>
             </div>
            
             {mergedAudioUrl && (
                <div className="m-6 p-6 bg-blue-50 rounded-xl border border-blue-100 relative overflow-hidden group animate-in zoom-in duration-300">
                    <div className="relative z-10 space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="text-[10px] font-bold text-blue-700 uppercase tracking-widest flex items-center gap-2">
                                <span className="h-1.5 w-1.5 rounded-full bg-blue-600 animate-pulse"></span>
                                Sẵn sàng Sản xuất (Bản đầy đủ)
                            </h3>
                        </div>
                        <audio controls src={mergedAudioUrl} className="w-full h-10">
                            Trình duyệt không hỗ trợ.
                        </audio>
                        <button
                            onClick={onDownloadAll}
                            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-all active:scale-[0.97] uppercase tracking-widest"
                        >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                            Tải xuống Bản Master
                        </button>
                    </div>
                </div>
            )}

             <div className="flex-grow overflow-y-auto p-6 pt-0 space-y-3">
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
                    <div className="flex flex-col items-center justify-center h-full text-center text-gray-300 space-y-4 py-20">
                        <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
                        <div className="space-y-1">
                             <p className="font-bold text-lg text-gray-400">Hàng chờ Trống</p>
                             <p className="text-[10px] uppercase tracking-widest font-medium">Thêm nội dung để bắt đầu tổng hợp</p>
                        </div>
                    </div>
                )}
             </div>
        </div>
    );
};

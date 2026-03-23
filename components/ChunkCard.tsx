
import React from 'react';
import type { ChunkJob } from '../types';

interface ChunkCardProps {
    chunk: ChunkJob;
    index: number;
    onRemove: (id: string) => void;
    onRetry: (id: string) => void;
}

export const ChunkCard: React.FC<ChunkCardProps> = ({ chunk, index, onRemove, onRetry }) => {
    const getStatusStyles = () => {
        switch (chunk.status) {
            case 'finished': return 'border-emerald-100 bg-emerald-50/30';
            case 'error': return 'border-red-100 bg-red-50/30';
            case 'processing': return 'border-blue-100 bg-blue-50/30';
            default: return 'border-gray-100 bg-gray-50/30';
        }
    };

    const getStatusIconColor = () => {
        switch (chunk.status) {
            case 'finished': return 'text-emerald-500';
            case 'error': return 'text-red-500';
            case 'processing': return 'text-blue-500';
            default: return 'text-gray-400';
        }
    };

    return (
        <div className={`p-4 rounded-xl border transition-all duration-200 group relative ${getStatusStyles()}`}>
            <div className="flex justify-between items-start gap-4 mb-2">
                <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${getStatusIconColor()}`}>
                        {chunk.status === 'finished' ? 'Hoàn thành' : 
                         chunk.status === 'error' ? 'Lỗi' : 
                         chunk.status === 'processing' ? 'Đang xử lý' : 'Chờ'}
                    </span>
                    {chunk.timestamp && (
                        <span className="text-[10px] font-medium text-gray-400">
                            • {chunk.timestamp}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {chunk.status === 'error' && (
                        <button 
                            onClick={() => onRetry(chunk.id)}
                            className="p-1.5 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                            title="Thử lại"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                        </button>
                    )}
                    <button 
                        onClick={() => onRemove(chunk.id)}
                        className="p-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Xóa"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>
            </div>
            
            <p className="text-sm text-gray-700 leading-relaxed font-medium line-clamp-2 group-hover:line-clamp-none transition-all duration-300">
                {chunk.text}
            </p>

            {chunk.status === 'finished' && chunk.audioUrl && (
                <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-3">
                    <audio src={chunk.audioUrl} controls className="h-8 flex-grow" />
                    <a 
                        href={chunk.audioUrl} 
                        download={`chunk_${index + 1}.mp3`}
                        className="p-2 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-all"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                    </a>
                </div>
            )}

            {chunk.status === 'error' && chunk.error && (
                <div className="mt-2 text-[10px] font-bold text-red-600 bg-red-50 p-2 rounded-lg border border-red-100">
                    Lỗi: {chunk.error}
                </div>
            )}

            {chunk.status === 'processing' && (
                <div className="absolute inset-0 bg-white/40 flex items-center justify-center rounded-xl backdrop-blur-[1px]">
                    <div className="flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-bounce [animation-delay:-0.3s]"></span>
                        <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-bounce [animation-delay:-0.15s]"></span>
                        <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-bounce"></span>
                    </div>
                </div>
            )}
        </div>
    );
};

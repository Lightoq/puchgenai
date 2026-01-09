
import React from 'react';
import type { ChunkJob } from '../types';
import { Loader } from './Loader';

interface ChunkCardProps {
    chunk: ChunkJob;
    index: number;
    onRemove: (chunkId: string) => void;
    onRetry: (chunkId: string) => void;
}

export const ChunkCard: React.FC<ChunkCardProps> = ({ chunk, index, onRemove, onRetry }) => {
    
    const renderStatusSpecificContent = () => {
        switch (chunk.status) {
            case 'processing':
                return (
                    <div className="mt-4 flex items-center gap-3 text-[10px] font-black text-teal-500 uppercase tracking-[0.2em] animate-pulse">
                        <div className="w-5 h-5"><Loader /></div>
                        <span>Neural Rendering...</span>
                    </div>
                );
            case 'finished':
                return (
                    <div className="mt-4 flex items-center gap-3 animate-in fade-in duration-500">
                        <audio controls controlsList="nodownload" src={chunk.audioUrl} className="flex-grow h-9 filter invert grayscale opacity-60 hover:opacity-100 transition-all hover:grayscale-0" />
                        <a href={chunk.audioUrl} download={`chunk_${index + 1}.mp3`} className="p-2.5 bg-white/5 rounded-2xl hover:bg-teal-500 hover:text-black text-gray-400 transition-all border border-white/5 active:scale-90">
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                        </a>
                    </div>
                );
            case 'error':
                 return (
                    <div className="mt-4 text-[10px] text-red-400 bg-red-950/20 p-4 rounded-2xl border border-red-500/20 shadow-lg">
                        <p className="font-black uppercase mb-2 flex items-center gap-2">
                             <span className="h-2 w-2 rounded-full bg-red-500"></span>
                             System Alert: {chunk.error || 'Connection Failed'}
                        </p>
                        <button onClick={() => onRetry(chunk.id)} className="font-black text-white bg-red-600 hover:bg-red-500 px-4 py-1.5 rounded-lg uppercase transition-all active:scale-95 shadow-lg">Retry Sequence</button>
                    </div>
                );
            default:
                return null;
        }
    };
    
    return (
        <div className={`bg-white/[0.03] p-5 rounded-[2rem] border transition-all group relative overflow-hidden ${chunk.status === 'finished' ? 'border-teal-500/10 hover:border-teal-500/30' : 'border-white/5 hover:border-white/15'}`}>
            <div className="flex items-start justify-between gap-4">
                <div className="flex-grow">
                    <div className="flex items-center gap-3 mb-3">
                        <span className="text-[10px] font-black text-gray-500 bg-black/50 px-3 py-1 rounded-xl uppercase tracking-widest border border-white/5 shadow-inner">ID-{String(index + 1).padStart(3, '0')}</span>
                        {chunk.timestamp && (
                             <span className="text-[10px] font-black text-teal-500/70 uppercase tracking-tighter bg-teal-500/5 px-2 py-1 rounded-lg border border-teal-500/10">{chunk.timestamp}</span>
                        )}
                    </div>
                    <p className="text-sm text-gray-400 font-medium leading-relaxed line-clamp-2 group-hover:line-clamp-none transition-all cursor-default selection:bg-teal-500/30">
                        {chunk.text}
                    </p>
                </div>
                {chunk.status === 'pending' && (
                    <button onClick={() => onRemove(chunk.id)} className="p-2 text-gray-700 hover:text-red-500 transition-colors bg-white/5 rounded-xl border border-transparent hover:border-red-500/20">
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                )}
            </div>
            {renderStatusSpecificContent()}
        </div>
    );
};

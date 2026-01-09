
import React, { useState, useEffect } from 'react';
import { keyManager } from '../services/keyManager';

export const Settings: React.FC = () => {
    const [keysInput, setKeysInput] = useState('');
    const [saved, setSaved] = useState(false);

    useEffect(() => { setKeysInput(keyManager.getKeysRaw()); }, []);

    const handleSave = () => {
        keyManager.saveKeys(keysInput);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    return (
        <div className="max-w-4xl mx-auto glass-effect p-12 rounded-[3rem] shadow-[0_20px_60px_rgba(0,0,0,0.8)] animate-rgb-border bg-black/40">
            <div className="flex items-center gap-8 border-b border-white/5 pb-10 mb-10">
                <div className="p-5 bg-orange-500/10 rounded-[2.5rem] border border-orange-500/20 shadow-[0_0_30px_rgba(249,115,22,0.15)]">
                    <svg className="h-10 w-10 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
                </div>
                <div>
                    <h2 className="text-3xl font-black italic tracking-tighter animate-rgb-text uppercase leading-none">Cấu hình Hệ thống</h2>
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.4em] mt-3 opacity-60">Neural Engine & API Management</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <div className="space-y-8">
                    <div className="bg-black/60 p-8 rounded-[2rem] border border-white/10 space-y-6 shadow-inner relative group overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-orange-500/50"></div>
                        <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest pl-2">Security Layers:</p>
                        <ul className="text-[11px] text-gray-500 space-y-4 font-bold uppercase tracking-tighter leading-relaxed">
                            <li className="flex items-center gap-3"><span className="h-1.5 w-1.5 rounded-full bg-orange-500"></span> <span className="text-gray-300">CORE-L01:</span> Audio Transmission (TTS)</li>
                            <li className="flex items-center gap-3"><span className="h-1.5 w-1.5 rounded-full bg-orange-500"></span> <span className="text-gray-300">CORE-L02:</span> Vision Graphics (Photo/Video)</li>
                            <li className="flex items-center gap-3"><span className="h-1.5 w-1.5 rounded-full bg-orange-500 opacity-30"></span> <span className="text-gray-600">AUX-POOL:</span> Failover Redundancy (Row 3+)</li>
                        </ul>
                    </div>
                    
                    <button 
                        onClick={handleSave} 
                        className={`w-full py-6 rounded-[2.5rem] text-[11px] font-black uppercase tracking-[0.4em] transition-all shadow-2xl active:scale-95 border-none outline-none ${saved ? 'bg-green-500 text-black animate-pulse' : 'neon-button text-white'}`}
                    >
                        {saved ? 'AUTHENTICATED & SAVED' : 'SAVE ACCESS CONFIG'}
                    </button>
                    
                    <div className="pt-8 border-t border-white/5 flex justify-between items-center opacity-20">
                         <span className="text-[9px] font-black uppercase tracking-[0.5em]">SYSTEM V1.3.5</span>
                         <span className="text-[9px] font-black uppercase tracking-[0.5em]">256-BIT SYNC</span>
                    </div>
                </div>

                <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-orange-500/20 to-transparent rounded-[3rem] blur opacity-0 group-hover:opacity-100 transition duration-1000"></div>
                    <textarea
                        value={keysInput} onChange={(e) => setKeysInput(e.target.value)}
                        placeholder="Row 1: TTS Engine&#10;Row 2: Vision Graphics (Image/Video)&#10;Row 3+: Safety Pools..."
                        className="relative w-full h-96 bg-black/80 border border-white/10 rounded-[2.5rem] p-10 font-mono text-[11px] text-green-400 placeholder-gray-800 focus:border-orange-500/50 outline-none transition-all shadow-[inset_0_2px_20px_rgba(0,0,0,0.8)] leading-loose scrollbar-hide"
                    />
                </div>
            </div>
        </div>
    );
};

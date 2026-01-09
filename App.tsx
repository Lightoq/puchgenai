
import React, { useState } from 'react';
import { Logo } from './components/Logo';
import { ImageGenerator } from './components/ImageGenerator';
import { Settings } from './components/Settings';
import { TextToSpeech } from './components/TextToSpeech';
import { VideoGenerator } from './components/VideoGenerator';
import { TextFilter } from './components/TextFilter';

const TabButton: React.FC<{ 
    name: string; 
    active: boolean; 
    onClick: () => void; 
    activeColorClass: string; 
    icon: React.ReactNode;
}> = ({ name, active, onClick, activeColorClass, icon }) => {
    const activeClasses = `${activeColorClass} font-bold shadow-[0_4px_15px_-4px_rgba(255,255,255,0.1)] scale-105 z-10`;
    const inactiveClasses = 'border-transparent text-gray-600 hover:text-gray-300 hover:bg-white/5';

    return (
        <button
            onClick={onClick}
            className={`group relative flex items-center gap-2 whitespace-nowrap py-3 px-5 text-xs sm:text-sm transition-all duration-300 focus:outline-none rounded-2xl active:scale-95 ${active ? activeClasses : inactiveClasses}`}
            aria-current={active ? 'page' : undefined}
        >
            {active && (
                <span className="absolute inset-0 bg-current opacity-[0.05] rounded-2xl animate-pulse"></span>
            )}
            
            <span className={`transition-all duration-500 ${active ? 'scale-110' : 'opacity-40 group-hover:opacity-100'}`}>
                {icon}
            </span>
            <span className={`relative z-10 uppercase tracking-tighter text-[10px] font-black ${active ? 'text-white' : ''}`}>{name}</span>
            
            {active && (
                <span className="absolute bottom-0.5 left-5 right-5 h-[2px] bg-current rounded-full"></span>
            )}
        </button>
    );
};

const App: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'tts' | 'image' | 'video' | 'filter' | 'settings'>('tts');
    
    return (
        <div className="min-h-screen flex flex-col bg-[#020202]">
            {/* Sticky Navigation Bar with Integrated Logo */}
            <div className="sticky top-0 z-50 glass-effect border-b border-white/5 shadow-2xl animate-rgb-border">
                <div className="container mx-auto px-4 flex items-center">
                    <div className="flex items-center gap-2 mr-6 py-2 border-r border-white/5 pr-6">
                        <Logo className="h-7 w-7 filter drop-shadow-[0_0_5px_rgba(255,255,255,0.3)]" />
                        <span className="text-xs font-black italic tracking-tighter animate-rgb-text hidden sm:block">PUCH</span>
                    </div>

                    <nav className="flex items-center space-x-1 py-1 overflow-x-auto no-scrollbar scroll-smooth flex-grow">
                        <TabButton 
                            name="TTS Batch" 
                            active={activeTab === 'tts'} 
                            onClick={() => setActiveTab('tts')} 
                            activeColorClass="text-teal-400 bg-teal-500/10"
                            icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path></svg>}
                        />
                        <TabButton 
                            name="Ảnh AI" 
                            active={activeTab === 'image'} 
                            onClick={() => setActiveTab('image')} 
                            activeColorClass="text-purple-400 bg-purple-500/10"
                            icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>}
                        />
                        <TabButton 
                            name="Video AI" 
                            active={activeTab === 'video'} 
                            onClick={() => setActiveTab('video')} 
                            activeColorClass="text-blue-400 bg-blue-500/10"
                            icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2-2v8a2 2 0 002 2z"></path></svg>}
                        />
                        <TabButton 
                            name="Lọc Chữ" 
                            active={activeTab === 'filter'} 
                            onClick={() => setActiveTab('filter')} 
                            activeColorClass="text-amber-400 bg-amber-500/10"
                            icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path></svg>}
                        />
                        <div className="flex-grow"></div>
                        <TabButton 
                            name="Cấu hình" 
                            active={activeTab === 'settings'} 
                            onClick={() => setActiveTab('settings')} 
                            activeColorClass="text-orange-400 bg-orange-500/10"
                            icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path></svg>}
                        />
                    </nav>
                </div>
            </div>

            <main className="flex-grow container mx-auto p-4 md:p-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                 {activeTab === 'tts' && <TextToSpeech />}
                 {activeTab === 'image' && <ImageGenerator />}
                 {activeTab === 'video' && <VideoGenerator />}
                 {activeTab === 'filter' && <TextFilter />}
                 {activeTab === 'settings' && <Settings />}
            </main>

            <footer className="py-6 bg-black text-center">
                <p className="text-[9px] font-black uppercase tracking-[0.4em] text-gray-800">
                    PUCH GEN AI SUITE • 2025 NEXT-GEN HUB
                </p>
            </footer>
        </div>
    );
};

export default App;

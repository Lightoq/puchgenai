
import React, { useState } from 'react';
import { Logo } from './components/Logo';
import { Settings } from './components/Settings';
import { TextToSpeech } from './components/TextToSpeech';
import { TextFilter } from './components/TextFilter';

const TabButton: React.FC<{ 
    name: string; 
    active: boolean; 
    onClick: () => void; 
    icon: React.ReactNode;
}> = ({ name, active, onClick, icon }) => {
    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all rounded-lg ${
                active 
                ? 'bg-blue-600 text-white shadow-sm' 
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`}
        >
            <span className={active ? 'text-white' : 'text-gray-400'}>{icon}</span>
            <span>{name}</span>
        </button>
    );
};

const App: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'tts' | 'filter' | 'settings'>('tts');
    
    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Logo className="h-8 w-8 text-blue-600" />
                        <h1 className="text-xl font-bold tracking-tight text-gray-900">Vocalis</h1>
                        <span className="hidden sm:inline-block px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] font-bold rounded uppercase tracking-wider">Pro Suite</span>
                    </div>

                    <nav className="flex items-center gap-1">
                        <TabButton 
                            name="Tổng hợp" 
                            active={activeTab === 'tts'} 
                            onClick={() => setActiveTab('tts')} 
                            icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path></svg>}
                        />
                        <TabButton 
                            name="Lọc văn bản" 
                            active={activeTab === 'filter'} 
                            onClick={() => setActiveTab('filter')} 
                            icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path></svg>}
                        />
                        <div className="w-px h-6 bg-gray-200 mx-2"></div>
                        <TabButton 
                            name="Cài đặt" 
                            active={activeTab === 'settings'} 
                            onClick={() => setActiveTab('settings')} 
                            icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path></svg>}
                        />
                    </nav>
                </div>
            </header>

            <main className="flex-grow container mx-auto p-6 md:p-10">
                 {activeTab === 'tts' && <TextToSpeech />}
                 {activeTab === 'filter' && <TextFilter />}
                 {activeTab === 'settings' && <Settings />}
            </main>

            <footer className="py-8 bg-white border-t border-gray-200">
                <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-widest">
                        VOCALIS AUDIO ENGINE • v1.4.0
                    </p>
                    <div className="flex gap-6">
                        <a href="#" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">Tài liệu</a>
                        <a href="#" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">Hỗ trợ</a>
                        <a href="#" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">Bảo mật</a>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default App;

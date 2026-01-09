
import React, { useState, useEffect } from 'react';
import { Logo } from './Logo';

interface HeaderProps {
    onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenSettings }) => {
    const [isVisible, setIsVisible] = useState(true);
    const [lastScrollY, setLastScrollY] = useState(0);

    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;
            // Ẩn khi cuộn xuống và hiện khi cuộn lên
            if (currentScrollY > lastScrollY && currentScrollY > 100) {
                setIsVisible(false);
            } else {
                setIsVisible(true);
            }
            setLastScrollY(currentScrollY);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [lastScrollY]);

    return (
        <header 
            className={`fixed top-0 left-0 right-0 z-[60] p-4 transition-all duration-700 ease-in-out transform ${isVisible ? 'translate-y-0' : '-translate-y-24 opacity-0 pointer-events-none'}`}
        >
            <div className="container mx-auto flex justify-center">
                <div className="glass-effect rounded-full px-8 py-2.5 flex items-center gap-6 shadow-[0_0_40px_rgba(0,0,0,0.8)] animate-rgb-border bg-black/60">
                    <div className="flex items-center gap-3">
                        <Logo className="h-10 w-10 filter drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]" />
                        <div className="flex flex-col">
                            <h1 className="text-xl sm:text-2xl font-black italic tracking-tighter animate-rgb-text leading-none">
                                PUCH SUITE
                            </h1>
                            <div className="h-[1px] w-full bg-gradient-to-r from-red-500 via-green-500 to-blue-500 opacity-60 mt-1"></div>
                        </div>
                    </div>

                    <div className="hidden sm:block h-8 w-[1px] bg-white/10"></div>

                    <div className="hidden md:flex flex-col text-[8px] font-black uppercase tracking-[0.3em] text-gray-500 leading-tight">
                        <span>Production</span>
                        <span>Neural Hub</span>
                    </div>

                    <button
                        onClick={onOpenSettings}
                        className="p-2.5 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all active:scale-90 border border-white/5"
                        title="Cài đặt hệ thống"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    </button>
                </div>
            </div>
        </header>
    );
};

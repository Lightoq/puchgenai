
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
        <div className="max-w-4xl mx-auto bg-white p-8 md:p-12 rounded-3xl shadow-sm border border-slate-200 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center gap-6 border-b border-slate-100 pb-8 mb-8">
                <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 text-blue-600">
                    <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Cấu hình Hệ thống</h2>
                    <p className="text-sm font-medium text-slate-500 mt-1">Quản lý API & Truy cập Engine</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <div className="space-y-8">
                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-4">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Hướng dẫn Cấu hình</h3>
                        <ul className="text-sm text-slate-600 space-y-3 font-medium">
                            <li className="flex items-start gap-3">
                                <span className="h-1.5 w-1.5 rounded-full bg-blue-500 mt-2 shrink-0"></span>
                                <div>
                                    <span className="text-slate-900 font-bold">Dòng 1:</span> Engine TTS Chính (Capcut Token)
                                </div>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="h-1.5 w-1.5 rounded-full bg-blue-500 mt-2 shrink-0"></span>
                                <div>
                                    <span className="text-slate-900 font-bold">Dòng 2+:</span> Các Khóa API Phụ (Gemini, v.v.)
                                </div>
                            </li>
                        </ul>
                        <div className="mt-4 p-3 bg-amber-50 border border-amber-100 rounded-xl text-[11px] text-amber-700 leading-relaxed">
                            <strong>Lưu ý Bảo mật:</strong> Các khóa được lưu trữ cục bộ trong bộ nhớ mã hóa của trình duyệt. Không bao giờ chia sẻ chuỗi cấu hình của bạn.
                        </div>
                    </div>
                    
                    <button 
                        onClick={handleSave} 
                        className={`w-full py-4 rounded-xl text-sm font-bold uppercase tracking-wider transition-all shadow-lg active:scale-[0.98] ${saved ? 'bg-emerald-500 text-white shadow-emerald-200' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200'}`}
                    >
                        {saved ? 'Đã Lưu Cài đặt Thành công' : 'Lưu Cấu hình'}
                    </button>
                    
                    <div className="pt-6 border-t border-slate-100 flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                         <span>Vocalis Engine v1.4.0</span>
                         <span>Mã hóa AES-256</span>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Khóa Truy cập (Mỗi dòng một khóa)</label>
                    <textarea
                        value={keysInput} onChange={(e) => setKeysInput(e.target.value)}
                        placeholder="Dán các khóa API của bạn tại đây..."
                        className="w-full h-80 bg-slate-50 border border-slate-200 rounded-2xl p-6 font-mono text-xs text-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all shadow-inner leading-relaxed"
                    />
                </div>
            </div>
        </div>
    );
};


import React, { useState } from 'react';

export const TextFilter: React.FC = () => {
    const [inputText, setInputText] = useState('');
    const [outputText, setOutputText] = useState('');
    const [junkKeywords, setJunkKeywords] = useState('comment, 0 comment, Vote, SEND GIFT, bình luận, 0 bình luận, bỏ phiếu, gửi quà tặng, gửI quà tặng');
    
    const [options, setOptions] = useState({
        removeJunkBlocks: true,
        removeChapterHeader: true,
        removeEndNumbers: true,
        removeNumbers: false,
        removeWhitespace: true
    });

    const [toast, setToast] = useState(false);

    const handleOptionChange = (key: keyof typeof options) => {
        setOptions(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const processText = () => {
        if (!inputText.trim()) return;

        let lines = inputText.split(/\r?\n/);
        const keywords = junkKeywords.split(',').map(k => k.trim().toLowerCase()).filter(k => k !== "");
        
        let finalLines: string[] = [];
        let i = 0;

        while (i < lines.length) {
            let line = lines[i];
            let lineTrimmed = line.trim();
            let lineLower = lineTrimmed.toLowerCase();

            // 1. Xóa Chapter/Chương
            if (options.removeChapterHeader) {
                const chapterPattern = /^(chapter|chương)\s+\d+/i;
                if (chapterPattern.test(lineTrimmed)) {
                    i++;
                    continue;
                }
            }

            // 2. Xóa khối rác liên tiếp
            if (options.removeJunkBlocks) {
                let isCurrentJunk = keywords.some(k => lineLower === k || lineLower.includes(k));
                
                if (isCurrentJunk) {
                    let nextJunkIdx = -1;
                    // Kiểm tra 6 dòng tiếp theo để xem có phải khối rác không
                    for (let j = i + 1; j < Math.min(i + 6, lines.length); j++) {
                        let nextLineLower = lines[j].trim().toLowerCase();
                        if (nextLineLower === "") continue; 
                        if (keywords.some(k => nextLineLower === k || nextLineLower.includes(k))) {
                            nextJunkIdx = j;
                            break;
                        }
                    }

                    if (nextJunkIdx !== -1) {
                        // Nhảy qua toàn bộ khối rác
                        while (i < lines.length) {
                            let checkLine = lines[i].trim().toLowerCase();
                            if (checkLine === "" || keywords.some(k => checkLine === k || checkLine.includes(k))) {
                                i++;
                            } else {
                                break; 
                            }
                        }
                        continue;
                    }
                }
            }

            // 3. Xóa số lẻ ở cuối dòng (1, 2, 99, 99+)
            if (options.removeEndNumbers) {
                line = line.replace(/\s+\d+(\+)?\s*$/, '');
            }

            finalLines.push(line);
            i++;
        }

        let result = finalLines.join('\n');
        
        // Loại bỏ TẤT CẢ số
        if (options.removeNumbers) {
            result = result.replace(/[0-9]/g, '');
        }
        
        // Xóa khoảng trắng thừa và dòng trống
        if (options.removeWhitespace) {
            result = result.replace(/[^\S\r\n]+/g, ' ') 
                           .replace(/^\s*[\r\n]/gm, '') 
                           .trim();
        }

        setOutputText(result);
    };

    const copyResult = () => {
        if (!outputText) return;
        navigator.clipboard.writeText(outputText);
        setToast(true);
        setTimeout(() => setToast(false), 2000);
    };

    const clearAll = () => {
        setInputText('');
        setOutputText('');
    };

    return (
        <div className="max-w-6xl mx-auto glass-effect p-8 rounded-[40px] animate-rgb-border shadow-2xl relative">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                
                {/* Cấu hình Lọc */}
                <div className="lg:col-span-1 space-y-8">
                    <div>
                        <h2 className="text-2xl font-black italic tracking-tighter animate-rgb-text uppercase">Lọc Văn Bản Pro</h2>
                        <div className="h-[2px] w-20 bg-gradient-to-r from-amber-500 to-transparent mt-2"></div>
                    </div>

                    <div className="bg-black/40 p-6 rounded-3xl border border-white/5 space-y-4">
                        <h3 className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                             <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
                             Xử lý logic
                        </h3>
                        
                        <label className="flex items-center gap-3 p-3 bg-white/5 rounded-2xl cursor-pointer hover:bg-white/10 transition-all border border-transparent hover:border-amber-500/20">
                            <input 
                                type="checkbox" checked={options.removeJunkBlocks} 
                                onChange={() => handleOptionChange('removeJunkBlocks')}
                                className="w-4 h-4 rounded border-white/10 bg-black text-amber-500 focus:ring-amber-500"
                            />
                            <span className="text-[11px] font-bold text-amber-100/80 uppercase">Lọc khối rác MXH</span>
                        </label>

                        <label className="flex items-center gap-3 p-3 bg-white/5 rounded-2xl cursor-pointer hover:bg-white/10 transition-all border border-transparent hover:border-orange-500/20">
                            <input 
                                type="checkbox" checked={options.removeChapterHeader} 
                                onChange={() => handleOptionChange('removeChapterHeader')}
                                className="w-4 h-4 rounded border-white/10 bg-black text-orange-500 focus:ring-orange-500"
                            />
                            <span className="text-[11px] font-bold text-orange-100/80 uppercase">Xóa tiêu đề Chapter</span>
                        </label>

                        <label className="flex items-center gap-3 p-3 bg-white/5 rounded-2xl cursor-pointer hover:bg-white/10 transition-all border border-transparent hover:border-red-500/20">
                            <input 
                                type="checkbox" checked={options.removeEndNumbers} 
                                onChange={() => handleOptionChange('removeEndNumbers')}
                                className="w-4 h-4 rounded border-white/10 bg-black text-red-500 focus:ring-red-500"
                            />
                            <span className="text-[11px] font-bold text-red-100/80 uppercase">Xóa số lẻ cuối dòng</span>
                        </label>

                        <hr className="border-white/5 my-2" />

                        <label className="flex items-center gap-3 p-3 bg-white/5 rounded-2xl cursor-pointer hover:bg-white/10 transition-all">
                            <input 
                                type="checkbox" checked={options.removeNumbers} 
                                onChange={() => handleOptionChange('removeNumbers')}
                                className="w-4 h-4 rounded border-white/10 bg-black text-blue-500 focus:ring-blue-500"
                            />
                            <span className="text-[11px] font-bold text-gray-400 uppercase">Loại bỏ tất cả số</span>
                        </label>

                        <label className="flex items-center gap-3 p-3 bg-white/5 rounded-2xl cursor-pointer hover:bg-white/10 transition-all">
                            <input 
                                type="checkbox" checked={options.removeWhitespace} 
                                onChange={() => handleOptionChange('removeWhitespace')}
                                className="w-4 h-4 rounded border-white/10 bg-black text-teal-500 focus:ring-teal-500"
                            />
                            <span className="text-[11px] font-bold text-gray-400 uppercase">Dọn dẹp khoảng trắng</span>
                        </label>
                    </div>

                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Từ khóa rác (ngăn cách bởi dấu phẩy)</label>
                        <textarea 
                            value={junkKeywords} onChange={(e) => setJunkKeywords(e.target.value)}
                            className="w-full bg-black/60 border border-white/10 rounded-3xl p-5 text-[11px] text-amber-500/70 focus:border-amber-500/50 outline-none transition-all resize-none shadow-inner h-32 leading-relaxed"
                        />
                    </div>

                    <div className="flex gap-3">
                        <button onClick={processText} className="neon-button flex-grow py-5 rounded-[2rem] text-xs font-black uppercase tracking-[0.3em] text-white shadow-2xl active:scale-95 transition-all">
                            Xử Lý Ngay
                        </button>
                        <button onClick={clearAll} className="px-6 py-5 rounded-[2rem] bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] font-black uppercase tracking-widest text-gray-500 transition-all active:scale-95">
                            Reset
                        </button>
                    </div>
                </div>

                {/* Editor Areas */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="space-y-4">
                        <div className="flex justify-between items-center px-1">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Dữ liệu thô</label>
                            <span className="text-[9px] text-gray-600 font-mono">{inputText.length} chars</span>
                        </div>
                        <textarea 
                            value={inputText} onChange={(e) => setInputText(e.target.value)}
                            placeholder="Dán văn bản truyện, nội dung MXH cần dọn dẹp vào đây..."
                            className="w-full h-64 bg-black/60 border border-white/10 rounded-[2.5rem] p-8 text-sm text-gray-300 focus:border-amber-500/30 outline-none transition-all resize-none shadow-inner leading-relaxed"
                        />
                    </div>

                    <div className="space-y-4">
                        <div className="flex justify-between items-center px-1">
                            <label className="text-[10px] font-black text-amber-500 uppercase tracking-widest flex items-center gap-2">
                                <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                                Kết quả tinh chế
                            </label>
                            {outputText && (
                                <button onClick={copyResult} className="text-[9px] font-black text-amber-400 hover:text-white uppercase tracking-[0.2em] transition-all flex items-center gap-2">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"></path></svg>
                                    Sao chép kết quả
                                </button>
                            )}
                        </div>
                        <div className="w-full min-h-[250px] bg-black/80 border border-white/10 rounded-[2.5rem] p-8 text-sm text-gray-400 whitespace-pre-wrap break-words leading-relaxed shadow-[inset_0_2px_20px_rgba(0,0,0,0.8)] border-l-amber-500/20">
                            {outputText || <span className="text-gray-800 italic uppercase text-[10px] tracking-widest font-black">Waiting for processing...</span>}
                        </div>
                    </div>
                </div>
            </div>

            {/* Toast Notification */}
            {toast && (
                <div className="fixed bottom-12 left-1/2 -translate-x-1/2 px-8 py-3 bg-amber-500 text-black rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-300 z-[100]">
                    Copied to clipboard
                </div>
            )}
        </div>
    );
};

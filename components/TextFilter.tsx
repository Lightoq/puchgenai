
import React, { useState, useEffect } from 'react';
import { FileUpload } from './FileUpload';

interface PhoneticEntry {
    id: string;
    original: string;
    phonetic: string;
}

export const TextFilter: React.FC = () => {
    const [inputText, setInputText] = useState('');
    const [outputText, setOutputText] = useState('');
    // Cập nhật junkKeywords với các từ khóa mới người dùng yêu cầu
    const [junkKeywords, setJunkKeywords] = useState('comment, 0 comment, Vote, SEND GIFT, bình luận, 0 bình luận, bỏ phiếu, gửi quà tặng, gửI quà tặng, P@treon, PinkSnake, chương phía trước, vui lòng theo dõi tôi, p@treon.com/PinkSnake, nhận xét, còn lại, SUY NGHĨ CỦA NGƯỜI SÁNG TẠO, Rắn hồng, discord.gg, https://discord.gg/7mNvAaTtkf, Power Stones, Đánh giá, Bonus');
    
    const [phoneticDict, setPhoneticDict] = useState<PhoneticEntry[]>([]);
    const [newOriginal, setNewOriginal] = useState('');
    const [newPhonetic, setNewPhonetic] = useState('');

    const [options, setOptions] = useState({
        removeJunkBlocks: true,
        removeChapterHeader: true,
        removeEndNumbers: true,
        convertLargeNumbers: true,
        removeNumbers: false,
        removeWhitespace: true,
        manualPhonetic: true
    });

    const [toast, setToast] = useState(false);

    useEffect(() => {
        const savedDict = localStorage.getItem('puch_phonetic_dict');
        if (savedDict) {
            try {
                setPhoneticDict(JSON.parse(savedDict));
            } catch (e) {
                console.error("Failed to load phonetic dict", e);
            }
        } else {
            const defaultDict = [
                { id: '1', original: 'pokemon master', phonetic: 'pô kê mon mát tơ' },
                { id: '2', original: 'ronaldo', phonetic: 'rô nan đô' },
                { id: '3', original: 'madrid', phonetic: 'ma rít' },
                { id: '4', original: 'tottenham', phonetic: 'tốt ten ham' }
            ];
            setPhoneticDict(defaultDict);
            localStorage.setItem('puch_phonetic_dict', JSON.stringify(defaultDict));
        }
    }, []);

    useEffect(() => {
        if (phoneticDict.length > 0) {
            localStorage.setItem('puch_phonetic_dict', JSON.stringify(phoneticDict));
        }
    }, [phoneticDict]);

    const handleOptionChange = (key: keyof typeof options) => {
        setOptions(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const addPhoneticEntry = () => {
        if (!newOriginal.trim() || !newPhonetic.trim()) return;
        const newEntry: PhoneticEntry = {
            id: Date.now().toString(),
            original: newOriginal.trim(),
            phonetic: newPhonetic.trim()
        };
        setPhoneticDict(prev => [...prev, newEntry]);
        setNewOriginal('');
        setNewPhonetic('');
    };

    const removePhoneticEntry = (id: string) => {
        setPhoneticDict(prev => prev.filter(item => item.id !== id));
    };

    const numberToVietnamese = (numStr: string): string => {
        const units = ["không", "một", "hai", "ba", "bốn", "năm", "sáu", "bảy", "tám", "chín"];
        const groups = ["", "nghìn", "triệu", "tỷ", "nghìn tỷ", "triệu tỷ", "tỷ tỷ"];
        let cleanNum = numStr.replace(/\./g, "");
        if (isNaN(parseInt(cleanNum))) return numStr;
        if (parseInt(cleanNum) === 0) return "không";
        let pos = cleanNum.length;
        let chunks: string[] = [];
        while (pos > 0) {
            let start = Math.max(0, pos - 3);
            chunks.push(cleanNum.substring(start, pos).padStart(3, '0'));
            pos = start;
        }
        let result = "";
        let hasStarted = false;
        for (let i = chunks.length - 1; i >= 0; i--) {
            let n = chunks[i];
            let v = parseInt(n);
            if (v === 0) continue;
            let a = parseInt(n[0]);
            let b = parseInt(n[1]);
            let c = parseInt(n[2]);
            let chunkText = "";
            if (hasStarted) {
                if (a !== 0) chunkText += units[a] + " trăm ";
                else {
                    if (b !== 0) chunkText += "không trăm ";
                    else chunkText += "lẻ ";
                }
            } else {
                if (a !== 0) chunkText += units[a] + " trăm ";
            }
            if (b !== 0 && b !== 1) chunkText += units[b] + " mươi ";
            else if (b === 1) chunkText += "mười ";
            if (c !== 0) {
                if (c === 1 && b > 1) chunkText += "mốt";
                else if (c === 5 && b > 0) chunkText += "lăm";
                else chunkText += units[c];
            }
            result += chunkText.trim() + " " + groups[i] + " ";
            hasStarted = true;
        }
        return result.trim().replace(/\s+/g, ' ');
    };

    const processText = () => {
        if (!inputText.trim()) return;

        let lines = inputText.split(/\r?\n/);
        const keywords = junkKeywords.split(',').map(k => k.trim().toLowerCase()).filter(k => k !== "");
        
        let finalLines: string[] = [];
        let i = 0;

        const dynamicJunkPatterns = [
            /^\d+\s+nhận\s+xét$/i,
            /^\d+\s+còn\s+lại$/i,
            /^\d+\s+left$/i,
            /^bỏ\s+phiếu$/i,
            /^\d+\s+bình\s+luận$/i,
            /^bình\s+luận$/i, // Dòng chỉ chứa "Bình luận"
            /^suy\s+nghĩ\s+của\s+người\s+sáng\s+tạo$/i,
            /^rắn\s+hồng$/i,
            /discord\.gg\/\w+/i,
            /\d+\s+power\s+stones\s*=\s*\d+\s+chương\s+bônus/i, // Lọc Power Stones Bonus
            /\d+\s+đánh\s+giá\s*=\s*\d+\s+chương\s+bônus/i,   // Lọc Đánh giá Bonus
            /\d+\s+stones\s*=\s*\d+\s+bonus/i                  // Biến thể ngắn
        ];

        while (i < lines.length) {
            let line = lines[i];
            let lineTrimmed = line.trim();
            let lineLower = lineTrimmed.toLowerCase();

            if (!lineTrimmed) {
                finalLines.push("");
                i++;
                continue;
            }

            if (options.removeChapterHeader) {
                const chapterPattern = /^(chapter|chương)\s+\d+/i;
                if (chapterPattern.test(lineTrimmed)) {
                    i++;
                    continue;
                }
            }

            const isDynamicJunk = dynamicJunkPatterns.some(pattern => pattern.test(lineTrimmed));
            if (isDynamicJunk) {
                i++;
                continue;
            }

            if (options.removeJunkBlocks) {
                let isCurrentJunk = keywords.some(k => lineLower.includes(k));
                if (isCurrentJunk) {
                    let nextJunkIdx = -1;
                    for (let j = i + 1; j < Math.min(i + 6, lines.length); j++) {
                        let nextLineTrimmed = lines[j].trim();
                        let nextLineLower = nextLineTrimmed.toLowerCase();
                        if (nextLineLower === "") continue; 
                        const isNextDynamicJunk = dynamicJunkPatterns.some(pattern => pattern.test(nextLineTrimmed));
                        if (isNextDynamicJunk || keywords.some(k => nextLineLower.includes(k))) {
                            nextJunkIdx = j;
                            break;
                        }
                    }

                    if (nextJunkIdx !== -1 || lineLower.includes('discord.gg') || lineLower.includes('send gift') || lineLower.includes('left') || lineLower.includes('power stones')) {
                        while (i < lines.length) {
                            let checkLineTrimmed = lines[i].trim();
                            let checkLineLower = checkLineTrimmed.toLowerCase();
                            const isCheckDynamicJunk = dynamicJunkPatterns.some(pattern => pattern.test(checkLineTrimmed));
                            if (checkLineLower === "" || isCheckDynamicJunk || keywords.some(k => checkLineLower.includes(k))) {
                                i++;
                            } else {
                                break; 
                            }
                        }
                        continue;
                    }
                }
            }

            if (options.removeEndNumbers) {
                line = line.replace(/\s+\d+(\+)?\s*$/, '');
            }

            finalLines.push(line);
            i++;
        }

        let result = finalLines.join('\n');
        
        if (options.manualPhonetic) {
            const sortedDict = [...phoneticDict].sort((a, b) => b.original.length - a.original.length);
            sortedDict.forEach(entry => {
                if (!entry.original.trim()) return;
                try {
                    const escaped = entry.original.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                    const regex = new RegExp(`\\b${escaped}\\b`, 'gi');
                    result = result.replace(regex, entry.phonetic);
                } catch (e) {
                    console.error("Regex replacement error", e);
                }
            });
        }

        if (options.convertLargeNumbers) {
            const numberRegex = /\d{1,3}(?:\.\d{3})+|\d{4,}/g;
            result = result.replace(numberRegex, (match) => {
                const clean = match.replace(/\./g, "");
                const val = parseInt(clean);
                if (val >= 1000 && val % 1000 === 0) {
                    if (val >= 1000000000 && val % 1000000000 === 0) return (val / 1000000000) + " tỷ";
                    if (val >= 1000000 && val % 1000000 === 0) return (val / 1000000) + " triệu";
                    if (val >= 1000 && val % 1000 === 0) return (val / 1000) + " nghìn";
                }
                return numberToVietnamese(match);
            });
        }

        if (options.removeNumbers) {
            result = result.replace(/[0-9]/g, '');
        }
        
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

    const handleFileProcessed = (content: string | Array<{ text: string; timestamp: string }>) => {
        if (typeof content === 'string') {
            setInputText(content);
        } else {
            setInputText(content.map(c => c.text).join('\n'));
        }
    };

    return (
        <div className="max-w-6xl mx-auto glass-effect p-8 rounded-[40px] animate-rgb-border shadow-2xl relative">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
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
                        
                        <label className="flex items-center gap-3 p-3 bg-white/5 rounded-2xl cursor-pointer hover:bg-white/10 transition-all border border-transparent hover:border-teal-500/20 group">
                            <input 
                                type="checkbox" checked={options.manualPhonetic} 
                                onChange={() => handleOptionChange('manualPhonetic')}
                                className="w-4 h-4 rounded border-white/10 bg-black text-teal-500 focus:ring-teal-500"
                            />
                            <span className="text-[11px] font-bold text-teal-100/80 uppercase">Sử dụng phiên âm thủ công</span>
                        </label>

                        <label className="flex items-center gap-3 p-3 bg-white/5 rounded-2xl cursor-pointer hover:bg-white/10 transition-all border border-transparent hover:border-amber-500/20">
                            <input 
                                type="checkbox" checked={options.removeJunkBlocks} 
                                onChange={() => handleOptionChange('removeJunkBlocks')}
                                className="w-4 h-4 rounded border-white/10 bg-black text-amber-500 focus:ring-amber-500"
                            />
                            <span className="text-[11px] font-bold text-amber-100/80 uppercase">Lọc khối rác truyện</span>
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

                        <label className="flex items-center gap-3 p-3 bg-white/5 rounded-2xl cursor-pointer hover:bg-white/10 transition-all border border-transparent hover:border-green-500/20">
                            <input 
                                type="checkbox" checked={options.convertLargeNumbers} 
                                onChange={() => handleOptionChange('convertLargeNumbers')}
                                className="w-4 h-4 rounded border-white/10 bg-black text-green-500 focus:ring-green-500"
                            />
                            <span className="text-[11px] font-bold text-green-100/80 uppercase">Đọc số: Nghìn/Triệu...</span>
                        </label>
                    </div>

                    <div className="bg-black/40 p-6 rounded-3xl border border-white/5 space-y-4">
                        <h3 className="text-[10px] font-black text-teal-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                             <span className="h-1.5 w-1.5 rounded-full bg-teal-400"></span>
                             Từ điển phiên âm ({phoneticDict.length})
                        </h3>
                        <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-2">
                                <input 
                                    type="text" value={newOriginal} onChange={(e) => setNewOriginal(e.target.value)}
                                    placeholder="Từ gốc (En)"
                                    className="bg-black/60 border border-white/10 rounded-xl p-2 text-[10px] text-white outline-none focus:border-teal-500/50"
                                />
                                <input 
                                    type="text" value={newPhonetic} onChange={(e) => setNewPhonetic(e.target.value)}
                                    placeholder="Phiên âm (Vi)"
                                    className="bg-black/60 border border-white/10 rounded-xl p-2 text-[10px] text-white outline-none focus:border-teal-500/50"
                                />
                            </div>
                            <button 
                                onClick={addPhoneticEntry}
                                className="w-full py-2 bg-white/5 hover:bg-teal-500 hover:text-black rounded-xl text-[9px] font-black uppercase transition-all"
                            >
                                Thêm vào từ điển
                            </button>
                        </div>
                        <div className="max-h-48 overflow-y-auto pr-2 no-scrollbar space-y-2 mt-4">
                            {phoneticDict.map(item => (
                                <div key={item.id} className="flex items-center justify-between p-2 bg-white/5 rounded-xl border border-white/5 group">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black text-white/40 uppercase">{item.original}</span>
                                        <span className="text-[11px] font-bold text-teal-400">{item.phonetic}</span>
                                    </div>
                                    <button onClick={() => removePhoneticEntry(item.id)} className="text-red-500/40 hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition-all">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Từ khóa rác</label>
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

                <div className="lg:col-span-2 space-y-8">
                    <div className="space-y-4">
                        <div className="flex justify-between items-center px-1">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Dữ liệu thô</label>
                            <div className="flex items-center gap-4">
                                <FileUpload onFileProcessed={handleFileProcessed} />
                                <span className="text-[9px] text-gray-600 font-mono">{inputText.length} chars</span>
                            </div>
                        </div>
                        <textarea 
                            value={inputText} onChange={(e) => setInputText(e.target.value)}
                            placeholder="Dán văn bản truyện, nội dung MXH hoặc tải file (.docx, .txt, .srt)..."
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

            {toast && (
                <div className="fixed bottom-12 left-1/2 -translate-x-1/2 px-8 py-3 bg-amber-500 text-black rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-300 z-[100]">
                    Copied to clipboard
                </div>
            )}
        </div>
    );
};


import React, { useState, useRef, useEffect } from 'react';
import { Upload, FileAudio, Loader2, Download, Copy, Check, Scissors, AlertCircle, Cpu } from 'lucide-react';
import { pipeline } from '@xenova/transformers';

interface SubtitleLine {
    text: string;
    timestamp: string;
}

export const AudioToSubtitles: React.FC = () => {
    const [file, setFile] = useState<File | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isModelLoading, setIsModelLoading] = useState(false);
    const [loadingFiles, setLoadingFiles] = useState<Record<string, { progress: number, status: string }>>({});
    const [subtitles, setSubtitles] = useState<SubtitleLine[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    
    const fileInputRef = useRef<HTMLInputElement>(null);
    const transcriberRef = useRef<any>(null);

    // Load model on component mount or when needed
    const loadModel = async () => {
        if (transcriberRef.current) return transcriberRef.current;
        
        setIsModelLoading(true);
        setLoadingFiles({});
        try {
            const transcriber = await pipeline('automatic-speech-recognition', 'Xenova/whisper-tiny', {
                progress_callback: (data: any) => {
                    if (data.status === 'progress' || data.status === 'download' || data.status === 'initiate' || data.status === 'done') {
                        setLoadingFiles(prev => ({
                            ...prev,
                            [data.file]: {
                                progress: data.progress || (data.status === 'done' ? 100 : 0),
                                status: data.status
                            }
                        }));
                    }
                }
            });
            transcriberRef.current = transcriber;
            return transcriber;
        } catch (err: any) {
            console.error("Model loading error:", err);
            setError("Không thể tải mô hình xử lý. Vui lòng kiểm tra kết nối mạng.");
            return null;
        } finally {
            setIsModelLoading(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile && selectedFile.type.startsWith('audio/')) {
            setFile(selectedFile);
            setError(null);
            setSubtitles([]);
        } else if (selectedFile) {
            setError("Vui lòng chọn file âm thanh hợp lệ.");
        }
    };

    const processAudio = async () => {
        if (!file) return;

        setIsProcessing(true);
        setError(null);
        setSubtitles([]);

        try {
            const transcriber = await loadModel();
            if (!transcriber) return;

            // 1. Decode audio file to 16kHz mono
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            const arrayBuffer = await file.arrayBuffer();
            const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
            
            // Convert to mono if stereo
            let audioData;
            if (audioBuffer.numberOfChannels > 1) {
                const left = audioBuffer.getChannelData(0);
                const right = audioBuffer.getChannelData(1);
                audioData = new Float32Array(left.length);
                for (let i = 0; i < left.length; ++i) {
                    audioData[i] = (left[i] + right[i]) / 2;
                }
            } else {
                audioData = audioBuffer.getChannelData(0);
            }

            // 2. Run transcription
            const output = await transcriber(audioData, {
                chunk_length_s: 30,
                stride_length_s: 5,
                language: 'vietnamese', // Default to Vietnamese, Whisper will auto-detect if needed
                task: 'transcribe',
                return_timestamps: true,
            });

            // 3. Post-process into 10-12 words per line
            const formattedSubtitles: SubtitleLine[] = [];
            
            // Whisper returns chunks with timestamps
            // We need to split long chunks or join short ones to meet the 10-12 words requirement
            const allWords: { text: string; timestamp: number }[] = [];
            
            output.chunks.forEach((chunk: any) => {
                const words = chunk.text.trim().split(/\s+/);
                const startTime = chunk.timestamp[0] || 0;
                const endTime = chunk.timestamp[1] || startTime + 2;
                const duration = endTime - startTime;
                
                words.forEach((word: string, idx: number) => {
                    allWords.push({
                        text: word,
                        timestamp: startTime + (idx / words.length) * duration
                    });
                });
            });

            // Group words into lines of 10-12
            let currentLine: string[] = [];
            let lineStartTime = 0;

            allWords.forEach((wordObj, idx) => {
                if (currentLine.length === 0) lineStartTime = wordObj.timestamp;
                
                currentLine.push(wordObj.text);

                // If we reach 11 words or it's the last word
                if (currentLine.length >= 11 || idx === allWords.length - 1) {
                    const minutes = Math.floor(lineStartTime / 60);
                    const seconds = Math.floor(lineStartTime % 60);
                    const timestamp = `[${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}]`;
                    
                    formattedSubtitles.push({
                        timestamp,
                        text: currentLine.join(' ')
                    });
                    currentLine = [];
                }
            });

            setSubtitles(formattedSubtitles);
        } catch (err: any) {
            console.error("Transcription error:", err);
            setError(err.message || "Có lỗi xảy ra trong quá trình trích xuất phụ đề.");
        } finally {
            setIsProcessing(false);
        }
    };

    const copyToClipboard = () => {
        const text = subtitles.map(s => `${s.timestamp} ${s.text}`).join('\n');
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const downloadSrt = () => {
        let srt = "";
        subtitles.forEach((s, i) => {
            const startTime = s.timestamp.replace('[', '').replace(']', '');
            // Simple SRT format
            srt += `${i + 1}\n00:${startTime},000 --> 00:${startTime},500\n${s.text}\n\n`;
        });

        const blob = new Blob([srt], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'subtitles.srt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="glass-effect p-8 rounded-[2.5rem] border border-white/5 shadow-2xl relative overflow-hidden group">
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl group-hover:bg-indigo-500/20 transition-all duration-700"></div>
                
                <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="p-3 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 shadow-lg">
                            <Cpu className="w-6 h-6 text-indigo-400" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-gray-100 uppercase tracking-tighter italic">Trích Phụ Đề (Local AI)</h2>
                            <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mt-1">Whisper Browser-Based Transcription</p>
                        </div>
                    </div>

                    <div 
                        onClick={() => fileInputRef.current?.click()}
                        className={`border-2 border-dashed rounded-[2rem] p-12 text-center cursor-pointer transition-all duration-500 ${file ? 'border-teal-500/30 bg-teal-500/5' : 'border-white/10 hover:border-indigo-500/30 hover:bg-white/5'}`}
                    >
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            onChange={handleFileChange} 
                            accept="audio/*" 
                            className="hidden" 
                        />
                        
                        <div className="flex flex-col items-center gap-4">
                            {file ? (
                                <>
                                    <div className="p-4 bg-teal-500/20 rounded-full shadow-lg animate-bounce">
                                        <FileAudio className="w-10 h-10 text-teal-400" />
                                    </div>
                                    <div>
                                        <p className="text-white font-bold">{file.name}</p>
                                        <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB • Sẵn sàng xử lý</p>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="p-4 bg-white/5 rounded-full">
                                        <Upload className="w-10 h-10 text-gray-600" />
                                    </div>
                                    <div>
                                        <p className="text-gray-400 font-medium">Kéo thả hoặc click để tải lên file Audio</p>
                                        <p className="text-[10px] text-gray-600 uppercase tracking-widest mt-2">MP3, WAV, M4A... (Max 20MB)</p>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {isModelLoading && Object.keys(loadingFiles).length > 0 && (
                        <div className="mt-8 space-y-4 animate-in fade-in duration-500">
                            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-2">
                                <Loader2 className="w-3 h-3 animate-spin" />
                                <span>Đang chuẩn bị mô hình AI (Whisper Tiny)...</span>
                            </div>
                            
                            <div className="space-y-3 max-h-40 overflow-y-auto pr-2 no-scrollbar">
                                {Object.keys(loadingFiles).map((filename) => {
                                    const info = loadingFiles[filename];
                                    return (
                                        <div key={filename} className="space-y-1.5">
                                            <div className="flex justify-between items-center text-[9px] font-bold uppercase tracking-wider text-gray-500">
                                                <span className="truncate max-w-[200px]">{filename}</span>
                                                <span className={info.status === 'done' ? 'text-teal-500' : 'text-indigo-400'}>
                                                    {info.status === 'done' ? 'Hoàn tất' : `${Math.round(info.progress)}%`}
                                                </span>
                                            </div>
                                            <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                                <div 
                                                    className={`h-full transition-all duration-300 ${info.status === 'done' ? 'bg-teal-500 shadow-[0_0_8px_rgba(20,184,166,0.5)]' : 'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]'}`}
                                                    style={{ width: `${info.progress}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            
                            <p className="text-[9px] text-gray-600 italic mt-2">
                                Lần đầu tải sẽ mất chút thời gian (khoảng 75MB). Các lần sau sẽ được lấy từ bộ nhớ đệm trình duyệt.
                            </p>
                        </div>
                    )}

                    {error && (
                        <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-400 text-xs font-bold animate-in fade-in slide-in-from-top-2">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            {error}
                        </div>
                    )}

                    <button
                        onClick={processAudio}
                        disabled={!file || isProcessing || isModelLoading}
                        className={`w-full mt-8 py-5 rounded-2xl text-xs font-black uppercase tracking-[0.3em] transition-all active:scale-[0.98] flex items-center justify-center gap-3 shadow-2xl ${!file || isProcessing || isModelLoading ? 'bg-white/5 text-gray-600 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/20'}`}
                    >
                        {isProcessing ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Đang trích xuất...
                            </>
                        ) : (
                            <>
                                <Scissors className="w-5 h-5" />
                                Bắt đầu trích phụ đề
                            </>
                        )}
                    </button>
                </div>
            </div>

            {subtitles.length > 0 && (
                <div className="glass-effect p-8 rounded-[2.5rem] border border-white/5 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="flex justify-between items-center mb-8">
                        <h3 className="text-lg font-black text-white uppercase tracking-tighter italic flex items-center gap-3">
                            <span className="h-2 w-2 rounded-full bg-teal-500 animate-pulse"></span>
                            Kết quả trích xuất
                        </h3>
                        <div className="flex gap-2">
                            <button 
                                onClick={copyToClipboard}
                                className="p-3 bg-white/5 rounded-xl hover:bg-white/10 text-gray-400 hover:text-white transition-all active:scale-90 border border-white/5"
                                title="Sao chép tất cả"
                            >
                                {copied ? <Check className="w-4 h-4 text-teal-400" /> : <Copy className="w-4 h-4" />}
                            </button>
                            <button 
                                onClick={downloadSrt}
                                className="p-3 bg-white/5 rounded-xl hover:bg-white/10 text-gray-400 hover:text-white transition-all active:scale-90 border border-white/5"
                                title="Tải file SRT"
                            >
                                <Download className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    <div className="space-y-3 max-h-[500px] overflow-y-auto no-scrollbar pr-2">
                        {subtitles.map((line, idx) => (
                            <div key={idx} className="group flex items-start gap-4 p-4 bg-white/[0.02] hover:bg-white/[0.05] rounded-2xl border border-white/5 transition-all">
                                <span className="text-[10px] font-black text-teal-500/70 bg-teal-500/5 px-2 py-1 rounded-lg border border-teal-500/10 shrink-0 mt-0.5">
                                    {line.timestamp}
                                </span>
                                <p className="text-sm text-gray-300 font-medium leading-relaxed group-hover:text-white transition-colors">
                                    {line.text}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};


import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Download, RotateCcw, Sliders, Music, Gauge, Info } from 'lucide-react';
import { audioBufferToWav } from '../services/audioUtils';

interface AudioPostProcessorProps {
    audioUrl: string;
}

export const AudioPostProcessor: React.FC<AudioPostProcessorProps> = ({ audioUrl }) => {
    const [speed, setSpeed] = useState(1.0);
    const [pitch, setPitch] = useState(0); // in cents
    const [isPlaying, setIsPlaying] = useState(false);
    const [isRendering, setIsRendering] = useState(false);
    const [progress, setProgress] = useState(0);
    
    const audioContextRef = useRef<AudioContext | null>(null);
    const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
    const audioBufferRef = useRef<AudioBuffer | null>(null);
    const startTimeRef = useRef<number>(0);
    const playTimerRef = useRef<number | null>(null);

    // Load audio buffer
    useEffect(() => {
        const loadAudio = async () => {
            try {
                const response = await fetch(audioUrl);
                const arrayBuffer = await response.arrayBuffer();
                const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
                const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
                audioBufferRef.current = audioBuffer;
                audioContextRef.current = audioContext;
            } catch (error) {
                console.error("Failed to load audio for post-processing:", error);
            }
        };
        loadAudio();
        
        return () => {
            stopAudio();
            if (audioContextRef.current) {
                audioContextRef.current.close();
            }
        };
    }, [audioUrl]);

    const stopAudio = () => {
        if (sourceNodeRef.current) {
            sourceNodeRef.current.stop();
            sourceNodeRef.current = null;
        }
        if (playTimerRef.current) {
            window.clearInterval(playTimerRef.current);
            playTimerRef.current = null;
        }
        setIsPlaying(false);
        setProgress(0);
    };

    const playAudio = () => {
        if (!audioBufferRef.current || !audioContextRef.current) return;

        if (isPlaying) {
            stopAudio();
            return;
        }

        // Resume context if suspended (browser policy)
        if (audioContextRef.current.state === 'suspended') {
            audioContextRef.current.resume();
        }

        const source = audioContextRef.current.createBufferSource();
        source.buffer = audioBufferRef.current;
        
        // Combine speed and pitch into a single playbackRate for the "tape" effect
        // playbackRate = speed * 2^(pitch/1200)
        const effectivePlaybackRate = speed * Math.pow(2, pitch / 1200);
        source.playbackRate.value = effectivePlaybackRate;
        
        source.connect(audioContextRef.current.destination);
        
        source.onended = () => {
            setIsPlaying(false);
            setProgress(0);
            if (playTimerRef.current) window.clearInterval(playTimerRef.current);
        };
        
        const startTime = audioContextRef.current.currentTime;
        source.start(0);
        sourceNodeRef.current = source;
        setIsPlaying(true);
        
        // Update progress bar
        const duration = audioBufferRef.current.duration / effectivePlaybackRate;
        playTimerRef.current = window.setInterval(() => {
            const elapsed = audioContextRef.current!.currentTime - startTime;
            const p = (elapsed / duration) * 100;
            if (p <= 100) setProgress(p);
            else stopAudio();
        }, 50);
    };

    const handleDownload = async () => {
        if (!audioBufferRef.current) return;
        setIsRendering(true);

        try {
            const effectivePlaybackRate = speed * Math.pow(2, pitch / 1200);
            const renderedDuration = audioBufferRef.current.duration / effectivePlaybackRate;
            
            const offlineCtx = new OfflineAudioContext(
                audioBufferRef.current.numberOfChannels,
                Math.ceil(renderedDuration * audioBufferRef.current.sampleRate),
                audioBufferRef.current.sampleRate
            );

            const source = offlineCtx.createBufferSource();
            source.buffer = audioBufferRef.current;
            source.playbackRate.value = effectivePlaybackRate;
            source.connect(offlineCtx.destination);
            source.start();

            const renderedBuffer = await offlineCtx.startRendering();
            const wavBlob = audioBufferToWav(renderedBuffer);
            
            const url = URL.createObjectURL(wavBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `audio_custom_${speed}x_${pitch}cents.wav`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Rendering failed:", error);
            alert("Có lỗi xảy ra khi xử lý audio.");
        } finally {
            setIsRendering(false);
        }
    };

    const reset = () => {
        stopAudio();
        setSpeed(1.0);
        setPitch(0);
    };

    return (
        <div className="mt-6 p-6 bg-white/[0.03] border border-white/10 rounded-[2.5rem] space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
                        <Sliders className="w-4 h-4 text-indigo-400" />
                    </div>
                    <div>
                        <h4 className="text-[11px] font-black text-white uppercase tracking-widest italic">Hậu Kỳ & Hiệu Ứng</h4>
                        <p className="text-[9px] text-gray-500 uppercase font-bold tracking-tighter">Tùy chỉnh âm sắc sau khi tạo</p>
                    </div>
                </div>
                <button 
                    onClick={reset}
                    className="p-2.5 text-gray-600 hover:text-white hover:bg-white/5 rounded-xl transition-all active:scale-90"
                    title="Đặt lại"
                >
                    <RotateCcw className="w-4 h-4" />
                </button>
            </div>

            {/* Progress Bar */}
            <div className="relative h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                <div 
                    className="absolute top-0 left-0 h-full bg-indigo-500 transition-all duration-75 ease-linear"
                    style={{ width: `${progress}%` }}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Speed Control */}
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <label className="text-[10px] font-black text-gray-400 uppercase flex items-center gap-2 tracking-widest">
                            <Gauge className="w-3.5 h-3.5 text-teal-500" />
                            Tốc độ: <span className="text-white">{speed.toFixed(2)}x</span>
                        </label>
                    </div>
                    <input 
                        type="range" 
                        min="0.5" 
                        max="2.0" 
                        step="0.05" 
                        value={speed}
                        onChange={(e) => {
                            setSpeed(parseFloat(e.target.value));
                            if (isPlaying) stopAudio();
                        }}
                        className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-teal-500 hover:accent-teal-400 transition-all"
                    />
                    <div className="flex justify-between text-[8px] font-black text-gray-600 uppercase tracking-widest">
                        <span>Chậm</span>
                        <span>Nhanh</span>
                    </div>
                </div>

                {/* Pitch Control */}
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <label className="text-[10px] font-black text-gray-400 uppercase flex items-center gap-2 tracking-widest">
                            <Music className="w-3.5 h-3.5 text-indigo-500" />
                            Độ cao: <span className="text-white">{pitch > 0 ? `+${pitch}` : pitch}</span>
                        </label>
                    </div>
                    <input 
                        type="range" 
                        min="-1200" 
                        max="1200" 
                        step="100" 
                        value={pitch}
                        onChange={(e) => {
                            setPitch(parseInt(e.target.value));
                            if (isPlaying) stopAudio();
                        }}
                        className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-400 transition-all"
                    />
                    <div className="flex justify-between text-[8px] font-black text-gray-600 uppercase tracking-widest">
                        <span>Trầm</span>
                        <span>Thanh</span>
                    </div>
                </div>
            </div>

            <div className="flex gap-4 pt-2">
                <button 
                    onClick={playAudio}
                    className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 border ${isPlaying ? 'bg-red-500/10 text-red-400 border-red-500/30' : 'bg-white/5 text-white border-white/10 hover:bg-white/10'}`}
                >
                    {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                    {isPlaying ? 'Dừng Nghe' : 'Nghe Thử'}
                </button>
                <button 
                    onClick={handleDownload}
                    disabled={isRendering}
                    className="flex-1 flex items-center justify-center gap-3 py-4 rounded-2xl text-[10px] font-black text-white bg-indigo-600 hover:bg-indigo-500 shadow-[0_10px_20px_-5px_rgba(79,70,229,0.3)] transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-widest"
                >
                    {isRendering ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                        <Download className="w-4 h-4" />
                    )}
                    {isRendering ? 'Đang xử lý...' : 'Tải bản chỉnh sửa'}
                </button>
            </div>
            
            <div className="flex items-start gap-2 p-3 bg-indigo-500/5 rounded-xl border border-indigo-500/10">
                <Info className="w-3.5 h-3.5 text-indigo-400 mt-0.5 shrink-0" />
                <p className="text-[9px] text-gray-500 leading-relaxed italic">
                    Công cụ này cho phép bạn tinh chỉnh âm sắc của giọng nói sau khi đã tạo xong. 
                    Lưu ý: Tốc độ và độ cao được liên kết với nhau để đảm bảo chất lượng âm thanh tự nhiên nhất.
                    File tải về sẽ ở định dạng <span className="text-indigo-400 font-bold">.WAV</span> chất lượng cao.
                </p>
            </div>
        </div>
    );
};

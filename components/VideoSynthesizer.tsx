
import React, { useState, useRef, useEffect } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import { 
    Video, 
    Music, 
    Type, 
    Image as ImageIcon, 
    Settings as SettingsIcon, 
    Play, 
    Download, 
    Loader2, 
    AlertCircle,
    CheckCircle2,
    Eye
} from 'lucide-react';

export const VideoSynthesizer: React.FC = () => {
    const [ffmpeg, setFfmpeg] = useState<FFmpeg | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [status, setStatus] = useState('Sẵn sàng');
    const [error, setError] = useState<string | null>(null);
    const [outputUrl, setOutputUrl] = useState<string | null>(null);

    // Files
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [audioFile, setAudioFile] = useState<File | null>(null);
    const [subFile, setSubFile] = useState<File | null>(null);
    const [logoFile, setLogoFile] = useState<File | null>(null);

    // Configs
    const [originalVolume, setOriginalVolume] = useState(15);
    const [logoX, setLogoX] = useState(800);
    const [logoY, setLogoY] = useState(100);
    const [logoScale, setLogoScale] = useState(0.15);
    const [subBottom, setSubBottom] = useState(30);
    const [subFontSize, setSubFontSize] = useState(18);
    const [subColor, setSubColor] = useState('#FFFFFF');
    const [videoCrf, setVideoCrf] = useState(32);
    const [videoPreset, setVideoPreset] = useState('ultrafast');
    const [isPreviewMode, setIsPreviewMode] = useState(false);

    // Subtitle Styles
    const [subStyle, setSubStyle] = useState<'plain' | 'outline' | 'shadow' | 'box'>('outline');

    useEffect(() => {
        loadFfmpeg();
    }, []);

    const loadFfmpeg = async () => {
        const ffmpegInstance = new FFmpeg();
        setStatus('Đang tải bộ xử lý...');
        
        try {
            const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
            
            ffmpegInstance.on('log', ({ message }) => {
                console.log('FFmpeg Log:', message);
            });

            await ffmpegInstance.load({
                coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
                wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
            });
            setFfmpeg(ffmpegInstance);
            setIsLoaded(true);
            setStatus('Sẵn sàng');
        } catch (err) {
            console.error('FFmpeg load error:', err);
            setError('Không thể tải bộ xử lý video. Vui lòng thử lại.');
        }
    };

    const handleProcess = async (quickPreview: boolean = false) => {
        if (!ffmpeg || !videoFile) {
            setError('Vui lòng chọn Video gốc (*)');
            return;
        }

        setIsProcessing(true);
        setIsPreviewMode(quickPreview);
        setError(null);
        setOutputUrl(null);
        setProgress(0);
        setStatus(quickPreview ? 'Đang tạo bản xem thử (5s)...' : 'Đang xử lý toàn bộ video...');

        ffmpeg.on('progress', ({ progress }) => {
            setProgress(Math.round(progress * 100));
        });

        try {
            const videoName = 'input_video.mp4';
            await ffmpeg.writeFile(videoName, await fetchFile(videoFile));

            let audioName = '';
            if (audioFile) {
                audioName = 'input_audio.mp3';
                await ffmpeg.writeFile(audioName, await fetchFile(audioFile));
            }

            let logoName = '';
            if (logoFile) {
                logoName = 'input_logo.png';
                await ffmpeg.writeFile(logoName, await fetchFile(logoFile));
            }

            let subName = '';
            if (subFile) {
                subName = 'input_sub.srt';
                await ffmpeg.writeFile(subName, await fetchFile(subFile));
            }

            let filterComplex = '';
            let videoStream = '[0:v]';
            let audioStream = '[0:a]';

            // Define input indices
            let currentInputIdx = 1;
            let audioInputIdx = -1;
            let logoInputIdx = -1;

            const args = [];
            args.push('-i', videoName);

            if (audioFile) {
                args.push('-i', audioName);
                audioInputIdx = currentInputIdx++;
            }
            if (logoFile) {
                args.push('-i', logoName);
                logoInputIdx = currentInputIdx++;
            }

            // 1. Logo Overlay
            if (logoFile && logoInputIdx !== -1) {
                filterComplex += `[${logoInputIdx}:v]scale=iw*${logoScale}:-1[logo];`;
                filterComplex += `${videoStream}[logo]overlay=${logoX}:${logoY}[v1];`;
                videoStream = '[v1]';
            }

            // 2. Subtitles
            if (subFile) {
                const colorHex = subColor.replace('#', '');
                const bgrColor = colorHex.match(/.{2}/g)?.reverse().join('') || 'FFFFFF';
                
                let styleStr = `FontSize=${subFontSize},PrimaryColour=&H00${bgrColor},Alignment=2,MarginV=${subBottom}`;
                
                if (subStyle === 'outline') {
                    styleStr += `,Outline=2,BorderStyle=1,OutlineColour=&H00000000`;
                } else if (subStyle === 'shadow') {
                    styleStr += `,Shadow=2,BorderStyle=1,BackColour=&H80000000`;
                } else if (subStyle === 'box') {
                    styleStr += `,BorderStyle=3,BackColour=&H80000000`;
                }

                filterComplex += `${videoStream}subtitles=${subName}:force_style='${styleStr}'[v2];`;
                videoStream = '[v2]';
            }

            // 3. Audio Mixing
            if (audioFile && audioInputIdx !== -1) {
                const vol = originalVolume / 100;
                filterComplex += `[0:a]volume=${vol}[a_orig];`;
                filterComplex += `[${audioInputIdx}:a][a_orig]amix=inputs=2:duration=longest[aout]`;
                audioStream = '[aout]';
            }

            if (filterComplex) {
                args.push('-filter_complex', filterComplex);
                args.push('-map', videoStream.replace(/\[|\]/g, ''));
                const aMap = audioStream.replace(/\[|\]/g, '');
                args.push('-map', audioStream === '[0:a]' ? `${aMap}?` : aMap);
            } else {
                // If no filters, map default streams
                args.push('-map', '0:v', '-map', '0:a?');
            }

            if (quickPreview) {
                args.push('-t', '5');
            }

            args.push('-c:v', 'libx264');
            args.push('-crf', videoCrf.toString());
            args.push('-preset', videoPreset);
            args.push('-c:a', 'aac');
            args.push('output.mp4');

            const exitCode = await ffmpeg.exec(args);
            
            if (exitCode !== 0) {
                throw new Error(`FFmpeg failed with exit code ${exitCode}. Check console for details.`);
            }

            const data = await ffmpeg.readFile('output.mp4');
            const url = URL.createObjectURL(new Blob([(data as any).buffer], { type: 'video/mp4' }));
            setOutputUrl(url);
            setStatus(quickPreview ? 'Đã tạo bản xem thử' : 'Hoàn tất');
        } catch (err: any) {
            console.error('Processing error:', err);
            const errorMessage = err?.message || (typeof err === 'string' ? err : 'Lỗi không xác định');
            setError('Lỗi xử lý: ' + errorMessage);
            setStatus('Lỗi');
        } finally {
            setIsProcessing(false);
        }
    };

    const setMode = (mode: 'audio' | 'sub' | 'logo' | 'all') => {
        if (mode === 'audio') {
            setSubFile(null);
            setLogoFile(null);
        } else if (mode === 'sub') {
            setAudioFile(null);
            setLogoFile(null);
        } else if (mode === 'logo') {
            setAudioFile(null);
            setSubFile(null);
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-8 pb-20">
            <div className="text-center space-y-4">
                <div className="inline-block px-4 py-1 bg-red-500/10 rounded-full border border-red-500/20">
                    <span className="text-[10px] font-black text-red-500 uppercase tracking-[0.3em]">Video Processing Suite</span>
                </div>
                <h1 className="text-5xl font-black text-white uppercase tracking-tighter italic">Lồng Video Đa Năng</h1>
                <p className="text-xs text-gray-500 font-bold uppercase tracking-widest max-w-md mx-auto leading-relaxed">
                    Công cụ xử lý video chuyên nghiệp tích hợp FFmpeg. Tự động hóa việc lồng tiếng, phụ đề và đóng dấu bản quyền.
                </p>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <ModeButton label="Lồng Audio" icon={<Music className="w-4 h-4" />} onClick={() => setMode('audio')} color="indigo" />
                <ModeButton label="Lồng Sub" icon={<Type className="w-4 h-4" />} onClick={() => setMode('sub')} color="amber" />
                <ModeButton label="Lồng Logo" icon={<ImageIcon className="w-4 h-4" />} onClick={() => setMode('logo')} color="teal" />
                <ModeButton label="Tổng Hợp" icon={<Play className="w-4 h-4" />} onClick={() => setMode('all')} color="red" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Inputs */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="glass-effect p-6 rounded-[2.5rem] border border-white/5 shadow-2xl space-y-4">
                        <h3 className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2 flex items-center gap-2">
                            <Video className="w-3 h-3" /> Nguồn dữ liệu
                        </h3>
                        <FileInput label="Video gốc (*)" icon={<Video className="w-4 h-4" />} accept="video/*" onChange={setVideoFile} file={videoFile} required />
                        <FileInput label="Audio phụ" icon={<Music className="w-4 h-4" />} accept="audio/*" onChange={setAudioFile} file={audioFile} />
                        <FileInput label="File Sub (.srt)" icon={<Type className="w-4 h-4" />} accept=".srt" onChange={setSubFile} file={subFile} />
                        <FileInput label="File Logo" icon={<ImageIcon className="w-4 h-4" />} accept="image/*" onChange={setLogoFile} file={logoFile} />
                    </div>

                    <div className="glass-effect p-6 rounded-[2.5rem] border border-white/5 shadow-2xl">
                        <h3 className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <SettingsIcon className="w-3 h-3" /> Xuất Video
                        </h3>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <label className="text-[9px] font-black text-gray-500 uppercase">Độ nét (CRF: {videoCrf})</label>
                                    <span className="text-[9px] font-bold text-emerald-500 uppercase">{videoCrf <= 23 ? 'Cao' : videoCrf <= 32 ? 'Trung bình' : 'Thấp'}</span>
                                </div>
                                <input type="range" min="18" max="40" value={videoCrf} onChange={(e) => setVideoCrf(Number(e.target.value))} className="w-full accent-emerald-500 h-1 bg-white/5 rounded-lg appearance-none cursor-pointer" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-gray-500 uppercase">Tốc độ</label>
                                    <select value={videoPreset} onChange={(e) => setVideoPreset(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl p-2 text-[10px] text-white outline-none">
                                        {['ultrafast', 'superfast', 'veryfast', 'faster', 'fast', 'medium'].map(p => <option key={p} value={p}>{p}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Middle Column: Customization */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Audio & Sub Style */}
                        <div className="space-y-6">
                            <div className="glass-effect p-6 rounded-[2.5rem] border border-white/5 shadow-xl">
                                <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <Music className="w-3 h-3" /> Âm thanh
                                </h3>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-bold text-gray-400">Âm lượng gốc</label>
                                        <span className="text-xs font-black text-indigo-400">{originalVolume}%</span>
                                    </div>
                                    <input type="range" min="0" max="100" value={originalVolume} onChange={(e) => setOriginalVolume(Number(e.target.value))} className="w-full accent-indigo-500 h-1 bg-white/5 rounded-lg appearance-none cursor-pointer" />
                                </div>
                            </div>

                            <div className="glass-effect p-6 rounded-[2.5rem] border border-white/5 shadow-xl">
                                <h3 className="text-[10px] font-black text-amber-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <Type className="w-3 h-3" /> Kiểu chữ Sub
                                </h3>
                                <div className="grid grid-cols-2 gap-2 mb-4">
                                    {(['plain', 'outline', 'shadow', 'box'] as const).map(s => (
                                        <button key={s} onClick={() => setSubStyle(s)} className={`py-2 rounded-xl text-[9px] font-black uppercase transition-all border ${subStyle === s ? 'bg-amber-500 text-black border-amber-500' : 'bg-white/5 text-gray-500 border-white/5 hover:border-amber-500/30'}`}>
                                            {s}
                                        </button>
                                    ))}
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-black text-gray-500 uppercase">Cỡ chữ</label>
                                        <input type="number" value={subFontSize} onChange={(e) => setSubFontSize(Number(e.target.value))} className="w-full bg-black/40 border border-white/10 rounded-xl p-2 text-xs text-white text-center" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-black text-gray-500 uppercase">Cách đáy</label>
                                        <input type="number" value={subBottom} onChange={(e) => setSubBottom(Number(e.target.value))} className="w-full bg-black/40 border border-white/10 rounded-xl p-2 text-xs text-white text-center" />
                                    </div>
                                    <div className="col-span-2 flex items-center justify-between p-2 bg-black/20 rounded-xl border border-white/5">
                                        <span className="text-[10px] font-bold text-gray-500 uppercase ml-2">Màu sắc</span>
                                        <input type="color" value={subColor} onChange={(e) => setSubColor(e.target.value)} className="w-8 h-8 rounded-lg bg-transparent cursor-pointer border-none" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Logo Customization */}
                        <div className="glass-effect p-6 rounded-[2.5rem] border border-white/5 shadow-xl">
                            <h3 className="text-[10px] font-black text-teal-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <ImageIcon className="w-3 h-3" /> Vị trí Logo
                            </h3>
                            <div className="aspect-video bg-black/60 rounded-2xl border border-white/5 relative overflow-hidden mb-4 group">
                                <div className="absolute inset-0 flex items-center justify-center opacity-20 group-hover:opacity-40 transition-opacity">
                                    <span className="text-[8px] font-black uppercase tracking-[0.5em] text-white">Preview Area</span>
                                </div>
                                {/* Visual representation of logo position */}
                                <div 
                                    className="absolute bg-teal-500/20 border border-teal-500/50 rounded flex items-center justify-center"
                                    style={{ 
                                        left: `${(logoX / 1920) * 100}%`, 
                                        top: `${(logoY / 1080) * 100}%`,
                                        width: `${logoScale * 100}%`,
                                        height: '20%'
                                    }}
                                >
                                    <ImageIcon className="w-4 h-4 text-teal-400 opacity-50" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-gray-500 uppercase">Tọa độ X</label>
                                    <input type="number" value={logoX} onChange={(e) => setLogoX(Number(e.target.value))} className="w-full bg-black/40 border border-white/10 rounded-xl p-2 text-xs text-white text-center" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-gray-500 uppercase">Tọa độ Y</label>
                                    <input type="number" value={logoY} onChange={(e) => setLogoY(Number(e.target.value))} className="w-full bg-black/40 border border-white/10 rounded-xl p-2 text-xs text-white text-center" />
                                </div>
                                <div className="col-span-2 space-y-1">
                                    <label className="text-[9px] font-black text-gray-500 uppercase">Tỷ lệ: {Math.round(logoScale * 100)}%</label>
                                    <input type="range" min="0.05" max="0.5" step="0.01" value={logoScale} onChange={(e) => setLogoScale(Number(e.target.value))} className="w-full accent-teal-500 h-1 bg-white/5 rounded-lg appearance-none cursor-pointer" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Progress & Actions */}
                    <div className="glass-effect p-8 rounded-[3rem] border border-white/5 shadow-2xl space-y-6">
                        <div className="flex flex-col items-center gap-3">
                            <div className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest ${status === 'Lỗi' ? 'text-red-500' : status === 'Hoàn tất' ? 'text-emerald-500' : 'text-gray-500'}`}>
                                {isProcessing ? <Loader2 className="w-3 h-3 animate-spin" /> : status === 'Hoàn tất' ? <CheckCircle2 className="w-3 h-3" /> : status === 'Lỗi' ? <AlertCircle className="w-3 h-3" /> : null}
                                {status}
                            </div>
                            {isProcessing && (
                                <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                                    <div className="h-full bg-gradient-to-r from-indigo-500 to-teal-500 transition-all duration-300 shadow-[0_0_15px_rgba(99,102,241,0.4)]" style={{ width: `${progress}%` }}></div>
                                </div>
                            )}
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4">
                            <button 
                                onClick={() => handleProcess(true)}
                                disabled={!videoFile || isProcessing || !isLoaded}
                                className="flex-1 py-5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-[11px] font-black uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-30"
                            >
                                <Eye className="w-4 h-4" /> Xem thử 5s
                            </button>
                            <button 
                                onClick={() => handleProcess(false)}
                                disabled={!videoFile || isProcessing || !isLoaded}
                                className="flex-[2] py-5 rounded-2xl bg-red-600 hover:bg-red-500 text-white text-xs font-black uppercase tracking-[0.3em] shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-30"
                            >
                                {isProcessing && !isPreviewMode ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}
                                Bắt đầu xử lý
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Output Section */}
            {outputUrl && (
                <div className="glass-effect p-10 rounded-[3.5rem] border border-white/5 shadow-2xl animate-in fade-in slide-in-from-bottom-8 duration-1000">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-8">
                        <div>
                            <h3 className="text-2xl font-black text-white uppercase tracking-tighter italic flex items-center gap-4">
                                <span className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_15px_rgba(16,185,129,0.5)]"></span>
                                {isPreviewMode ? 'Bản xem thử (5 giây)' : 'Video hoàn thiện'}
                            </h3>
                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">Sẵn sàng để tải về hoặc xem lại</p>
                        </div>
                        <a href={outputUrl} download={isPreviewMode ? 'preview.mp4' : 'final_video.mp4'} className="w-full md:w-auto px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-black rounded-2xl transition-all active:scale-90 shadow-2xl flex items-center justify-center gap-3 text-xs font-black uppercase tracking-widest">
                            <Download className="w-5 h-5" /> Tải về máy
                        </a>
                    </div>
                    <div className="relative group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500/20 to-teal-500/20 rounded-[2rem] blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
                        <video src={outputUrl} controls className="w-full rounded-[2rem] shadow-2xl border border-white/10 relative z-10" />
                    </div>
                </div>
            )}

            {error && (
                <div className="fixed bottom-8 right-8 max-w-sm p-4 bg-red-500/90 backdrop-blur-xl border border-red-400/20 rounded-2xl flex items-center gap-3 text-white text-xs font-bold shadow-2xl animate-in fade-in slide-in-from-right-4 z-[100]">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <div className="flex-grow">{error}</div>
                    <button onClick={() => setError(null)} className="p-1 hover:bg-white/10 rounded-lg transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
            )}
        </div>
    );
};

const ModeButton: React.FC<{ label: string; icon: React.ReactNode; onClick: () => void; color: string }> = ({ label, icon, onClick, color }) => {
    const colors: Record<string, string> = {
        indigo: 'hover:bg-indigo-500/20 text-indigo-400 border-indigo-500/20',
        amber: 'hover:bg-amber-500/20 text-amber-400 border-amber-500/20',
        teal: 'hover:bg-teal-500/20 text-teal-400 border-teal-500/20',
        red: 'hover:bg-red-500/20 text-red-400 border-red-500/20'
    };
    return (
        <button onClick={onClick} className={`flex items-center justify-center gap-3 p-4 rounded-2xl glass-effect border transition-all active:scale-95 text-[10px] font-black uppercase tracking-widest ${colors[color]}`}>
            {icon} {label}
        </button>
    );
};

const FileInput: React.FC<{ label: string; icon: React.ReactNode; accept: string; onChange: (file: File | null) => void; file: File | null; required?: boolean }> = ({ label, icon, accept, onChange, file, required }) => {
    const inputRef = useRef<HTMLInputElement>(null);
    return (
        <div className="flex items-center gap-4 bg-black/20 p-3 rounded-2xl border border-white/5 group hover:border-white/10 transition-all cursor-pointer" onClick={() => inputRef.current?.click()}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${file ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-gray-500 group-hover:text-white'}`}>
                {file ? <CheckCircle2 className="w-5 h-5" /> : icon}
            </div>
            <div className="flex-grow min-w-0">
                <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">{label} {required && <span className="text-red-500">*</span>}</p>
                <p className="text-[11px] font-bold text-gray-300 truncate">{file ? file.name : 'Chưa chọn file'}</p>
            </div>
            <input type="file" ref={inputRef} accept={accept} onChange={(e) => onChange(e.target.files?.[0] || null)} className="hidden" />
        </div>
    );
};


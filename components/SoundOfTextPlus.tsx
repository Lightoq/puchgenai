
import React, { useState, useRef } from 'react';
import { 
  Volume2, 
  Download, 
  Trash2, 
  Play, 
  Loader2, 
  Plus, 
  History,
  Globe,
  AlertCircle,
  FastForward
} from 'lucide-react';

const LANGUAGES = [
  { code: 'vi', name: 'Vietnamese (Tiếng Việt)' },
  { code: 'en', name: 'English (Tiếng Anh)' },
  { code: 'ja', name: 'Japanese (Tiếng Nhật)' },
  { code: 'ko', name: 'Korean (Tiếng Hàn)' },
  { code: 'fr', name: 'French (Tiếng Pháp)' },
  { code: 'de', name: 'German (Tiếng Đức)' },
  { code: 'zh-CN', name: 'Chinese (Tiếng Trung)' },
  { code: 'th', name: 'Thai (Tiếng Thái)' },
  { code: 'es', name: 'Spanish (Tiếng Tây Ban Nha)' },
];

export const SoundOfTextPlus: React.FC = () => {
  const [text, setText] = useState('');
  const [lang, setLang] = useState('vi');
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Ref để quản lý audio element ẩn
  const audioRef = useRef(new Audio());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || loading) return;

    setLoading(true);
    setError(null);

    const encodedText = encodeURIComponent(text.trim());
    // Thêm tham số ttsspeed để Google xử lý tốc độ cơ bản nếu cần, 
    // nhưng chúng ta sẽ điều khiển chính xác bằng playbackRate ở client.
    const audioUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodedText}&tl=${lang}&client=tw-ob`;

    const newItem = {
      id: Date.now(),
      text: text.trim(),
      langCode: lang,
      url: audioUrl,
      speed: 1.0,
      timestamp: new Date().toLocaleTimeString()
    };

    // Thêm luôn vào danh sách, không đợi load trước để tránh lỗi CORS/Preload của trình duyệt
    setItems(prev => [newItem, ...prev]);
    setText('');
    setLoading(false);
  };

  const updateItemParam = (id: number, param: string, value: string) => {
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, [param]: parseFloat(value) } : item
    ));
  };

  const playAudio = (item: any) => {
    setError(null);
    try {
      const audio = audioRef.current;
      audio.src = item.url;
      audio.playbackRate = item.speed;
      
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(err => {
          console.error("Playback error:", err);
          setError("Không thể phát âm thanh. Có thể do Google chặn truy cập trực tiếp hoặc lỗi mạng.");
        });
      }
    } catch (err) {
      setError("Lỗi khi khởi tạo trình phát.");
    }
  };

  const deleteItem = (id: number) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  return (
    <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
        <header className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-2xl shadow-xl shadow-indigo-200 mb-4 animate-bounce-slow">
            <Volume2 className="text-white w-8 h-8" />
          </div>
          <h1 className="text-3xl font-black text-white uppercase tracking-tighter italic">Sound of Text Plus</h1>
          <p className="text-gray-500 mt-1 text-[10px] uppercase font-black tracking-widest">Chuyển đổi văn bản thành giọng nói trực tiếp</p>
        </header>

        <div className="glass-effect rounded-[2.5rem] border border-white/5 p-8 mb-10 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-[10px] font-black text-white uppercase tracking-widest mb-3 ml-1">Nội dung văn bản (Tối đa 200 ký tự)</label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Nhập nội dung cần đọc..."
                className="w-full h-32 p-5 rounded-3xl border border-white/10 bg-black/40 text-gray-200 focus:border-indigo-500/50 outline-none transition-all resize-none text-lg shadow-inner"
                maxLength={200}
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <select
                  value={lang}
                  onChange={(e) => setLang(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 rounded-2xl border border-white/10 bg-black/40 text-gray-200 font-bold focus:border-indigo-500/50 outline-none appearance-none cursor-pointer shadow-inner"
                >
                  {LANGUAGES.map(l => (
                    <option key={l.code} value={l.code} className="bg-black text-white">{l.name}</option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                disabled={loading || !text.trim()}
                className="px-10 py-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-800 text-white font-black uppercase tracking-widest text-[11px] rounded-2xl transition-all shadow-xl shadow-indigo-500/10 flex items-center justify-center gap-3 active:scale-95"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                Tạo âm thanh
              </button>
            </div>
          </form>

          {error && (
            <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl flex items-center gap-3 text-xs font-bold animate-pulse">
              <AlertCircle className="w-5 h-5 shrink-0" />
              {error}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="flex items-center gap-3 text-white mb-6 ml-2">
            <History className="w-5 h-5 text-indigo-400" />
            <h2 className="font-black text-sm uppercase tracking-[0.2em]">Danh sách giọng đọc</h2>
          </div>

          {items.length === 0 ? (
            <div className="text-center py-20 glass-effect rounded-[2.5rem] border-2 border-dashed border-white/5 text-gray-600 font-black uppercase tracking-widest text-[10px]">
              Chưa có dữ liệu. Hãy tạo âm thanh đầu tiên của bạn!
            </div>
          ) : (
            items.map((item) => (
              <div key={item.id} className="glass-effect p-6 rounded-[2.5rem] border border-white/5 shadow-xl animate-in fade-in slide-in-from-bottom-4 hover:border-white/10 transition-all">
                <div className="flex justify-between items-start mb-5">
                  <div className="min-w-0 flex-1">
                    <p className="text-white font-bold text-xl truncate pr-4">{item.text}</p>
                    <div className="flex items-center gap-3 mt-2">
                        <span className="text-[9px] font-black bg-indigo-500/20 text-indigo-400 px-3 py-1 rounded-full uppercase tracking-widest border border-indigo-500/10">
                        {item.langCode}
                        </span>
                        <span className="text-[9px] text-gray-500 font-black uppercase tracking-widest">{item.timestamp}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteItem(item.id)}
                    className="p-3 text-gray-600 hover:text-red-500 transition-all active:scale-90"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>

                {/* Bộ điều khiển Speed */}
                <div className="mb-6 p-5 bg-black/40 rounded-3xl border border-white/5 shadow-inner">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center px-1">
                      <span className="text-[9px] font-black text-gray-500 flex items-center gap-2 uppercase tracking-widest">
                        <FastForward className="w-3.5 h-3.5" /> TỐC ĐỘ ĐỌC (SPEED)
                      </span>
                      <span className="text-[10px] font-black text-indigo-400 font-mono">{item.speed}x</span>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="2.0"
                      step="0.1"
                      value={item.speed}
                      onChange={(e) => updateItemParam(item.id, 'speed', e.target.value)}
                      className="w-full h-1.5 bg-white/5 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    />
                  </div>
                  <p className="text-[8px] text-gray-600 mt-3 italic font-medium">
                    * Lưu ý: Do chính sách bảo mật của Google (CORS), tính năng chỉnh Pitch yêu cầu API trả phí. Hiện tại hỗ trợ chỉnh Speed thông qua trình duyệt.
                  </p>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={() => playAudio(item)}
                    className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase tracking-widest text-[11px] rounded-2xl transition-all flex items-center justify-center gap-3 shadow-xl shadow-indigo-500/10 active:scale-95"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    Nghe thử
                  </button>
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-4 bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 rounded-2xl transition-all flex items-center justify-center active:scale-95"
                    title="Tải về file"
                  >
                    <Download className="w-5 h-5" />
                  </a>
                </div>
              </div>
            ))
          )}
        </div>
    </div>
  );
};

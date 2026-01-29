
export type TaskType = 'tts' | 'translate' | 'image_video';

class KeyManager {
    private STORAGE_KEY = 'puch_manual_api_keys';
    private badKeys: Set<string> = new Set();

    public saveKeys(keysString: string) {
        localStorage.setItem(this.STORAGE_KEY, keysString);
        this.badKeys.clear();
    }

    public getKeysRaw(): string {
        return localStorage.getItem(this.STORAGE_KEY) || '';
    }

    private getAllKeys(): string[] {
        return this.getKeysRaw()
            .split('\n')
            .map(k => k.trim())
            .filter(k => k.length > 0);
    }

    /**
     * Get API key based on task type.
     * Row 1: tts
     * Row 2: processing/translate/image/video
     */
    public getKey(task: TaskType): string {
        // Favor process.env.API_KEY for Gemini tasks (translate, image, video)
        if ((task === 'translate' || task === 'image_video') && process.env.API_KEY) {
            return process.env.API_KEY;
        }

        const keys = this.getAllKeys();
        let primaryKey = '';

        // Chọn key chính theo dòng
        if (task === 'tts') primaryKey = keys[0] || '';
        else if (task === 'translate' || task === 'image_video') primaryKey = keys[1] || '';

        // Nếu key chính hoạt động và chưa bị đánh dấu lỗi
        if (primaryKey && !this.badKeys.has(primaryKey)) {
            return primaryKey;
        }

        // Dự phòng
        const fallbackStartIndex = (task === 'translate' || task === 'image_video') ? 2 : 1;
        const fallbackPool = keys.slice(fallbackStartIndex);
        for (const fbKey of fallbackPool) {
            if (!this.badKeys.has(fbKey)) {
                return fbKey;
            }
        }

        return process.env.API_KEY || primaryKey || (keys[0] || '');
    }

    public markKeyAsBad(key: string) {
        if (key) {
            this.badKeys.add(key);
            console.warn(`API Key ${key.substring(0, 8)}... đã bị đánh dấu lỗi và sẽ bị bỏ qua.`);
        }
    }
}

export const keyManager = new KeyManager();

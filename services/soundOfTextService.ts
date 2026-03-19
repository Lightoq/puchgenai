
export interface SoundOfTextOptions {
  text: string;
  voice: string; // e.g., 'vi-VN', 'en-US'
}

const fetchWithTimeout = async (url: string, options: any = {}, timeout = 15000) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(id);
    return response;
  } catch (error: any) {
    clearTimeout(id);
    if (error.name === 'AbortError') {
      throw new Error('Yêu cầu đã hết thời gian chờ (timeout).');
    }
    throw error;
  }
};

export const synthesizeSoundOfText = async (options: SoundOfTextOptions): Promise<string> => {
  console.log(`[SoundOfText] Starting synthesis for: "${options.text.substring(0, 20)}..."`);
  try {
    // 1. Request sound creation
    const createResponse = await fetchWithTimeout('https://api.soundoftext.com/sounds', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        engine: 'google',
        data: {
          text: options.text,
          voice: options.voice,
        },
      }),
    });

    if (!createResponse.ok) {
      throw new Error(`SoundOfText API error: ${createResponse.statusText}`);
    }

    const createData = await createResponse.json();
    console.log("[SoundOfText] Created sound ID:", createData.id);
    if (!createData.success) {
      throw new Error('SoundOfText failed to create sound.');
    }

    const soundId = createData.id;

    // 2. Poll for status
    let status = 'pending';
    let location = '';
    let attempts = 0;
    const maxAttempts = 20; // 20 seconds max

    while (status !== 'done' && attempts < maxAttempts) {
      console.log(`[SoundOfText] Polling status... Attempt ${attempts + 1}/${maxAttempts}`);
      await new Promise(resolve => setTimeout(resolve, 1500)); // Wait 1.5s between polls
      
      const statusResponse = await fetchWithTimeout(`https://api.soundoftext.com/sounds/${soundId}`);
      if (!statusResponse.ok) {
        throw new Error(`SoundOfText status check failed: ${statusResponse.statusText}`);
      }
      const statusData = await statusResponse.json();
      status = statusData.status;
      if (status === 'done') {
        location = statusData.location;
      }
      attempts++;
    }

    if (status !== 'done') {
      throw new Error('SoundOfText synthesis timed out (Hết thời gian chờ xử lý).');
    }

    console.log("[SoundOfText] Synthesis done, fetching audio from:", location);

    // 3. Fetch the actual audio blob
    const audioResponse = await fetchWithTimeout(location);
    if (!audioResponse.ok) {
      throw new Error(`Failed to download audio from SoundOfText: ${audioResponse.statusText}`);
    }
    const audioBlob = await audioResponse.blob();
    return URL.createObjectURL(audioBlob);

  } catch (error) {
    console.error('SoundOfText error:', error);
    throw error;
  }
};

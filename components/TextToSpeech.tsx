
import React, { useState, useCallback, useRef, useEffect } from 'react';
import type { ChunkJob, ProcessingState } from '../types';
import { APP_KEY, SPEAKER_GROUPS } from '../constants';
import { TextProcessor } from '../services/textProcessor';
import { synthesizeChunk } from '../services/ttsService';
import { Configuration } from './Configuration';
import { ResultsPanel } from './ResultsPanel';
import { keyManager } from '../services/keyManager';
import { v4 as uuidv4 } from 'uuid';

export const TextToSpeech: React.FC = () => {
    const [chunks, setChunks] = useState<ChunkJob[]>([]);
    const [speaker, setSpeaker] = useState<string>(SPEAKER_GROUPS[0].speakers[0].id);
    const [selectedCountry, setSelectedCountry] = useState<string>(SPEAKER_GROUPS[0].country);
    const [processingState, setProcessingState] = useState<ProcessingState>('idle');
    const [maxChars, setMaxChars] = useState(1500);
    const [minCharsToMerge, setMinCharsToMerge] = useState(30);
    const [concurrentThreads, setConcurrentThreads] = useState(3);
    const [requestDelay, setRequestDelay] = useState(500);
    const [speed, setSpeed] = useState(1.0);
    const [mergedAudioUrl, setMergedAudioUrl] = useState<string | null>(null);
    const [shouldProcess, setShouldProcess] = useState(false);
    
    const abortControllerRef = useRef<AbortController | null>(null);

    const successfulChunksCount = chunks.filter(c => c.status === 'finished').length;
    const failedChunksCount = chunks.filter(c => c.status === 'error').length;
    const totalChunksCount = chunks.length;
    const remainingChunksCount = chunks.filter(c => c.status === 'pending' || c.status === 'processing').length;
    const pendingChunksCount = chunks.filter(c => c.status === 'pending').length;
    
    useEffect(() => {
        const mergeAudio = async () => {
            try {
                const finishedChunks = chunks.filter(c => c.status === 'finished' && c.audioUrl);
                if (finishedChunks.length === 0) return;

                const blobPromises = finishedChunks.map(chunk =>
                    fetch(chunk.audioUrl!).then(res => res.blob())
                );
                const blobs = await Promise.all(blobPromises);
                const mergedBlob = new Blob(blobs, { type: 'audio/mpeg' });
                
                if (mergedAudioUrl) {
                    URL.revokeObjectURL(mergedAudioUrl);
                }

                const url = URL.createObjectURL(mergedBlob);
                setMergedAudioUrl(url);
            } catch (error) {
                console.error("Gộp file âm thanh thất bại:", error);
            }
        };

        const areAllJobsDone = chunks.length > 0 && chunks.every(c => c.status === 'finished' || c.status === 'error');
        const hasFinishedChunks = chunks.some(c => c.status === 'finished');

        if (processingState === 'idle' && areAllJobsDone && hasFinishedChunks && failedChunksCount === 0) {
            mergeAudio();
        } else {
            if (mergedAudioUrl) {
                URL.revokeObjectURL(mergedAudioUrl);
                setMergedAudioUrl(null);
            }
        }
        
        return () => {
            if (mergedAudioUrl) {
                URL.revokeObjectURL(mergedAudioUrl);
            }
        };
    }, [chunks, processingState, failedChunksCount]);


    const addContent = (content: string | Array<{ text: string; timestamp: string }>) => {
        let newChunkJobs: ChunkJob[];

        if (typeof content === 'string') {
            const textProcessor = new TextProcessor(maxChars, minCharsToMerge);
            const textChunks = textProcessor.process(content);
            newChunkJobs = textChunks.map(text => ({
                id: uuidv4(),
                text,
                status: 'pending',
            }));
        } else {
            newChunkJobs = content.map(chunk => ({
                id: uuidv4(),
                text: chunk.text,
                timestamp: chunk.timestamp,
                status: 'pending',
            }));
        }
        
        setChunks(prevChunks => [...prevChunks, ...newChunkJobs]);
    };

    const removeChunk = (chunkId: string) => {
        setChunks(prevChunks => prevChunks.filter(chunk => chunk.id !== chunkId));
    };

    const clearQueue = () => {
        setChunks([]);
    };

    const updateChunk = (chunkId: string, updates: Partial<ChunkJob>) => {
        setChunks(prevChunks => 
            prevChunks.map(chunk => 
                chunk.id === chunkId ? { ...chunk, ...updates } : chunk
            )
        );
    };
    
    const retryChunk = (chunkId: string) => {
        setChunks(prev => 
            prev.map(c => c.id === chunkId ? { ...c, status: 'pending', error: null } : c)
        );
        setShouldProcess(true);
    };

    const retryAllFailed = () => {
        setChunks(prev => 
            prev.map(c => c.status === 'error' ? { ...c, status: 'pending', error: null } : c)
        );
        setShouldProcess(true);
    };

    const processQueue = useCallback(async () => {
        const token = keyManager.getKey('tts');
        
        if (!token) {
            alert("Vui lòng nhập API Key trong phần Cài đặt (Dòng 1) trước khi bắt đầu.");
            return;
        }

        setProcessingState('processing');
        abortControllerRef.current = new AbortController();
        const signal = abortControllerRef.current.signal;
        
        const chunksToProcess = chunks.filter(c => c.status === 'pending');
        if (chunksToProcess.length === 0) {
            setProcessingState('idle');
            return;
        }

        const processSingleChunk = async (chunk: ChunkJob) => {
            if (signal.aborted) return;
            
            updateChunk(chunk.id, { status: 'processing', error: null });
            
            try {
                const audioUrl = await synthesizeChunk({
                    text: chunk.text,
                    speaker,
                    token,
                    appkey: APP_KEY,
                    speed,
                });
                if (!signal.aborted) {
                    updateChunk(chunk.id, { status: 'finished', audioUrl });
                }
            } catch (err: any) {
                if (err.message?.includes('token') || err.message?.includes('401') || err.message?.includes('429')) {
                    keyManager.markKeyAsBad(token);
                }

                 if (!signal.aborted) {
                    updateChunk(chunk.id, { status: 'error', error: (err as Error).message });
                }
            }
        };
        
        const queue = [...chunksToProcess];
        
        const workerPromises = Array(concurrentThreads).fill(null).map(async () => {
            while (queue.length > 0) {
                if (signal.aborted) break;
                const chunk = queue.shift();
                if (chunk) {
                    await processSingleChunk(chunk);
                    if (requestDelay > 0 && !signal.aborted) {
                        await new Promise(resolve => setTimeout(resolve, requestDelay));
                    }
                }
            }
        });

        await Promise.all(workerPromises);
        
        if (!signal.aborted) {
            setProcessingState('idle');
        }

    }, [chunks, speaker, concurrentThreads, requestDelay, speed]);

    useEffect(() => {
        if (shouldProcess) {
            const timer = setTimeout(() => {
                processQueue();
                setShouldProcess(false);
            }, 50);
            return () => clearTimeout(timer);
        }
    }, [shouldProcess, processQueue]);


    const handleCancel = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            setChunks(prev => prev.map(c => c.status === 'processing' ? { ...c, status: 'pending' } : c));
            setProcessingState('idle');
        }
    };

    const handleDownloadAll = () => {
        if (!mergedAudioUrl) return;
        const a = document.createElement('a');
        a.href = mergedAudioUrl;
        a.download = 'audio_merged.mp3';
        document.body.appendChild(a);
        a.click();
        a.remove();
    };

    const handleDownloadSrt = () => {
        const srtContent = TextProcessor.generateSrt(chunks, speed);
        const blob = new Blob([srtContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'subtitle.srt';
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    };
    
    const handleCountryChange = (newCountry: string) => {
        setSelectedCountry(newCountry);
        const newSpeakerGroup = SPEAKER_GROUPS.find(g => g.country === newCountry);
        if (newSpeakerGroup && newSpeakerGroup.speakers.length > 0) {
            setSpeaker(newSpeakerGroup.speakers[0].id);
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            <Configuration
                speaker={speaker}
                setSpeaker={setSpeaker}
                selectedCountry={selectedCountry}
                onCountryChange={handleCountryChange}
                speakerGroups={SPEAKER_GROUPS}
                isProcessing={processingState === 'processing'}
                onProcessQueue={processQueue}
                onAddContent={addContent}
                pendingChunksCount={pendingChunksCount}
                maxChars={maxChars}
                setMaxChars={setMaxChars}
                minCharsToMerge={minCharsToMerge}
                setMinCharsToMerge={setMinCharsToMerge}
                concurrentThreads={concurrentThreads}
                setConcurrentThreads={setConcurrentThreads}
                requestDelay={requestDelay}
                setRequestDelay={setRequestDelay}
                speed={speed}
                setSpeed={setSpeed}
            />
            <ResultsPanel
                chunks={chunks}
                processingState={processingState}
                mergedAudioUrl={mergedAudioUrl}
                onCancel={handleCancel}
                removeChunk={removeChunk}
                onClearQueue={clearQueue}
                onDownloadAll={handleDownloadAll}
                onDownloadSrt={handleDownloadSrt}
                onRetryChunk={retryChunk}
                onRetryAllFailed={retryAllFailed}
                successfulChunksCount={successfulChunksCount}
                failedChunksCount={failedChunksCount}
                remainingChunksCount={remainingChunksCount}
                totalChunksCount={totalChunksCount}
            />
        </div>
    );
};

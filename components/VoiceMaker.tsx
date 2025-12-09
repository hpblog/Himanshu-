import React, { useState, useRef, useEffect } from 'react';
import { SpeakerIcon, DownloadIcon, SparklesIcon, SettingsIcon } from './icons';
import { generateElevenLabsSpeech } from '../services/elevenLabsService';
import { LoadingSpinner } from './LoadingSpinner';

const VOICES = [
    { name: 'Rachel', id: '21m00Tcm4TlvDq8ikWAM', gender: 'Female', desc: 'American, calm' },
    { name: 'Adam', id: 'pNInz6obpgDQGcFmaJgB', gender: 'Male', desc: 'American, deep' },
    { name: 'Antoni', id: 'ErXwobaYiN019PkySvjV', gender: 'Male', desc: 'American, well-rounded' },
    { name: 'Elli', id: 'MF3mGyEYCl7XYWlgWWvy', gender: 'Female', desc: 'American, clear' },
    { name: 'Josh', id: 'TxGEqnHWrfWFTfGW9XjX', gender: 'Male', desc: 'American, storytelling' },
];

interface VoiceMakerProps {
    initialText?: string;
}

export const VoiceMaker: React.FC<VoiceMakerProps> = ({ initialText = '' }) => {
    const [text, setText] = useState(initialText);
    const [apiKey, setApiKey] = useState('');
    const [selectedVoiceId, setSelectedVoiceId] = useState(VOICES[0].id);
    const [speed, setSpeed] = useState(1.0); // Speed State
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showKeyInput, setShowKeyInput] = useState(false);
    
    // Update text if initialText changes
    useEffect(() => {
        if (initialText) {
            setText(initialText);
        }
    }, [initialText]);

    // Check for cached key
    useEffect(() => {
        try {
            const cachedKey = localStorage.getItem('ELEVEN_LABS_KEY');
            if (cachedKey) {
                setApiKey(cachedKey);
            } else {
                setShowKeyInput(true);
            }
        } catch (e) {
            console.warn("LocalStorage access failed", e);
        }
    }, []);
    
    const audioRef = useRef<HTMLAudioElement>(null);

    // Update playback rate dynamically when speed changes
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.playbackRate = speed;
        }
    }, [speed]);

    const handleGenerate = async () => {
        if (!text.trim()) return;
        
        const cleanKey = apiKey.trim();
        if (!cleanKey) {
            setError("Please enter your ElevenLabs API Key.");
            setShowKeyInput(true);
            return;
        }
        
        try {
            localStorage.setItem('ELEVEN_LABS_KEY', cleanKey);
        } catch (e) {
            // Ignore storage errors
        }

        setIsLoading(true);
        setError(null);
        setAudioUrl(null);

        try {
            const url = await generateElevenLabsSpeech(text, selectedVoiceId, cleanKey);
            setAudioUrl(url);
        } catch (err: any) {
            console.error(err);
            const msg = err.message || "Failed to generate speech.";
            setError(msg);
            
            if (msg.toLowerCase().includes('key') || msg.toLowerCase().includes('unauthorized')) {
                setShowKeyInput(true);
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="animate-fade-in max-w-4xl mx-auto space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Input Section */}
                <div className="space-y-6">
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-lg border border-gray-100 dark:border-slate-700">
                        
                        {/* API Key Toggle/Input */}
                        <div className="mb-6">
                            <div className="flex justify-between items-center mb-2">
                                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Settings
                                </label>
                                <button 
                                    onClick={() => setShowKeyInput(!showKeyInput)}
                                    className="text-primary-600 dark:text-primary-400 text-xs font-medium hover:underline flex items-center gap-1"
                                >
                                    <SettingsIcon className="w-3 h-3" />
                                    {showKeyInput ? 'Hide Key' : 'Configure Key'}
                                </button>
                            </div>
                            
                            {showKeyInput && (
                                <div className="animate-fade-in bg-gray-50 dark:bg-slate-900/50 p-3 rounded-xl border border-gray-200 dark:border-slate-700">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        ElevenLabs API Key
                                    </label>
                                    <input
                                        type="password"
                                        value={apiKey}
                                        onChange={(e) => setApiKey(e.target.value)}
                                        placeholder="sk_..."
                                        className={`w-full bg-white dark:bg-slate-900 border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none dark:text-white ${error && (error.toLowerCase().includes('key') || error.toLowerCase().includes('unauthorized')) ? 'border-red-500' : 'border-gray-200 dark:border-slate-700'}`}
                                    />
                                    <p className="text-xs text-gray-500 mt-2">
                                        Required. Get it from <a href="https://elevenlabs.io" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">elevenlabs.io</a>
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Script Input */}
                        <label className="block text-sm font-bold text-gray-800 dark:text-white mb-2">
                            Script
                        </label>
                        <textarea
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            placeholder="Enter the text you want to convert to speech..."
                            className="w-full h-40 bg-gray-50 dark:bg-slate-900 text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 rounded-xl p-4 border border-gray-200 dark:border-slate-700 focus:ring-2 focus:ring-primary-500 focus:outline-none transition-all resize-none mb-4"
                        />
                        
                        {/* Voice Selection */}
                        <div className="mb-6">
                            <label className="block text-sm font-bold text-gray-800 dark:text-white mb-2">
                                Voice
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                {VOICES.map((v) => (
                                    <button
                                        key={v.id}
                                        onClick={() => setSelectedVoiceId(v.id)}
                                        className={`p-3 rounded-xl border text-left transition-all relative overflow-hidden ${
                                            selectedVoiceId === v.id
                                            ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-500'
                                            : 'bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700 hover:border-primary-300'
                                        }`}
                                    >
                                        <div className={`font-bold text-sm ${selectedVoiceId === v.id ? 'text-primary-700 dark:text-primary-300' : 'text-gray-700 dark:text-gray-200'}`}>
                                            {v.name}
                                        </div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                            {v.desc}
                                        </div>
                                        {selectedVoiceId === v.id && (
                                            <div className="absolute top-0 right-0 w-3 h-3 bg-primary-500 rounded-bl-lg"></div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Speed Control */}
                        <div className="mb-6 bg-gray-50 dark:bg-slate-900/50 p-4 rounded-xl border border-gray-100 dark:border-slate-700">
                             <div className="flex justify-between items-center mb-2">
                                <label className="text-sm font-bold text-gray-800 dark:text-white">
                                    Speech Speed
                                </label>
                                <span className="text-sm font-mono text-primary-600 dark:text-primary-400 bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-gray-200 dark:border-slate-600">
                                    {speed}x
                                </span>
                            </div>
                            <input
                                type="range"
                                min="0.5"
                                max="2.0"
                                step="0.1"
                                value={speed}
                                onChange={(e) => setSpeed(parseFloat(e.target.value))}
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-slate-700 accent-primary-500"
                            />
                            <div className="flex justify-between text-xs text-gray-400 mt-1 font-medium">
                                <span>Slow (0.5x)</span>
                                <span>Normal (1.0x)</span>
                                <span>Fast (2.0x)</span>
                            </div>
                        </div>

                        <button
                            onClick={handleGenerate}
                            disabled={isLoading || !text.trim()}
                            className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-primary-600 to-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-primary-500/30 hover:shadow-primary-500/50 hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                        >
                            {isLoading ? <LoadingSpinner /> : <SpeakerIcon className="w-5 h-5" />}
                            {isLoading ? 'Generating Audio...' : 'Generate Speech'}
                        </button>
                    </div>
                </div>

                {/* Output Section */}
                <div className="space-y-6">
                    <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-lg border border-gray-100 dark:border-slate-700 overflow-hidden flex flex-col h-full min-h-[400px]">
                        <div className="p-4 border-b border-gray-100 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-900/50">
                            <span className="font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2">
                                <SpeakerIcon className="w-4 h-4" /> Result
                            </span>
                        </div>
                        
                        <div className="flex-grow flex flex-col items-center justify-center p-8 bg-slate-50 dark:bg-slate-900/30">
                            {isLoading ? (
                                <div className="text-center">
                                    <div className="flex justify-center mb-6">
                                        <div className="flex items-end gap-1.5 h-12">
                                            {[...Array(5)].map((_, i) => (
                                                <div 
                                                    key={i} 
                                                    className="w-2 bg-gradient-to-t from-primary-500 to-indigo-500 rounded-full animate-pulse" 
                                                    style={{
                                                        height: `${Math.max(30, Math.random() * 100)}%`, 
                                                        animationDelay: `${i * 0.1}s`,
                                                        animationDuration: '0.8s'
                                                    }}
                                                ></div>
                                            ))}
                                        </div>
                                    </div>
                                    <p className="text-gray-800 dark:text-white font-medium text-lg">Synthesizing Speech...</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Using ElevenLabs AI</p>
                                </div>
                            ) : audioUrl ? (
                                <div className="w-full max-w-sm space-y-8 text-center animate-fade-in-up">
                                    <div className="relative mx-auto w-32 h-32">
                                        <div className="absolute inset-0 bg-primary-500 rounded-full opacity-20 animate-ping"></div>
                                        <div className="relative w-full h-full bg-gradient-to-tr from-primary-500 to-indigo-600 rounded-full flex items-center justify-center shadow-xl">
                                            <SpeakerIcon className="w-12 h-12 text-white" />
                                        </div>
                                    </div>
                                    
                                    <audio 
                                        ref={audioRef}
                                        controls 
                                        src={audioUrl} 
                                        className="w-full shadow-sm rounded-full"
                                        onLoadedMetadata={(e) => {
                                            e.currentTarget.playbackRate = speed;
                                            e.currentTarget.play().catch(err => console.warn("Autoplay prevented", err));
                                        }}
                                    />
                                    
                                    <a 
                                        href={audioUrl}
                                        download={`vidscribe-audio-${Date.now()}.mp3`}
                                        className="inline-flex items-center gap-2 px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl transition-colors font-bold shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                                    >
                                        <DownloadIcon className="w-5 h-5" />
                                        Download Audio
                                    </a>
                                </div>
                            ) : error ? (
                                <div className="text-center p-6 bg-red-50 dark:bg-red-900/10 rounded-2xl border border-red-100 dark:border-red-900/30 max-w-sm">
                                    <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                                        <span className="text-2xl">⚠️</span>
                                    </div>
                                    <p className="text-red-600 dark:text-red-400 font-bold mb-1">Generation Failed</p>
                                    <p className="text-sm text-red-500 dark:text-red-300 leading-relaxed">{error}</p>
                                </div>
                            ) : (
                                <div className="text-center text-gray-400 dark:text-gray-600 max-w-xs">
                                    <div className="w-20 h-20 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-gray-100 dark:border-slate-700">
                                        <SpeakerIcon className="w-8 h-8 opacity-20" />
                                    </div>
                                    <p className="text-lg font-medium text-gray-500 dark:text-gray-400">Ready to speak</p>
                                    <p className="text-sm mt-1 opacity-70">Enter text and API Key to start.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
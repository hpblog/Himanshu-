import React, { useState } from 'react';
import { PenIcon, SparklesIcon, CopyIcon, SaveIcon, CheckIcon, SpeakerIcon } from './icons';
import { generateDetailedScript } from '../services/geminiService';
import { saveItem } from '../services/storageService';
import { LoadingSpinner } from './LoadingSpinner';

interface ScriptMakerProps {
    onTransferToVoice: (script: string) => void;
}

export const ScriptMaker: React.FC<ScriptMakerProps> = ({ onTransferToVoice }) => {
    const [topic, setTopic] = useState('');
    const [videoType, setVideoType] = useState('YouTube Video');
    const [tone, setTone] = useState('Motivational');
    const [audience, setAudience] = useState('');
    const [generatedScript, setGeneratedScript] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSaved, setIsSaved] = useState(false);
    const [isCopied, setIsCopied] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGenerate = async () => {
        if (!topic.trim()) return;
        
        setIsLoading(true);
        setError(null);
        setGeneratedScript('');
        setIsSaved(false);

        try {
            const script = await generateDetailedScript(topic, videoType, tone, audience || 'General Audience');
            setGeneratedScript(script);
        } catch (err: any) {
            console.error(err);
            setError(err.message || "Failed to generate script.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(generatedScript);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    const handleSave = () => {
        saveItem({
            type: 'video_script',
            content: generatedScript,
            meta: {
                title: topic,
                prompt: `${videoType} - ${tone}`,
                date: new Date().toISOString()
            }
        });
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 2000);
    };

    return (
        <div className="animate-fade-in max-w-6xl mx-auto space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <PenIcon className="w-6 h-6 text-primary-500" />
                        AI Script Creator
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        Generate comprehensive, human-friendly scripts for your content.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Inputs */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-slate-700">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Topic / Title
                                </label>
                                <input
                                    type="text"
                                    value={topic}
                                    onChange={(e) => setTopic(e.target.value)}
                                    placeholder="e.g. Overcoming Procrastination"
                                    className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary-500 outline-none dark:text-white"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Format
                                </label>
                                <select 
                                    value={videoType}
                                    onChange={(e) => setVideoType(e.target.value)}
                                    className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary-500 outline-none dark:text-white"
                                >
                                    <option>YouTube Video</option>
                                    <option>YouTube Short</option>
                                    <option>Instagram Reel</option>
                                    <option>TikTok</option>
                                    <option>LinkedIn Video</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Tone
                                </label>
                                <select 
                                    value={tone}
                                    onChange={(e) => setTone(e.target.value)}
                                    className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary-500 outline-none dark:text-white"
                                >
                                    <option>Motivational</option>
                                    <option>Educational</option>
                                    <option>Storytelling</option>
                                    <option>Funny / Entertaining</option>
                                    <option>Professional</option>
                                    <option>Dramatic</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Target Audience (Optional)
                                </label>
                                <input
                                    type="text"
                                    value={audience}
                                    onChange={(e) => setAudience(e.target.value)}
                                    placeholder="e.g. Students, Entrepreneurs"
                                    className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary-500 outline-none dark:text-white"
                                />
                            </div>

                            <button
                                onClick={handleGenerate}
                                disabled={isLoading || !topic.trim()}
                                className="w-full py-3 bg-gradient-to-r from-primary-600 to-indigo-600 text-white font-bold rounded-xl shadow-md hover:from-primary-700 hover:to-indigo-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                            >
                                {isLoading ? <LoadingSpinner /> : <SparklesIcon className="w-5 h-5" />}
                                {isLoading ? 'Writing Script...' : 'Generate Script'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Output */}
                <div className="lg:col-span-2">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-gray-200 dark:border-slate-700 overflow-hidden flex flex-col h-full min-h-[600px]">
                        <div className="p-4 border-b border-gray-200 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-900/50 flex justify-between items-center">
                            <span className="font-semibold text-gray-700 dark:text-gray-200">Generated Script</span>
                            {generatedScript && (
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleCopy}
                                        className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                    >
                                        {isCopied ? <CheckIcon className="w-4 h-4 text-green-500" /> : <CopyIcon className="w-4 h-4" />}
                                        {isCopied ? 'Copied' : 'Copy'}
                                    </button>
                                    <button
                                        onClick={handleSave}
                                        className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                                            isSaved ? 'text-green-600 bg-green-50 dark:bg-green-900/20' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700'
                                        }`}
                                    >
                                        {isSaved ? <CheckIcon className="w-4 h-4" /> : <SaveIcon className="w-4 h-4" />}
                                        {isSaved ? 'Saved' : 'Save'}
                                    </button>
                                     <button
                                        onClick={() => onTransferToVoice(generatedScript)}
                                        className="flex items-center gap-2 px-3 py-1.5 bg-secondary-600 hover:bg-secondary-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
                                    >
                                        <SpeakerIcon className="w-4 h-4" />
                                        Send to Voice Maker
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="flex-grow p-6 overflow-y-auto bg-slate-50 dark:bg-slate-900/30">
                            {isLoading ? (
                                <div className="h-full flex flex-col items-center justify-center">
                                    <LoadingSpinner />
                                    <p className="mt-4 text-gray-600 dark:text-gray-400 animate-pulse font-medium">
                                        Crafting a compelling narrative...
                                    </p>
                                </div>
                            ) : generatedScript ? (
                                <div className="prose dark:prose-invert max-w-none whitespace-pre-wrap font-medium text-gray-700 dark:text-gray-300 leading-relaxed">
                                    {generatedScript}
                                </div>
                            ) : error ? (
                                <div className="h-full flex flex-col items-center justify-center text-center p-6">
                                    <p className="text-red-500 font-bold mb-2">Generation Failed</p>
                                    <p className="text-gray-500">{error}</p>
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 dark:text-gray-600 opacity-50">
                                    <PenIcon className="w-20 h-20 mb-4" />
                                    <p className="text-lg">Enter your topic to generate a script.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
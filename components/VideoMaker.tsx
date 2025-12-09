import React, { useState } from 'react';
import { MovieIcon, DownloadIcon, SparklesIcon, SaveIcon, CheckIcon, ImageIcon } from './icons';
import { generateVideo, generateImage } from '../services/geminiService';
import { saveItem } from '../services/storageService';
import { LoadingSpinner } from './LoadingSpinner';

export const VideoMaker: React.FC = () => {
  // Core State
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  
  // Media State
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [generatedVideo, setGeneratedVideo] = useState<string | null>(null);
  
  // Loading States
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  
  const [error, setError] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  const handleSelectKey = async () => {
      if ((window as any).aistudio) {
          try {
              await (window as any).aistudio.openSelectKey();
          } catch (e) {
              console.error("Key selection failed", e);
          }
      }
  };

  const handleGenerateImage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    if (!process.env.API_KEY) {
        setError("API Key not found.");
        return;
    }

    setIsGeneratingImage(true);
    setGeneratedImage(null);
    setGeneratedVideo(null); // Reset video if new image is generated
    setError(null);
    setIsSaved(false);

    try {
        // Use Gemini Image model
        const imgUrl = await generateImage(prompt, aspectRatio);
        setGeneratedImage(imgUrl);
    } catch (err: any) {
        console.error(err);
        setError("Failed to generate image. Please try again.");
    } finally {
        setIsGeneratingImage(false);
    }
  };

  const handleGenerateVideo = async () => {
    if (!generatedImage) return;
    
    if (!process.env.API_KEY) {
        setError("API Key not found.");
        return;
    }

    setIsGeneratingVideo(true);
    setError(null);

    try {
        // Pass the generated image as input for the video
        const videoUrl = await generateVideo(prompt, aspectRatio, generatedImage);
        setGeneratedVideo(videoUrl);
    } catch (err: any) {
        console.error(err);
        const errorMessage = err?.message || String(err);
        if (errorMessage.includes("Requested entity was not found")) {
            setError("API Key issue. Please click 'Update Key' to select a valid project.");
        } else {
            setError("Failed to generate video from image.");
        }
    } finally {
        setIsGeneratingVideo(false);
    }
  };

  const handleSave = () => {
      if (generatedVideo) {
          saveItem({
              type: 'video_script', // Reusing type for storage simplicity
              content: `Visual: ${prompt}`,
              meta: {
                  title: 'AI Generated Video',
                  prompt: prompt,
                  date: new Date().toISOString()
              }
          });
          setIsSaved(true);
      }
  };

  return (
    <div className="animate-fade-in max-w-5xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex items-center justify-between">
            <div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                    <SparklesIcon className="w-6 h-6 text-primary-500" />
                    Gemini Image-to-Video Studio
                </h2>
                <p className="text-gray-500 dark:text-gray-400 mt-1">
                    Create a source image with Gemini, then animate it into a video.
                </p>
            </div>
            {(window as any).aistudio && (
                <button 
                    onClick={handleSelectKey}
                    className="text-xs bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 px-3 py-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors border border-gray-200 dark:border-slate-600"
                >
                    Update Key
                </button>
            )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Left Column: Input & Image Generation */}
            <div className="space-y-6">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-slate-700">
                    <h3 className="font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                        <span className="bg-primary-100 dark:bg-primary-900/50 text-primary-600 dark:text-primary-400 w-6 h-6 rounded-full flex items-center justify-center text-xs">1</span>
                        Generate Source Image
                    </h3>
                    
                    <form onSubmit={handleGenerateImage} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Describe your scene
                            </label>
                            <textarea
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="A futuristic city with flying cars in a cyberpunk style..."
                                className="w-full bg-gray-50 dark:bg-slate-900 text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 rounded-xl p-3 border border-gray-200 dark:border-slate-700 focus:ring-2 focus:ring-primary-500 focus:outline-none transition-all resize-none h-32 text-sm"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Aspect Ratio
                            </label>
                            <div className="flex gap-4">
                                <label className={`flex-1 cursor-pointer border rounded-lg p-3 flex items-center justify-center gap-2 transition-all ${aspectRatio === '16:9' ? 'bg-primary-50 border-primary-500 text-primary-700 dark:bg-primary-900/20 dark:text-primary-300' : 'border-gray-200 dark:border-slate-700'}`}>
                                    <input type="radio" name="ratio" value="16:9" checked={aspectRatio === '16:9'} onChange={() => setAspectRatio('16:9')} className="hidden" />
                                    <span className="font-medium">Landscape (16:9)</span>
                                </label>
                                <label className={`flex-1 cursor-pointer border rounded-lg p-3 flex items-center justify-center gap-2 transition-all ${aspectRatio === '9:16' ? 'bg-primary-50 border-primary-500 text-primary-700 dark:bg-primary-900/20 dark:text-primary-300' : 'border-gray-200 dark:border-slate-700'}`}>
                                    <input type="radio" name="ratio" value="9:16" checked={aspectRatio === '9:16'} onChange={() => setAspectRatio('9:16')} className="hidden" />
                                    <span className="font-medium">Portrait (9:16)</span>
                                </label>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isGeneratingImage || !prompt.trim()}
                            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-primary-500 text-white font-bold rounded-xl shadow-md hover:bg-primary-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isGeneratingImage ? <LoadingSpinner /> : <ImageIcon className="w-5 h-5" />}
                            {isGeneratingImage ? 'Creating Image...' : 'Generate Image (Gemini)'}
                        </button>
                    </form>
                </div>

                {/* Display Generated Image */}
                {generatedImage && (
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-slate-700 animate-fade-in-up">
                        <div className="flex justify-between items-center mb-4">
                             <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
                                <span className="bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400 w-6 h-6 rounded-full flex items-center justify-center text-xs">2</span>
                                Source Image Ready
                            </h3>
                        </div>
                        
                        <div className="relative rounded-lg overflow-hidden border border-gray-200 dark:border-slate-700 shadow-inner bg-black aspect-video mb-6">
                            <img src={generatedImage} alt="Source" className="w-full h-full object-contain" />
                        </div>

                        <button
                            onClick={handleGenerateVideo}
                            disabled={isGeneratingVideo}
                            className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-lg rounded-xl shadow-lg hover:from-purple-700 hover:to-indigo-700 transition-all transform hover:scale-[1.01] disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isGeneratingVideo ? (
                                <>
                                    <LoadingSpinner />
                                    Animating Scene...
                                </>
                            ) : (
                                <>
                                    <MovieIcon className="w-6 h-6" />
                                    Animate this Image (Generate Video)
                                </>
                            )}
                        </button>
                        <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-2">
                            This will use the image above as the starting frame.
                        </p>
                    </div>
                )}
            </div>

            {/* Right Column: Video Result */}
            <div className="space-y-6">
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-gray-200 dark:border-slate-700 overflow-hidden flex flex-col h-full min-h-[500px]">
                    <div className="p-4 border-b border-gray-200 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-900/50 flex justify-between items-center">
                        <span className="font-semibold text-gray-700 dark:text-gray-200">Video Result</span>
                        {generatedVideo && (
                            <div className="flex gap-2">
                                <button
                                    onClick={handleSave}
                                    disabled={isSaved}
                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors text-sm font-medium ${
                                        isSaved ? 'bg-gray-100 text-gray-500' : 'bg-primary-600 text-white'
                                    }`}
                                >
                                    {isSaved ? <CheckIcon className="w-4 h-4" /> : <SaveIcon className="w-4 h-4" />}
                                    {isSaved ? 'Saved' : 'Save'}
                                </button>
                                <a
                                    href={generatedVideo}
                                    download={`gemini-video-${Date.now()}.mp4`}
                                    className="flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                                >
                                    <DownloadIcon className="w-4 h-4" />
                                    Download
                                </a>
                            </div>
                        )}
                    </div>

                    <div className="flex-grow flex flex-col items-center justify-center p-6 bg-slate-900 gap-4">
                        {isGeneratingVideo ? (
                            <div className="text-center p-8 animate-pulse">
                                <LoadingSpinner />
                                <p className="mt-4 text-white font-medium text-lg">
                                    Generating Video...
                                </p>
                                <p className="text-gray-400 text-sm mt-2">
                                    Bringing your image to life. This may take a moment.
                                </p>
                            </div>
                        ) : generatedVideo ? (
                            <div className="w-full h-full flex items-center justify-center">
                                <video 
                                    controls 
                                    className="w-full max-h-[600px] rounded-lg shadow-2xl"
                                    src={generatedVideo}
                                    playsInline
                                    autoPlay
                                    loop
                                />
                            </div>
                        ) : error ? (
                             <div className="text-center max-w-md p-6 bg-red-500/10 rounded-xl border border-red-500/50">
                                <p className="text-red-500 dark:text-red-400 font-bold mb-2">Generation Failed</p>
                                <p className="text-gray-300">{error}</p>
                            </div>
                        ) : (
                            <div className="text-center text-gray-500 dark:text-gray-600">
                                <MovieIcon className="w-20 h-20 mx-auto mb-4 opacity-20" />
                                <p className="text-lg">Generate an image first to see the video result here.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};
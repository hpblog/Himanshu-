
import React, { useState } from 'react';
import { SparklesIcon, DownloadIcon, ImageIcon, SaveIcon, CheckIcon } from './icons';
import { generateImage } from '../services/geminiService';
import { saveItem } from '../services/storageService';
import { LoadingSpinner } from './LoadingSpinner';

type AspectRatio = '16:9' | '1:1' | '9:16';
type ImageFormat = 'png' | 'jpeg' | 'webp';

export const ImageMaker: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
  const [format, setFormat] = useState<ImageFormat>('png');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    if (!process.env.API_KEY) {
        setError("API key is not configured.");
        return;
    }

    setIsLoading(true);
    setError(null);
    setGeneratedImage(null);
    setIsSaved(false);

    try {
        const imageUrl = await generateImage(prompt, aspectRatio);
        setGeneratedImage(imageUrl);
    } catch (err) {
        console.error(err);
        setError("Failed to generate image. Please try again.");
    } finally {
        setIsLoading(false);
    }
  };

  const handleSave = () => {
    if (!generatedImage) return;
    saveItem({
      type: 'image',
      content: generatedImage,
      meta: {
        title: 'Generated Image',
        prompt: prompt,
        date: new Date().toISOString()
      }
    });
    setIsSaved(true);
  };

  const handleDownload = () => {
    if (!generatedImage) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = generatedImage;
    
    img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Fill white background for JPEGs (transparency turns black otherwise)
        if (format === 'jpeg') {
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        ctx.drawImage(img, 0, 0);

        const mimeType = `image/${format}`;
        // Use 0.9 quality for lossy formats
        const dataUrl = canvas.toDataURL(mimeType, 0.9);

        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = `vidscribe-image-${Date.now()}.${format}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
  };

  return (
    <div className="animate-fade-in space-y-8">
        <form onSubmit={handleGenerate} className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-2xl shadow-lg border border-gray-200 dark:border-slate-700">
            <div className="space-y-6">
                <div>
                    <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Image Description
                    </label>
                    <textarea
                        id="prompt"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="Describe the image you want to create... (e.g., 'A cyberpunk street scene with neon lights and rain')"
                        className="w-full bg-gray-50 dark:bg-slate-900 text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 rounded-xl p-4 border border-gray-200 dark:border-slate-700 focus:ring-2 focus:ring-primary-500 focus:outline-none transition-all resize-none h-32"
                        disabled={isLoading}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                            Aspect Ratio
                        </label>
                        <div className="flex flex-wrap gap-3">
                            {[
                                { value: '16:9', label: 'Landscape', desc: '16:9' },
                                { value: '1:1', label: 'Square', desc: '1:1' },
                                { value: '9:16', label: 'Portrait', desc: '9:16' }
                            ].map((option) => (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => setAspectRatio(option.value as AspectRatio)}
                                    className={`flex-1 min-w-[100px] p-3 rounded-xl border-2 transition-all text-left ${
                                        aspectRatio === option.value
                                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                                            : 'border-gray-200 dark:border-slate-700 hover:border-primary-300 dark:hover:border-slate-600'
                                    }`}
                                >
                                    <div className={`font-semibold text-sm ${aspectRatio === option.value ? 'text-primary-700 dark:text-primary-300' : 'text-gray-700 dark:text-gray-200'}`}>
                                        {option.label}
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        {option.desc}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                            Download Format
                        </label>
                        <div className="flex flex-wrap gap-3">
                            {[
                                { value: 'png', label: 'PNG', desc: 'High Quality' },
                                { value: 'jpeg', label: 'JPEG', desc: 'Small File' },
                                { value: 'webp', label: 'WebP', desc: 'Web Ready' }
                            ].map((option) => (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => setFormat(option.value as ImageFormat)}
                                    className={`flex-1 min-w-[100px] p-3 rounded-xl border-2 transition-all text-left ${
                                        format === option.value
                                            ? 'border-secondary-500 bg-secondary-50 dark:bg-secondary-900/20'
                                            : 'border-gray-200 dark:border-slate-700 hover:border-secondary-300 dark:hover:border-slate-600'
                                    }`}
                                >
                                    <div className={`font-semibold text-sm ${format === option.value ? 'text-secondary-700 dark:text-secondary-300' : 'text-gray-700 dark:text-gray-200'}`}>
                                        {option.label}
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        {option.desc}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="pt-2">
                    <button
                        type="submit"
                        disabled={isLoading || !prompt.trim()}
                        className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-primary-500 text-white font-bold text-lg rounded-xl shadow-md hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 focus:ring-offset-gray-100 dark:focus:ring-offset-slate-900 transition-all duration-300 disabled:bg-primary-300 disabled:cursor-not-allowed transform hover:scale-[1.01]"
                    >
                        {isLoading ? (
                        'Creating Masterpiece...'
                        ) : (
                        <>
                            <SparklesIcon className="w-5 h-5" />
                            Generate Image
                        </>
                        )}
                    </button>
                </div>
            </div>
        </form>

        {/* Display Area */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-gray-200 dark:border-slate-700 overflow-hidden min-h-[300px] flex flex-col">
            <div className="p-4 border-b border-gray-200 dark:border-slate-700 flex justify-between items-center bg-gray-50/50 dark:bg-slate-900/50">
                 <div className="flex items-center gap-2">
                    <ImageIcon className="w-5 h-5 text-gray-500" />
                    <span className="font-semibold text-gray-700 dark:text-gray-200">Result</span>
                 </div>
                 {generatedImage && (
                    <div className="flex gap-2">
                         <button
                            onClick={handleSave}
                            disabled={isSaved}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm font-medium shadow-sm ${
                                isSaved 
                                ? 'bg-gray-100 text-gray-500 dark:bg-slate-700 dark:text-gray-400' 
                                : 'bg-primary-600 text-white hover:bg-primary-700'
                            }`}
                         >
                             {isSaved ? <CheckIcon className="w-4 h-4" /> : <SaveIcon className="w-4 h-4" />}
                             {isSaved ? 'Saved' : 'Save'}
                         </button>
                         <button
                            onClick={handleDownload}
                            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium shadow-sm active:transform active:scale-95"
                         >
                             <DownloadIcon className="w-4 h-4" />
                             Download {format.toUpperCase()}
                         </button>
                    </div>
                 )}
            </div>
            
            <div className="flex-grow flex items-center justify-center p-6 bg-slate-100 dark:bg-slate-900/50">
                {isLoading ? (
                    <div className="text-center">
                        <LoadingSpinner />
                         <p className="mt-4 text-gray-600 dark:text-gray-400 animate-pulse">
                            Painting pixels...
                        </p>
                    </div>
                ) : generatedImage ? (
                    <img
                        src={generatedImage}
                        alt={prompt}
                        className="max-w-full max-h-[600px] rounded-lg shadow-md object-contain"
                    />
                ) : error ? (
                    <div className="text-center max-w-md">
                        <p className="text-red-500 dark:text-red-400 font-medium mb-2">Error</p>
                        <p className="text-gray-600 dark:text-gray-400">{error}</p>
                    </div>
                ) : (
                    <div className="text-center text-gray-400 dark:text-gray-600">
                        <SparklesIcon className="w-16 h-16 mx-auto mb-3 opacity-20" />
                        <p>Your imagination awaits.</p>
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};

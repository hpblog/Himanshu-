
import React, { useState, useRef, useEffect } from 'react';
import { SparklesIcon, DownloadIcon, ThumbnailIcon, SaveIcon, CheckIcon } from './icons';
import { generateImage } from '../services/geminiService';
import { saveItem } from '../services/storageService';
import { LoadingSpinner } from './LoadingSpinner';

type TextStyle = {
    text: string;
    color: string;
    position: number; // 0-8 grid
    show: boolean;
};

type ImageFormat = 'png' | 'jpeg' | 'webp';

const TEXT_POSITIONS = [
    'Top Left', 'Top Center', 'Top Right',
    'Mid Left', 'Center', 'Mid Right',
    'Bot Left', 'Bot Center', 'Bot Right'
];

export const ThumbnailMaker: React.FC = () => {
  const [videoTitle, setVideoTitle] = useState('');
  const [visualDescription, setVisualDescription] = useState('');
  const [style, setStyle] = useState('Vibrant');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [format, setFormat] = useState<ImageFormat>('png');
  const [isSaved, setIsSaved] = useState(false);
  
  // Text Overlay State
  const [textOverlay, setTextOverlay] = useState<TextStyle>({
      text: '',
      color: '#FFFFFF',
      position: 7, // Bottom Center default
      show: true
  });

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Update overlay text when title changes, if user hasn't manually edited it much
  useEffect(() => {
    if (!generatedImage && textOverlay.text.length < videoTitle.length + 5) {
        setTextOverlay(prev => ({ ...prev, text: videoTitle }));
    }
  }, [videoTitle]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!visualDescription.trim()) return;
    if (!process.env.API_KEY) {
        setError("API key is not configured.");
        return;
    }

    setIsLoading(true);
    setError(null);
    setGeneratedImage(null);
    setIsSaved(false);

    // Construct a specific prompt for thumbnails
    const thumbnailPrompt = `
    A YouTube thumbnail background for a video titled "${videoTitle}".
    Visuals: ${visualDescription}.
    Style: ${style}.
    Requirements: High contrast, eye-catching, professionally lit, emotional, 4k resolution. 
    Composition: Leave some negative space for text overlay. Do not include text in the image itself.
    `;

    try {
        const imageUrl = await generateImage(thumbnailPrompt, '16:9');
        setGeneratedImage(imageUrl);
    } catch (err) {
        console.error(err);
        setError("Failed to generate thumbnail. Please try again.");
    } finally {
        setIsLoading(false);
    }
  };

  const getPositionCoordinates = (width: number, height: number, posIndex: number) => {
      const padding = width * 0.05;
      const xMap = [padding, width / 2, width - padding];
      const yMap = [padding + 40, height / 2, height - padding]; // +40 for top padding approx
      
      const row = Math.floor(posIndex / 3);
      const col = posIndex % 3;
      
      return { x: xMap[col], y: yMap[row], align: ['left', 'center', 'right'][col] as CanvasTextAlign };
  };

  const drawCanvas = (img: HTMLImageElement) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = img.width;
      canvas.height = img.height;

      // Draw Image
      ctx.drawImage(img, 0, 0);

      // Draw Text Overlay
      if (textOverlay.show && textOverlay.text) {
          const fontSize = canvas.height * 0.15; // Responsive font size
          ctx.font = `900 ${fontSize}px "Impact", "Arial Black", sans-serif`;
          ctx.fillStyle = textOverlay.color;
          ctx.strokeStyle = 'black';
          ctx.lineWidth = fontSize * 0.08;
          ctx.lineJoin = 'round';
          
          const { x, y, align } = getPositionCoordinates(canvas.width, canvas.height, textOverlay.position);
          ctx.textAlign = align;
          ctx.textBaseline = 'middle';
          
          ctx.strokeText(textOverlay.text, x, y);
          ctx.fillText(textOverlay.text, x, y);
      }
  };

  // Re-draw canvas whenever overlay settings change or image loads
  useEffect(() => {
      if (generatedImage) {
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.onload = () => drawCanvas(img);
          img.src = generatedImage;
      }
  }, [generatedImage, textOverlay]);

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Use PNG for saving to cloud to maintain quality, even if download format is different
    const dataUrl = canvas.toDataURL('image/png');
    saveItem({
        type: 'thumbnail',
        content: dataUrl,
        meta: {
            title: videoTitle || 'YouTube Thumbnail',
            prompt: visualDescription,
            date: new Date().toISOString()
        }
    });
    setIsSaved(true);
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const mimeType = `image/${format}`;
    const dataUrl = canvas.toDataURL(mimeType, 0.9);
    
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `youtube-thumbnail-${Date.now()}.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="animate-fade-in grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Controls */}
        <div className="lg:col-span-1 space-y-6">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-slate-700">
                <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                    <ThumbnailIcon className="w-5 h-5 text-red-500" />
                    Thumbnail Settings
                </h3>
                
                <form onSubmit={handleGenerate} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Video Title (Context)
                        </label>
                        <input
                            type="text"
                            value={videoTitle}
                            onChange={(e) => setVideoTitle(e.target.value)}
                            placeholder="e.g. I Built a Secret Base"
                            className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-500 outline-none dark:text-white"
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Visual Description
                        </label>
                        <textarea
                            value={visualDescription}
                            onChange={(e) => setVisualDescription(e.target.value)}
                            placeholder="Describe the scene (e.g. Shocked face on left, secret door glowing on right)"
                            className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-500 outline-none dark:text-white h-24 resize-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Art Style
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            {['Vibrant', 'Gaming', 'Minimalist', '3D Render', 'Comic Book', 'Realistic'].map((s) => (
                                <button
                                    key={s}
                                    type="button"
                                    onClick={() => setStyle(s)}
                                    className={`px-3 py-2 text-sm rounded-lg border transition-all ${
                                        style === s 
                                        ? 'bg-red-50 dark:bg-red-900/20 border-red-500 text-red-600 dark:text-red-300 font-semibold' 
                                        : 'border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-600 dark:text-gray-400'
                                    }`}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading || !visualDescription}
                        className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-md flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? <LoadingSpinner /> : <SparklesIcon className="w-5 h-5" />}
                        {isLoading ? 'Generating...' : 'Generate Thumbnail'}
                    </button>
                </form>
            </div>

            {/* Overlay & Export Controls */}
            {generatedImage && (
                 <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-slate-700 animate-fade-in space-y-6">
                    {/* Text Overlay Section */}
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-gray-800 dark:text-white">Text Overlay</h3>
                            <div className="flex items-center">
                                <input 
                                    type="checkbox" 
                                    checked={textOverlay.show} 
                                    onChange={(e) => setTextOverlay({...textOverlay, show: e.target.checked})}
                                    className="w-4 h-4 text-red-600 rounded focus:ring-red-500"
                                />
                            </div>
                        </div>
                        
                        <div className={`space-y-4 ${!textOverlay.show ? 'opacity-50 pointer-events-none' : ''}`}>
                             <input
                                type="text"
                                value={textOverlay.text}
                                onChange={(e) => setTextOverlay({...textOverlay, text: e.target.value})}
                                className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg px-4 py-2 dark:text-white"
                                placeholder="Overlay Text"
                            />
                            
                            <div>
                                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2 block">Text Color</label>
                                <div className="flex gap-2">
                                    {['#FFFFFF', '#FFFF00', '#FF0000', '#00FF00', '#00FFFF', '#FF00FF'].map(c => (
                                        <button
                                            key={c}
                                            onClick={() => setTextOverlay({...textOverlay, color: c})}
                                            className={`w-8 h-8 rounded-full border-2 ${textOverlay.color === c ? 'border-gray-900 dark:border-white scale-110' : 'border-transparent'}`}
                                            style={{backgroundColor: c}}
                                        />
                                    ))}
                                </div>
                            </div>

                            <div>
                                 <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2 block">Position</label>
                                 <div className="grid grid-cols-3 gap-1 w-24 mx-auto">
                                     {[0, 1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                                         <button
                                            key={i}
                                            onClick={() => setTextOverlay({...textOverlay, position: i})}
                                            className={`w-full aspect-square rounded border ${
                                                textOverlay.position === i 
                                                ? 'bg-red-500 border-red-600' 
                                                : 'bg-gray-100 dark:bg-slate-700 border-gray-300 dark:border-slate-600'
                                            }`}
                                         />
                                     ))}
                                 </div>
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-gray-200 dark:border-slate-700 pt-4">
                        <label className="block text-sm font-bold text-gray-800 dark:text-white mb-3">
                            Export Format
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                            {[
                                { value: 'png', label: 'PNG' },
                                { value: 'jpeg', label: 'JPEG' },
                                { value: 'webp', label: 'Web Image' }
                            ].map((option) => (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => setFormat(option.value as ImageFormat)}
                                    className={`px-2 py-2 text-xs font-semibold rounded-lg border transition-all ${
                                        format === option.value
                                            ? 'bg-secondary-50 dark:bg-secondary-900/20 border-secondary-500 text-secondary-700 dark:text-secondary-300'
                                            : 'border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-400 hover:border-secondary-300'
                                    }`}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    </div>
                 </div>
            )}
        </div>

        {/* Right Column: Preview */}
        <div className="lg:col-span-2">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-gray-200 dark:border-slate-700 overflow-hidden flex flex-col h-full min-h-[400px]">
                <div className="p-4 border-b border-gray-200 dark:border-slate-700 flex justify-between items-center bg-gray-50/50 dark:bg-slate-900/50">
                    <span className="font-semibold text-gray-700 dark:text-gray-200">Preview</span>
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
                                className="flex items-center gap-2 px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium shadow-sm"
                            >
                                <DownloadIcon className="w-5 h-5" />
                                Download {format === 'webp' ? 'WebP' : format.toUpperCase()}
                            </button>
                        </div>
                    )}
                </div>
                
                <div className="flex-grow flex items-center justify-center p-4 lg:p-8 bg-slate-100 dark:bg-slate-900/50">
                    {/* Hidden Canvas for Processing */}
                    <canvas ref={canvasRef} className="hidden" />

                    {isLoading ? (
                        <div className="text-center">
                            <LoadingSpinner />
                            <p className="mt-4 text-lg font-medium text-gray-600 dark:text-gray-300 animate-pulse">
                                Crafting the perfect clickbait...
                            </p>
                        </div>
                    ) : generatedImage ? (
                        /* CSS Overlay Preview for smoothness */
                        <div className="relative w-full aspect-video rounded-lg shadow-2xl overflow-hidden group">
                             <img src={generatedImage} alt="Generated Thumbnail" className="w-full h-full object-cover" />
                             
                             {textOverlay.show && textOverlay.text && (
                                 <div 
                                    className="absolute p-4 pointer-events-none"
                                    style={{
                                        ...getOverlayStyle(textOverlay.position),
                                        color: textOverlay.color,
                                        fontFamily: 'Impact, Arial Black, sans-serif',
                                        textShadow: '2px 2px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000',
                                        fontSize: 'clamp(24px, 6vw, 80px)', // Responsive font size
                                        lineHeight: 1.1
                                    }}
                                 >
                                     {textOverlay.text}
                                 </div>
                             )}
                        </div>
                    ) : error ? (
                        <div className="text-center text-red-500 p-4">
                            <p className="font-bold">Error</p>
                            <p>{error}</p>
                        </div>
                    ) : (
                        <div className="text-center text-gray-400 dark:text-gray-600 max-w-sm">
                            <ThumbnailIcon className="w-20 h-20 mx-auto mb-4 opacity-20" />
                            <p className="text-lg">Enter your video details and description to generate a high-converting thumbnail.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    </div>
  );
};

// Helper for CSS positioning in preview
function getOverlayStyle(posIndex: number): React.CSSProperties {
    const row = Math.floor(posIndex / 3);
    const col = posIndex % 3;
    
    const style: React.CSSProperties = {};
    
    if (row === 0) style.top = '5%';
    if (row === 1) style.top = '50%';
    if (row === 2) style.bottom = '5%';
    
    if (col === 0) style.left = '5%';
    if (col === 1) style.left = '50%';
    if (col === 2) style.right = '5%';

    if (col === 1) style.transform = 'translateX(-50%)';
    if (row === 1) style.transform = 'translateY(-50%)';
    if (col === 1 && row === 1) style.transform = 'translate(-50%, -50%)';
    
    style.textAlign = (['left', 'center', 'right'][col] as any);
    
    return style;
}

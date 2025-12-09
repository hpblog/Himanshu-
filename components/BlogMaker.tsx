import React, { useState } from 'react';
import { BookIcon, SparklesIcon, PenIcon, CopyIcon, SaveIcon, CheckIcon, ChevronRightIcon, ImageIcon, DownloadIcon, CodeIcon } from './icons';
import { generateBlogIdeas, generateBlogPost, generateImage, generateHtmlBlogPost, BlogPostIdea } from '../services/geminiService';
import { saveItem } from '../services/storageService';
import { LoadingSpinner } from './LoadingSpinner';

export const BlogMaker: React.FC = () => {
    // Mode: 'ideas' -> 'editor'
    const [mode, setMode] = useState<'ideas' | 'editor'>('ideas');
    const [viewMode, setViewMode] = useState<'preview' | 'html'>('preview');
    
    // Idea Generation State
    const [topic, setTopic] = useState('');
    const [generatedIdeas, setGeneratedIdeas] = useState<BlogPostIdea[]>([]);
    const [isGeneratingIdeas, setIsGeneratingIdeas] = useState(false);

    // Editor State
    const [selectedTitle, setSelectedTitle] = useState('');
    const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);
    const [tone, setTone] = useState('Friendly & Informative');
    const [generatedPost, setGeneratedPost] = useState('');
    const [generatedHtml, setGeneratedHtml] = useState('');
    const [isWriting, setIsWriting] = useState(false);
    
    // Image State
    const [blogImage, setBlogImage] = useState<string | null>(null);
    const [isGeneratingImage, setIsGeneratingImage] = useState(false);

    // UI State
    const [error, setError] = useState<string | null>(null);
    const [isSaved, setIsSaved] = useState(false);
    const [isCopied, setIsCopied] = useState(false);

    const handleGenerateIdeas = async () => {
        if (!topic.trim()) return;
        setIsGeneratingIdeas(true);
        setError(null);
        try {
            const ideas = await generateBlogIdeas(topic);
            setGeneratedIdeas(ideas);
        } catch (err: any) {
            setError(err.message || "Failed to generate ideas.");
        } finally {
            setIsGeneratingIdeas(false);
        }
    };

    const handleSelectIdea = (idea: BlogPostIdea) => {
        setSelectedTitle(idea.title);
        setSelectedKeywords(idea.seoKeywords);
        setMode('editor');
        setGeneratedPost(''); // Clear previous post
        setGeneratedHtml('');
        setBlogImage(null);   // Clear previous image
        setViewMode('preview');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleWritePost = async () => {
        if (!selectedTitle.trim()) return;
        setIsWriting(true);
        setError(null);
        setViewMode('preview');
        try {
            const post = await generateBlogPost(selectedTitle, selectedKeywords, tone);
            setGeneratedPost(post);
        } catch (err: any) {
            setError(err.message || "Failed to write post.");
        } finally {
            setIsWriting(false);
        }
    };

    const handleGenerateHtml = async () => {
        if (!selectedTitle.trim()) return;
        setIsWriting(true);
        setError(null);
        setViewMode('html');
        try {
            const html = await generateHtmlBlogPost(selectedTitle, selectedKeywords, tone);
            setGeneratedHtml(html);
        } catch (err: any) {
            setError(err.message || "Failed to generate HTML.");
        } finally {
            setIsWriting(false);
        }
    };

    const handleGenerateImage = async () => {
        if (!selectedTitle.trim()) return;
        setIsGeneratingImage(true);
        setError(null);
        try {
            const prompt = `A professional, high-quality blog post featured image about "${selectedTitle}". Context/Keywords: ${selectedKeywords.join(', ')}. Style: ${tone}. Photorealistic or modern illustration, wide shot, no text.`;
            const imageUrl = await generateImage(prompt, '16:9');
            setBlogImage(imageUrl);
        } catch (err: any) {
            setError(err.message || "Failed to generate image.");
        } finally {
            setIsGeneratingImage(false);
        }
    };

    const handleDownloadImage = () => {
        if (!blogImage) return;
        const link = document.createElement('a');
        link.href = blogImage;
        link.download = `blog-image-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleCopy = () => {
        const contentToCopy = viewMode === 'html' ? generatedHtml : generatedPost;
        if (!contentToCopy) return;
        navigator.clipboard.writeText(contentToCopy);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    const handleSave = () => {
        const content = viewMode === 'html' ? generatedHtml : generatedPost;
        if (!content) return;

        saveItem({
            type: 'video_script', // Using video_script type for general text for now, could expand types
            content: content,
            meta: {
                title: selectedTitle,
                prompt: `Blog Post (${viewMode === 'html' ? 'HTML' : 'Text'}): ${tone}`,
                date: new Date().toISOString()
            }
        });
        
        // Save image if exists
        if (blogImage) {
            saveItem({
                type: 'image',
                content: blogImage,
                meta: {
                    title: `Image: ${selectedTitle}`,
                    prompt: 'Blog Featured Image',
                    date: new Date().toISOString()
                }
            });
        }

        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 2000);
    };

    return (
        <div className="animate-fade-in max-w-6xl mx-auto space-y-8 pb-20">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="bg-teal-100 dark:bg-teal-900/30 p-2 rounded-xl">
                    <BookIcon className="w-6 h-6 text-teal-600 dark:text-teal-400" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Blog Writer</h2>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">SEO-friendly articles with a human touch.</p>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="bg-white dark:bg-slate-800 p-1 rounded-xl flex text-sm font-medium border border-gray-100 dark:border-slate-700 max-w-md">
                <button 
                    onClick={() => setMode('ideas')}
                    className={`flex-1 py-2.5 rounded-lg transition-all flex items-center justify-center gap-2 ${
                        mode === 'ideas' 
                        ? 'bg-teal-500 text-white shadow-md' 
                        : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-slate-700'
                    }`}
                >
                    <SparklesIcon className="w-4 h-4" /> Idea Generator
                </button>
                <button 
                    onClick={() => setMode('editor')}
                    className={`flex-1 py-2.5 rounded-lg transition-all flex items-center justify-center gap-2 ${
                        mode === 'editor' 
                        ? 'bg-teal-500 text-white shadow-md' 
                        : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-slate-700'
                    }`}
                >
                    <PenIcon className="w-4 h-4" /> Post Writer
                </button>
            </div>

            {/* ERROR DISPLAY */}
            {error && (
                <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-xl border border-red-100 dark:border-red-800 text-center">
                    {error}
                </div>
            )}

            {/* --- MODE: IDEAS --- */}
            {mode === 'ideas' && (
                <div className="space-y-6">
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-slate-700">
                         <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            What is your blog about?
                        </label>
                        <div className="flex flex-col md:flex-row gap-3">
                            <input
                                type="text"
                                value={topic}
                                onChange={(e) => setTopic(e.target.value)}
                                placeholder="e.g. Sustainable gardening for beginners"
                                className="flex-1 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-teal-500 outline-none dark:text-white"
                                onKeyDown={(e) => e.key === 'Enter' && handleGenerateIdeas()}
                            />
                            <button
                                onClick={handleGenerateIdeas}
                                disabled={isGeneratingIdeas || !topic.trim()}
                                className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isGeneratingIdeas ? <LoadingSpinner /> : <SparklesIcon className="w-5 h-5" />}
                                Generate Ideas
                            </button>
                        </div>
                    </div>

                    {generatedIdeas.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in-up">
                            {generatedIdeas.map((idea, index) => (
                                <div key={index} className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 hover:border-teal-500 dark:hover:border-teal-500 transition-colors group">
                                    <h3 className="font-bold text-lg text-gray-800 dark:text-white mb-2">{idea.title}</h3>
                                    <p className="text-gray-500 dark:text-gray-400 text-sm mb-4 line-clamp-2">{idea.summary}</p>
                                    
                                    <div className="flex flex-wrap gap-2 mb-4">
                                        {idea.seoKeywords.slice(0, 3).map((kw, i) => (
                                            <span key={i} className="text-xs bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded-md">
                                                #{kw}
                                            </span>
                                        ))}
                                    </div>

                                    <button 
                                        onClick={() => handleSelectIdea(idea)}
                                        className="w-full py-2 rounded-lg bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-300 font-medium text-sm flex items-center justify-center gap-2 group-hover:bg-teal-600 group-hover:text-white transition-all"
                                    >
                                        Write this Post <ChevronRightIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* --- MODE: EDITOR --- */}
            {mode === 'editor' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Controls */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-slate-700">
                            <h3 className="font-bold text-gray-800 dark:text-white mb-4">Post Settings</h3>
                            
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">
                                        Blog Title
                                    </label>
                                    <input
                                        type="text"
                                        value={selectedTitle}
                                        onChange={(e) => setSelectedTitle(e.target.value)}
                                        placeholder="Enter title..."
                                        className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 outline-none dark:text-white"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">
                                        SEO Keywords (Comma sep)
                                    </label>
                                    <input
                                        type="text"
                                        value={selectedKeywords.join(', ')}
                                        onChange={(e) => setSelectedKeywords(e.target.value.split(',').map(s => s.trim()))}
                                        placeholder="keyword1, keyword2..."
                                        className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 outline-none dark:text-white"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">
                                        Tone
                                    </label>
                                    <select 
                                        value={tone}
                                        onChange={(e) => setTone(e.target.value)}
                                        className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 outline-none dark:text-white"
                                    >
                                        <option>Friendly & Informative</option>
                                        <option>Professional & Corporate</option>
                                        <option>Witty & Fun</option>
                                        <option>Persuasive & Salesy</option>
                                        <option>Academic & Research</option>
                                    </select>
                                </div>

                                <div className="space-y-2 mt-4">
                                    <button
                                        onClick={handleWritePost}
                                        disabled={isWriting || !selectedTitle.trim()}
                                        className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {isWriting && viewMode === 'preview' ? <LoadingSpinner /> : <PenIcon className="w-5 h-5" />}
                                        Write Article (Text)
                                    </button>
                                    <button
                                        onClick={handleGenerateHtml}
                                        disabled={isWriting || !selectedTitle.trim()}
                                        className="w-full py-3 bg-gray-800 dark:bg-slate-700 hover:bg-gray-900 dark:hover:bg-slate-600 text-white font-bold rounded-xl shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {isWriting && viewMode === 'html' ? <LoadingSpinner /> : <CodeIcon className="w-5 h-5" />}
                                        Generate HTML Code
                                    </button>
                                </div>
                                
                                <div className="border-t border-gray-100 dark:border-slate-700 my-4 pt-4">
                                     <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">
                                        Media
                                    </label>
                                    <button
                                        onClick={handleGenerateImage}
                                        disabled={isGeneratingImage || !selectedTitle.trim()}
                                        className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {isGeneratingImage ? <LoadingSpinner /> : <ImageIcon className="w-5 h-5" />}
                                        Generate Featured Image
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Output */}
                    <div className="lg:col-span-2">
                         <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-gray-200 dark:border-slate-700 overflow-hidden flex flex-col h-full min-h-[600px]">
                            <div className="p-4 border-b border-gray-200 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-900/50 flex justify-between items-center">
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setViewMode('preview')}
                                        className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                                            viewMode === 'preview' 
                                            ? 'bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300' 
                                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700'
                                        }`}
                                    >
                                        Visual Preview
                                    </button>
                                    {generatedHtml && (
                                        <button
                                            onClick={() => setViewMode('html')}
                                            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 ${
                                                viewMode === 'html' 
                                                ? 'bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300' 
                                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700'
                                            }`}
                                        >
                                            <CodeIcon className="w-4 h-4" /> HTML Code
                                        </button>
                                    )}
                                </div>
                                
                                {(generatedPost || blogImage || generatedHtml) && (
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
                                    </div>
                                )}
                            </div>

                            <div className="flex-grow p-8 overflow-y-auto bg-slate-50 dark:bg-slate-900/30">
                                {/* Image Display Area */}
                                {blogImage && viewMode === 'preview' && (
                                    <div className="mb-8 relative group rounded-xl overflow-hidden shadow-md">
                                        <img src={blogImage} alt="Featured" className="w-full max-h-[400px] object-cover" />
                                        <button 
                                            onClick={handleDownloadImage}
                                            className="absolute top-4 right-4 bg-black/60 hover:bg-black/80 text-white px-4 py-2 rounded-lg flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm"
                                        >
                                            <DownloadIcon className="w-4 h-4" /> Download
                                        </button>
                                    </div>
                                )}
                                {isGeneratingImage && !blogImage && (
                                     <div className="mb-8 h-48 bg-gray-100 dark:bg-slate-800 rounded-xl flex flex-col items-center justify-center animate-pulse border border-dashed border-gray-300 dark:border-slate-700">
                                        <LoadingSpinner />
                                        <span className="mt-2 text-gray-500">Generating featured image...</span>
                                     </div>
                                )}

                                {isWriting ? (
                                    <div className="h-48 flex flex-col items-center justify-center">
                                        <LoadingSpinner />
                                        <p className="mt-4 text-gray-600 dark:text-gray-400 animate-pulse font-medium">
                                            {viewMode === 'html' ? 'Coding your custom HTML layout...' : 'Writing your masterpiece...'}
                                        </p>
                                    </div>
                                ) : viewMode === 'html' && generatedHtml ? (
                                    <div className="relative">
                                         <pre className="p-4 bg-gray-900 text-gray-100 rounded-lg overflow-x-auto text-sm font-mono whitespace-pre-wrap">
                                            {generatedHtml}
                                        </pre>
                                    </div>
                                ) : generatedPost && viewMode === 'preview' ? (
                                    <div className="prose dark:prose-invert max-w-none prose-headings:font-bold prose-headings:text-gray-800 dark:prose-headings:text-white prose-p:text-gray-600 dark:prose-p:text-gray-300">
                                        {/* Simple formatting render since we don't have markdown parser library */}
                                        {generatedPost.split('\n').map((line, i) => {
                                            if (line.startsWith('# ')) return <h1 key={i} className="text-3xl mb-4">{line.replace('# ', '')}</h1>;
                                            if (line.startsWith('## ')) return <h2 key={i} className="text-2xl mt-6 mb-3">{line.replace('## ', '')}</h2>;
                                            if (line.startsWith('### ')) return <h3 key={i} className="text-xl mt-4 mb-2">{line.replace('### ', '')}</h3>;
                                            if (line.startsWith('- ')) return <li key={i} className="ml-4">{line.replace('- ', '')}</li>;
                                            if (line.trim() === '') return <br key={i} />;
                                            return <p key={i} className="mb-3">{line.replace(/\*\*(.*?)\*\*/g, '$1')}</p>; // Basic bold stripping
                                        })}
                                    </div>
                                ) : !blogImage ? (
                                    <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 dark:text-gray-600 opacity-50 pt-10">
                                        <BookIcon className="w-20 h-20 mb-4" />
                                        <p className="text-lg">Select an idea or enter details to generate a post.</p>
                                    </div>
                                ) : null}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
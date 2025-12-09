import React, { useState, useEffect, useCallback } from 'react';
import { 
    SparklesIcon, VideoIcon, ImageIcon, ThumbnailIcon, MovieIcon, 
    CloudIcon, SpeakerIcon, PenIcon, HomeIcon, UserIcon, 
    SettingsIcon, BellIcon, ChevronRightIcon, LogOutIcon, MoonIcon, SunIcon,
    BookIcon, CheckIcon
} from './components/icons';

// Feature Components
import { IdeaInputForm } from './components/IdeaInputForm';
import { GeneratedContentDisplay } from './components/GeneratedContentDisplay';
import { LoadingSpinner } from './components/LoadingSpinner';
import { ImageMaker } from './components/ImageMaker';
import { ThumbnailMaker } from './components/ThumbnailMaker';
import { VideoMaker } from './components/VideoMaker';
import { VoiceMaker } from './components/VoiceMaker';
import { ScriptMaker } from './components/ScriptMaker';
import { BlogMaker } from './components/BlogMaker';
import { CloudStore } from './components/CloudStore';
import { generateVideoIdeas, generateImage } from './services/geminiService';
import { GeneratedIdea, Platform } from './types';

/* --- UI COMPONENTS --- */

const AppLogo: React.FC<{ size?: 'sm' | 'lg' }> = ({ size = 'lg' }) => (
    <div className={`relative flex items-center justify-center ${size === 'lg' ? 'w-20 h-20' : 'w-10 h-10'} rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-500 shadow-lg shadow-indigo-200 dark:shadow-none`}>
        <SparklesIcon className={`${size === 'lg' ? 'w-10 h-10' : 'w-5 h-5'} text-white`} />
    </div>
);

const SplashScreen: React.FC<{ onFinish: () => void }> = ({ onFinish }) => {
    useEffect(() => {
        const timer = setTimeout(onFinish, 2500);
        return () => clearTimeout(timer);
    }, [onFinish]);

    return (
        <div className="fixed inset-0 z-50 bg-white dark:bg-slate-950 flex flex-col items-center justify-center animate-fade-in">
            <div className="animate-pulse-slow">
                <AppLogo size="lg" />
            </div>
            <h1 className="mt-6 text-3xl font-bold text-slate-800 dark:text-white tracking-tight">VidScribe</h1>
            <p className="mt-2 text-slate-400 dark:text-slate-500 font-medium">Create without limits</p>
        </div>
    );
};

const AuthScreen: React.FC<{ onLogin: () => void }> = ({ onLogin }) => {
    const [isLogin, setIsLogin] = useState(true);

    return (
        <div className="min-h-screen bg-white dark:bg-slate-950 flex flex-col px-6 justify-center max-w-md mx-auto animate-fade-in">
            <div className="mb-10 text-center">
                <div className="inline-block mb-4"><AppLogo size="lg" /></div>
                <h2 className="text-3xl font-bold text-slate-800 dark:text-white">{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
                <p className="text-slate-400 mt-2">Sign in to continue to your creative studio</p>
            </div>

            <div className="space-y-4">
                {!isLogin && (
                    <div className="bg-slate-50 dark:bg-slate-900 px-4 py-3 rounded-2xl border border-slate-100 dark:border-slate-800">
                        <input type="text" placeholder="Full Name" className="w-full bg-transparent outline-none text-slate-700 dark:text-white placeholder-slate-400" />
                    </div>
                )}
                <div className="bg-slate-50 dark:bg-slate-900 px-4 py-3 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <input type="email" placeholder="Email Address" className="w-full bg-transparent outline-none text-slate-700 dark:text-white placeholder-slate-400" />
                </div>
                <div className="bg-slate-50 dark:bg-slate-900 px-4 py-3 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <input type="password" placeholder="Password" className="w-full bg-transparent outline-none text-slate-700 dark:text-white placeholder-slate-400" />
                </div>

                <button 
                    onClick={onLogin}
                    className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold py-4 rounded-2xl shadow-lg shadow-slate-200 dark:shadow-none mt-4 hover:scale-[1.02] transition-transform"
                >
                    {isLogin ? 'Login' : 'Sign Up'}
                </button>
            </div>

            <div className="mt-8 text-center">
                <p className="text-slate-500 dark:text-slate-400">
                    {isLogin ? "Don't have an account? " : "Already have an account? "}
                    <button onClick={() => setIsLogin(!isLogin)} className="text-indigo-600 dark:text-indigo-400 font-bold">
                        {isLogin ? 'Sign Up' : 'Login'}
                    </button>
                </p>
            </div>
        </div>
    );
};

/* --- MAIN APP LAYOUT & SCREENS --- */

type Screen = 'home' | 'profile' | 'settings' | 'tool-script' | 'tool-media' | 'tool-voice' | 'tool-cloud' | 'tool-ideas' | 'tool-blog';

const App: React.FC = () => {
    // App State
    const [appState, setAppState] = useState<'splash' | 'auth' | 'app'>('splash');
    const [currentScreen, setCurrentScreen] = useState<Screen>('home');
    const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
        if (typeof window !== 'undefined') return localStorage.getItem('darkMode') === 'true';
        return false;
    });

    // Feature States (Lifted from original App)
    const [sharedScript, setSharedScript] = useState<string>('');
    const [generatedIdeas, setGeneratedIdeas] = useState<GeneratedIdea[]>([]);
    const [generatedThumbnail, setGeneratedThumbnail] = useState<string | null>(null);
    const [topic, setTopic] = useState('');
    const [activeTab, setActiveTab] = useState<Platform>('YouTube');
    const [isIdeaLoading, setIsIdeaLoading] = useState(false);

    useEffect(() => {
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('darkMode', 'true');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('darkMode', 'false');
        }
    }, [isDarkMode]);

    const handleTransferScript = (script: string) => {
        setSharedScript(script);
        setCurrentScreen('tool-voice');
    };

    const handleGenerateIdeas = useCallback(async (newTopic: string) => {
        if (!process.env.API_KEY) return;
        setIsIdeaLoading(true);
        setTopic(newTopic);
        setGeneratedIdeas([]);
        try {
            const ideas = await generateVideoIdeas(newTopic);
            setGeneratedIdeas(ideas);
            const imagePrompt = ideas.find(idea => idea.imagePrompt)?.imagePrompt;
            if (imagePrompt) {
                const imageUrl = await generateImage(imagePrompt, '16:9');
                setGeneratedThumbnail(imageUrl);
            }
        } catch (e) { console.error(e); } 
        finally { setIsIdeaLoading(false); }
    }, []);

    // Render Logic
    if (appState === 'splash') return <SplashScreen onFinish={() => setAppState('auth')} />;
    if (appState === 'auth') return <AuthScreen onLogin={() => setAppState('app')} />;

    // Navigation Helper
    const NavButton: React.FC<{ screen: Screen, icon: any, label: string }> = ({ screen, icon: Icon, label }) => {
        const isActive = currentScreen === screen;
        return (
            <button 
                onClick={() => setCurrentScreen(screen)} 
                className={`flex flex-col items-center gap-1 transition-colors ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-600'}`}
            >
                <Icon className={`w-6 h-6 ${isActive ? 'fill-current' : ''}`} />
                <span className="text-[10px] font-medium">{label}</span>
            </button>
        );
    };

    const ToolCard: React.FC<{ 
        title: string, 
        subtitle: string, 
        icon: any, 
        onClick: () => void,
        className?: string,
        iconColor: string,
        iconBg: string
    }> = ({ title, subtitle, icon: Icon, onClick, className, iconColor, iconBg }) => (
        <div onClick={onClick} className={`relative overflow-hidden rounded-3xl p-6 cursor-pointer transition-all hover:scale-[1.02] shadow-sm hover:shadow-md ${className}`}>
             <div className="absolute -top-4 -right-4 p-4 opacity-5 pointer-events-none">
                <Icon className="w-32 h-32" />
            </div>
             <div className="relative z-10 flex flex-col h-full justify-between">
                <div className={`p-3 rounded-2xl w-fit mb-4 ${iconBg}`}>
                    <Icon className={`w-6 h-6 ${iconColor}`} />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-1">{title}</h3>
                    <p className="text-sm opacity-70 text-slate-600 dark:text-slate-300 font-medium">{subtitle}</p>
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-white transition-colors pb-24">
            
            {/* --- TOP HEADER --- */}
            <header className="fixed top-0 left-0 right-0 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md z-40 border-b border-slate-100 dark:border-slate-900">
                <div className="max-w-md mx-auto px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <AppLogo size="sm" />
                        <span className="font-bold text-xl tracking-tight">VidScribe</span>
                    </div>
                    <button className="p-2 rounded-full bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 relative">
                        <BellIcon className="w-5 h-5" />
                        <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-900"></span>
                    </button>
                </div>
            </header>

            {/* --- MAIN CONTENT AREA --- */}
            <main className="pt-24 px-6 max-w-md mx-auto min-h-screen animate-fade-in-up">
                
                {/* HOME SCREEN - REDESIGNED */}
                {currentScreen === 'home' && (
                    <div className="space-y-8 pb-20">
                        {/* Hero Section */}
                        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 to-purple-600 p-8 text-white shadow-xl shadow-indigo-500/20">
                            <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl"></div>
                            <div className="relative z-10">
                                <h1 className="text-3xl font-extrabold mb-2">Hello, Creator 👋</h1>
                                <p className="text-indigo-100 max-w-xs font-medium">Ready to create something amazing today?</p>
                                <div className="mt-6 flex gap-3">
                                    <button onClick={() => setCurrentScreen('tool-ideas')} className="bg-white text-indigo-600 px-5 py-2.5 rounded-xl font-bold text-sm shadow-sm hover:bg-indigo-50 transition-colors">Start Writing</button>
                                    <button onClick={() => setCurrentScreen('tool-media')} className="bg-indigo-500/50 backdrop-blur-sm text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-indigo-500/70 transition-colors border border-white/20">Create Media</button>
                                </div>
                            </div>
                        </div>

                        {/* Tools Grid */}
                        <div>
                            <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                                <SparklesIcon className="w-5 h-5 text-indigo-500" />
                                Creative Suite
                            </h2>
                            <div className="grid grid-cols-2 gap-4">
                                {/* AI Writer - Large Card */}
                                <ToolCard 
                                    title="AI Writer" 
                                    subtitle="Scripts & Ideas" 
                                    icon={PenIcon} 
                                    onClick={() => setCurrentScreen('tool-ideas')}
                                    className="col-span-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30"
                                    iconColor="text-blue-600 dark:text-blue-400"
                                    iconBg="bg-white dark:bg-blue-900/40"
                                />
                                
                                {/* Blog Writer */}
                                <ToolCard 
                                    title="Blog" 
                                    subtitle="SEO Posts" 
                                    icon={BookIcon} 
                                    onClick={() => setCurrentScreen('tool-blog')}
                                    className="bg-teal-50 dark:bg-teal-900/20 border border-teal-100 dark:border-teal-900/30"
                                    iconColor="text-teal-600 dark:text-teal-400"
                                    iconBg="bg-white dark:bg-teal-900/40"
                                />

                                {/* Voiceover */}
                                <ToolCard 
                                    title="Voice" 
                                    subtitle="TTS Audio" 
                                    icon={SpeakerIcon} 
                                    onClick={() => setCurrentScreen('tool-voice')}
                                    className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-900/30"
                                    iconColor="text-emerald-600 dark:text-emerald-400"
                                    iconBg="bg-white dark:bg-emerald-900/40"
                                />

                                {/* Media Studio - Large Card */}
                                <ToolCard 
                                    title="Media Studio" 
                                    subtitle="Images, Video & Thumbnails" 
                                    icon={ImageIcon} 
                                    onClick={() => setCurrentScreen('tool-media')}
                                    className="col-span-2 bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-900/30"
                                    iconColor="text-purple-600 dark:text-purple-400"
                                    iconBg="bg-white dark:bg-purple-900/40"
                                />
                            </div>
                        </div>

                        {/* Library Section */}
                        <div>
                            <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Your Assets</h2>
                            <ToolCard 
                                title="My Cloud Library" 
                                subtitle="Access your saved projects" 
                                icon={CloudIcon} 
                                onClick={() => setCurrentScreen('tool-cloud')}
                                className="w-full bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-900/30"
                                iconColor="text-orange-600 dark:text-orange-400"
                                iconBg="bg-white dark:bg-orange-900/40"
                            />
                        </div>
                    </div>
                )}

                {/* PROFILE SCREEN */}
                {currentScreen === 'profile' && (
                    <div className="text-center space-y-6">
                        <div className="w-24 h-24 mx-auto rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-4xl">
                            🧑‍💻
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold">Demo User</h2>
                            <p className="text-slate-500">Premium Plan</p>
                        </div>
                        <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 shadow-sm text-left space-y-1">
                            <div className="flex justify-between p-3 border-b border-slate-100 dark:border-slate-800">
                                <span className="text-slate-500">Credits</span>
                                <span className="font-bold">2,500 / 5,000</span>
                            </div>
                            <div className="flex justify-between p-3">
                                <span className="text-slate-500">Member Since</span>
                                <span className="font-bold">Oct 2023</span>
                            </div>
                        </div>
                         <button onClick={() => setAppState('auth')} className="w-full py-4 rounded-2xl bg-red-50 dark:bg-red-900/20 text-red-600 font-bold flex items-center justify-center gap-2">
                            <LogOutIcon className="w-5 h-5" /> Sign Out
                        </button>
                    </div>
                )}

                {/* SETTINGS SCREEN */}
                {currentScreen === 'settings' && (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold">Settings</h2>
                        
                        <div className="bg-white dark:bg-slate-900 rounded-3xl p-2 shadow-sm">
                            <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-full text-indigo-600">
                                        {isDarkMode ? <MoonIcon className="w-5 h-5" /> : <SunIcon className="w-5 h-5" />}
                                    </div>
                                    <span className="font-medium">Dark Mode</span>
                                </div>
                                <button 
                                    onClick={() => setIsDarkMode(!isDarkMode)}
                                    className={`w-12 h-7 rounded-full transition-colors relative ${isDarkMode ? 'bg-indigo-600' : 'bg-slate-200'}`}
                                >
                                    <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${isDarkMode ? 'left-6' : 'left-1'}`}></div>
                                </button>
                            </div>

                             <div className="flex items-center justify-between p-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-pink-50 dark:bg-pink-900/30 rounded-full text-pink-600">
                                        <BellIcon className="w-5 h-5" />
                                    </div>
                                    <span className="font-medium">Notifications</span>
                                </div>
                                <button className={`w-12 h-7 rounded-full transition-colors relative bg-indigo-600`}>
                                    <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform left-6`}></div>
                                </button>
                            </div>
                        </div>

                         <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 shadow-sm space-y-4">
                             <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                                 <span>Privacy Policy</span>
                                 <ChevronRightIcon className="w-4 h-4" />
                             </div>
                             <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                                 <span>Terms of Service</span>
                                 <ChevronRightIcon className="w-4 h-4" />
                             </div>
                              <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                                 <span>Help & Support</span>
                                 <ChevronRightIcon className="w-4 h-4" />
                             </div>
                         </div>
                    </div>
                )}

                {/* --- FUNCTIONAL TOOL SCREENS --- */}
                
                {/* 1. IDEAS & SCRIPTS */}
                {currentScreen === 'tool-ideas' && (
                    <div className="space-y-8 pb-20">
                         <div className="flex items-center gap-2 mb-4">
                            <button onClick={() => setCurrentScreen('home')} className="p-2 rounded-full bg-slate-100 dark:bg-slate-800"><ChevronRightIcon className="w-4 h-4 rotate-180" /></button>
                            <h2 className="text-xl font-bold">AI Writer</h2>
                        </div>
                        
                        <div className="bg-white dark:bg-slate-900 p-1 rounded-xl flex text-sm font-medium mb-4">
                            <button className="flex-1 py-2 rounded-lg bg-indigo-500 text-white shadow-md">Ideas</button>
                            <button onClick={() => setCurrentScreen('tool-script')} className="flex-1 py-2 text-slate-500">Scripting</button>
                        </div>

                        <IdeaInputForm onGenerate={handleGenerateIdeas} isLoading={isIdeaLoading} />
                        
                        {!isIdeaLoading && generatedIdeas.length > 0 && (
                            <GeneratedContentDisplay
                                ideas={generatedIdeas}
                                image={generatedThumbnail}
                                activeTab={activeTab}
                                setActiveTab={setActiveTab}
                                topic={topic}
                            />
                        )}
                    </div>
                )}

                 {currentScreen === 'tool-script' && (
                    <div className="space-y-8 pb-20">
                         <div className="flex items-center gap-2 mb-4">
                            <button onClick={() => setCurrentScreen('home')} className="p-2 rounded-full bg-slate-100 dark:bg-slate-800"><ChevronRightIcon className="w-4 h-4 rotate-180" /></button>
                            <h2 className="text-xl font-bold">Script Writer</h2>
                        </div>
                         <div className="bg-white dark:bg-slate-900 p-1 rounded-xl flex text-sm font-medium mb-4">
                            <button onClick={() => setCurrentScreen('tool-ideas')} className="flex-1 py-2 text-slate-500">Ideas</button>
                            <button className="flex-1 py-2 rounded-lg bg-indigo-500 text-white shadow-md">Scripting</button>
                        </div>
                        <ScriptMaker onTransferToVoice={handleTransferScript} />
                    </div>
                )}

                 {/* 2. BLOG WRITER */}
                {currentScreen === 'tool-blog' && (
                    <div className="space-y-8 pb-20">
                        <div className="flex items-center gap-2 mb-4">
                            <button onClick={() => setCurrentScreen('home')} className="p-2 rounded-full bg-slate-100 dark:bg-slate-800"><ChevronRightIcon className="w-4 h-4 rotate-180" /></button>
                            <h2 className="text-xl font-bold">Blog Studio</h2>
                        </div>
                        <BlogMaker />
                    </div>
                )}

                {/* 3. MEDIA TOOLS */}
                {currentScreen === 'tool-media' && (
                    <div className="space-y-8 pb-20">
                        <div className="flex items-center gap-2 mb-4">
                            <button onClick={() => setCurrentScreen('home')} className="p-2 rounded-full bg-slate-100 dark:bg-slate-800"><ChevronRightIcon className="w-4 h-4 rotate-180" /></button>
                            <h2 className="text-xl font-bold">Media Studio</h2>
                        </div>
                        
                        <div className="space-y-10">
                            <section>
                                <h3 className="font-bold text-lg mb-4 text-purple-600">Image Generator</h3>
                                <ImageMaker />
                            </section>
                            <section>
                                <h3 className="font-bold text-lg mb-4 text-pink-600">Video Animator</h3>
                                <VideoMaker />
                            </section>
                             <section>
                                <h3 className="font-bold text-lg mb-4 text-red-600">Thumbnail Creator</h3>
                                <ThumbnailMaker />
                            </section>
                        </div>
                    </div>
                )}

                {/* 4. VOICE TOOL */}
                {currentScreen === 'tool-voice' && (
                    <div className="space-y-8 pb-20">
                        <div className="flex items-center gap-2 mb-4">
                            <button onClick={() => setCurrentScreen('home')} className="p-2 rounded-full bg-slate-100 dark:bg-slate-800"><ChevronRightIcon className="w-4 h-4 rotate-180" /></button>
                            <h2 className="text-xl font-bold">Voiceover Studio</h2>
                        </div>
                        <VoiceMaker initialText={sharedScript} />
                    </div>
                )}

                 {/* 5. CLOUD */}
                {currentScreen === 'tool-cloud' && (
                    <div className="space-y-8 pb-20">
                        <div className="flex items-center gap-2 mb-4">
                            <button onClick={() => setCurrentScreen('home')} className="p-2 rounded-full bg-slate-100 dark:bg-slate-800"><ChevronRightIcon className="w-4 h-4 rotate-180" /></button>
                            <h2 className="text-xl font-bold">My Library</h2>
                        </div>
                        <CloudStore />
                    </div>
                )}

            </main>

            {/* --- BOTTOM NAVIGATION --- */}
            <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-slate-900 pb-safe pt-2 px-6 z-50">
                <div className="max-w-md mx-auto flex justify-between items-center h-16">
                    <NavButton screen="home" icon={HomeIcon} label="Home" />
                    <div className="w-px h-8 bg-slate-100 dark:bg-slate-800"></div>
                    <NavButton screen="profile" icon={UserIcon} label="Profile" />
                    <div className="w-px h-8 bg-slate-100 dark:bg-slate-800"></div>
                    <NavButton screen="settings" icon={SettingsIcon} label="Settings" />
                </div>
            </nav>

        </div>
    );
};

export default App;
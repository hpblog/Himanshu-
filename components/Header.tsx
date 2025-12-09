
import React from 'react';
import { SunIcon, MoonIcon, GithubIcon } from './icons';

interface HeaderProps {
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

export const Header: React.FC<HeaderProps> = ({ isDarkMode, onToggleDarkMode }) => {
  return (
    <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm sticky top-0 z-50 border-b border-gray-200 dark:border-slate-800">
      <nav className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center gap-2">
           <img src="https://picsum.photos/40/40" className="w-8 h-8 rounded-full" alt="logo"/>
           <span className="text-xl font-bold text-gray-800 dark:text-white">VidScribe AI</span>
        </div>
        <div className="flex items-center gap-4">
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-gray-600 dark:text-gray-300 hover:text-primary-500 dark:hover:text-primary-400 transition-colors">
                <GithubIcon className="w-6 h-6" />
            </a>
            <button
                onClick={onToggleDarkMode}
                className="p-2 rounded-full bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-slate-600 transition-colors"
                aria-label="Toggle dark mode"
            >
                {isDarkMode ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
            </button>
        </div>
      </nav>
    </header>
  );
};

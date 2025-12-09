import React, { useState, useEffect } from 'react';
import { SavedItem, SavedItemType } from '../types';
import { getSavedItems, deleteItem } from '../services/storageService';
import { CloudIcon, TrashIcon, TitleIcon, ImageIcon, ThumbnailIcon, ScriptIcon, DownloadIcon } from './icons';
import { LoadingSpinner } from './LoadingSpinner';

export const CloudStore: React.FC = () => {
  const [items, setItems] = useState<SavedItem[]>([]);
  const [filter, setFilter] = useState<SavedItemType | 'all'>('all');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    setIsLoading(true);
    setItems(getSavedItems());
    setIsLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm(`Are you sure you want to delete this from Local Storage?`)) {
        const updated = deleteItem(id);
        setItems(updated);
    }
  };

  const filteredItems = filter === 'all' ? items : items.filter(i => i.type === filter);

  const downloadImage = (base64: string, filename: string) => {
      const link = document.createElement('a');
      link.href = base64;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  return (
    <div className="animate-fade-in max-w-6xl mx-auto pb-10">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
            <h2 className="text-3xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                <CloudIcon className="w-8 h-8 text-primary-500" />
                My Cloud Store
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
                Your saved collection of ideas, images, and videos.
            </p>
        </div>
        
        <div className="flex gap-4 items-center">
            {/* Filter Toggle */}
            <div className="flex bg-white dark:bg-slate-800 p-1 rounded-lg border border-gray-200 dark:border-slate-700">
                {['all', 'idea', 'image', 'video_script'].map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f as any)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                            filter === f 
                            ? 'bg-primary-500 text-white shadow-sm' 
                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700'
                        }`}
                    >
                        {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1).replace('_', ' ')}
                    </button>
                ))}
            </div>
        </div>
      </div>

      {isLoading ? (
          <div className="flex justify-center py-20">
              <LoadingSpinner />
          </div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-2xl border border-dashed border-gray-300 dark:border-slate-700">
            <CloudIcon className="w-16 h-16 mx-auto text-gray-300 dark:text-slate-600 mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                Your local storage is empty
            </h3>
            <p className="text-gray-500 mt-2">
                Generate content and click the 'Save' icon to add it here.
            </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item) => (
                <div key={item.id} className="bg-white dark:bg-slate-800 rounded-xl shadow-md border border-gray-200 dark:border-slate-700 overflow-hidden flex flex-col hover:shadow-lg transition-shadow">
                    
                    {/* Header */}
                    <div className="p-4 border-b border-gray-100 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-900/50 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            {item.type === 'idea' && <TitleIcon className="w-4 h-4 text-orange-500" />}
                            {item.type === 'image' && <ImageIcon className="w-4 h-4 text-blue-500" />}
                            {item.type === 'thumbnail' && <ThumbnailIcon className="w-4 h-4 text-red-500" />}
                            {item.type === 'video_script' && <ScriptIcon className="w-4 h-4 text-purple-500" />}
                            <span className="text-xs font-semibold uppercase text-gray-500 tracking-wide">{item.type.replace('_', ' ')}</span>
                        </div>
                        <span className="text-xs text-gray-400">
                            {new Date(item.meta.date).toLocaleDateString()}
                        </span>
                    </div>

                    {/* Content */}
                    <div className="p-4 flex-grow">
                        {item.type === 'image' || item.type === 'thumbnail' ? (
                            <div className="aspect-video w-full rounded-lg overflow-hidden bg-gray-100 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 mb-2 group relative">
                                <img src={item.content} alt={item.meta.prompt} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <button 
                                        onClick={() => downloadImage(item.content, `${item.type}-${item.id}.png`)}
                                        className="bg-white text-gray-900 px-3 py-1.5 rounded-full text-sm font-bold flex items-center gap-2 hover:bg-gray-100"
                                    >
                                        <DownloadIcon className="w-4 h-4" /> Download
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="max-h-40 overflow-y-auto custom-scrollbar">
                                <h4 className="font-bold text-gray-800 dark:text-white mb-2">{item.meta.title || 'Untitled'}</h4>
                                <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap">{item.content}</p>
                            </div>
                        )}
                        {item.meta.prompt && (item.type === 'image' || item.type === 'thumbnail') && (
                            <p className="text-xs text-gray-500 italic mt-2 line-clamp-2">Prompt: {item.meta.prompt}</p>
                        )}
                         {item.type === 'video_script' && (
                             <div className="mt-2 text-xs bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 p-2 rounded">
                                 Video Script Preview
                             </div>
                         )}
                    </div>

                    {/* Footer */}
                    <div className="p-3 border-t border-gray-100 dark:border-slate-700 flex justify-end gap-2 items-center">
                        <button 
                            onClick={() => handleDelete(item.id)}
                            className="text-gray-400 hover:text-red-500 p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                            title="Delete"
                        >
                            <TrashIcon className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            ))}
        </div>
      )}
    </div>
  );
};
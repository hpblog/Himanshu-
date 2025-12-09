
import React, { useState } from 'react';
import { GeneratedIdea, Platform } from '../types';
import { saveItem } from '../services/storageService';
import { YoutubeIcon, InstagramIcon, HashtagIcon, TitleIcon, ScriptIcon, SaveIcon, CheckIcon } from './icons';

interface GeneratedContentDisplayProps {
  ideas: GeneratedIdea[];
  image: string | null;
  activeTab: Platform;
  setActiveTab: (tab: Platform) => void;
  topic: string;
}

const PlatformTab: React.FC<{ platform: Platform; activeTab: Platform; setActiveTab: (tab: Platform) => void; count: number; }> = ({ platform, activeTab, setActiveTab, count }) => {
  const isActive = platform === activeTab;
  const Icon = platform === 'YouTube' ? YoutubeIcon : InstagramIcon;
  return (
    <button
      onClick={() => setActiveTab(platform)}
      className={`flex items-center gap-2 px-4 py-2 text-lg font-semibold rounded-t-lg transition-colors duration-300 border-b-2 ${
        isActive
          ? 'text-primary-600 dark:text-primary-400 border-primary-500'
          : 'text-gray-500 dark:text-gray-400 border-transparent hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'
      }`}
    >
      <Icon className="w-6 h-6" />
      <span>{platform}</span>
       <span className={`text-sm px-2 py-0.5 rounded-full ${isActive ? 'bg-primary-100 dark:bg-primary-900/50 text-primary-600 dark:text-primary-300' : 'bg-gray-200 dark:bg-slate-700'}`}>{count}</span>
    </button>
  );
};

const IdeaCard: React.FC<{ idea: GeneratedIdea }> = ({ idea }) => {
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = () => {
    saveItem({
      type: 'idea',
      content: idea.description,
      meta: {
        title: idea.title,
        platform: idea.platform,
        date: new Date().toISOString()
      }
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-slate-700 transition-transform duration-300 hover:scale-[1.02] hover:shadow-xl relative group">
      <div className="absolute top-4 right-4">
        <button 
          onClick={handleSave}
          className={`p-2 rounded-full transition-all ${
            isSaved 
              ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300' 
              : 'bg-gray-100 text-gray-500 hover:bg-primary-50 hover:text-primary-600 dark:bg-slate-700 dark:text-gray-400'
          }`}
          title="Save to Cloud"
        >
          {isSaved ? <CheckIcon className="w-5 h-5" /> : <SaveIcon className="w-5 h-5" />}
        </button>
      </div>

      <div className="flex items-start gap-3 mb-3 pr-10">
          <div className="p-2 bg-primary-100 dark:bg-primary-900/50 rounded-lg">
              <TitleIcon className="w-5 h-5 text-primary-600 dark:text-primary-300"/>
          </div>
          <h3 className="text-xl font-bold text-gray-800 dark:text-white">{idea.title}</h3>
      </div>
      
      <div className="mt-4">
          <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-lg">
                  <ScriptIcon className="w-5 h-5 text-green-600 dark:text-green-300"/>
              </div>
              <h4 className="text-lg font-semibold text-gray-700 dark:text-gray-200">Script Outline</h4>
          </div>
        <p className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap ml-2 pl-10 border-l-2 border-gray-200 dark:border-slate-700 py-1">{idea.description}</p>
      </div>
      
      <div className="mt-6">
          <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/50 rounded-lg">
                  <HashtagIcon className="w-5 h-5 text-orange-600 dark:text-orange-300"/>
              </div>
              <h4 className="text-lg font-semibold text-gray-700 dark:text-gray-200">Hashtags</h4>
          </div>
          <div className="flex flex-wrap gap-2 ml-12">
              {idea.hashtags.map((tag, index) => (
              <span key={index} className="px-3 py-1 bg-secondary-100/50 dark:bg-secondary-900/30 text-secondary-800 dark:text-secondary-200 text-sm font-medium rounded-full">
                  #{tag}
              </span>
              ))}
          </div>
      </div>
    </div>
  );
};


export const GeneratedContentDisplay: React.FC<GeneratedContentDisplayProps> = ({ ideas, image, activeTab, setActiveTab, topic }) => {
  const filteredIdeas = ideas.filter(idea => idea.platform === activeTab);
  const youtubeCount = ideas.filter(idea => idea.platform === 'YouTube').length;
  const instagramCount = ideas.filter(idea => idea.platform === 'Instagram').length;

  const [isThumbSaved, setIsThumbSaved] = useState(false);
  const handleSaveThumbnail = () => {
    if(!image) return;
    saveItem({
      type: 'image',
      content: image,
      meta: {
        title: `Thumbnail for ${topic}`,
        prompt: `Generated thumbnail for ${topic}`,
        date: new Date().toISOString()
      }
    });
    setIsThumbSaved(true);
    setTimeout(() => setIsThumbSaved(false), 2000);
  }

  return (
    <div className="mt-12 animate-fade-in">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-1 lg:sticky top-24">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Thumbnail Concept</h2>
                <div className="relative aspect-video w-full bg-slate-200 dark:bg-slate-800 rounded-2xl shadow-lg overflow-hidden border border-gray-200 dark:border-slate-700 group">
                {image ? (
                    <>
                    <img src={image} alt={`AI generated thumbnail for "${topic}"`} className="w-full h-full object-cover" />
                    <button 
                        onClick={handleSaveThumbnail}
                        className={`absolute top-2 right-2 p-2 rounded-full transition-all shadow-md ${
                            isThumbSaved 
                            ? 'bg-green-500 text-white' 
                            : 'bg-white text-gray-700 hover:text-primary-500'
                        }`}
                        title="Save to Cloud"
                    >
                        {isThumbSaved ? <CheckIcon className="w-4 h-4" /> : <SaveIcon className="w-4 h-4" />}
                    </button>
                    </>
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <p className="text-gray-500">Generating image...</p>
                    </div>
                )}
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 text-center">AI-generated image for inspiration.</p>
            </div>
            <div className="lg:col-span-2">
                <div className="flex border-b border-gray-200 dark:border-slate-700">
                    <PlatformTab platform="YouTube" activeTab={activeTab} setActiveTab={setActiveTab} count={youtubeCount} />
                    <PlatformTab platform="Instagram" activeTab={activeTab} setActiveTab={setActiveTab} count={instagramCount} />
                </div>
                <div className="mt-6 space-y-6">
                    {filteredIdeas.map((idea, index) => (
                        <IdeaCard key={`${activeTab}-${index}`} idea={idea} />
                    ))}
                </div>
            </div>
        </div>
    </div>
  );
};

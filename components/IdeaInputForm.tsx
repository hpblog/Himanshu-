
import React, { useState } from 'react';
import { SparklesIcon } from './icons';

interface IdeaInputFormProps {
  onGenerate: (topic: string) => void;
  isLoading: boolean;
}

export const IdeaInputForm: React.FC<IdeaInputFormProps> = ({ onGenerate, isLoading }) => {
  const [topic, setTopic] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGenerate(topic);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-center gap-3 bg-white dark:bg-slate-800 p-2 rounded-full shadow-lg border border-gray-200 dark:border-slate-700">
      <input
        type="text"
        value={topic}
        onChange={(e) => setTopic(e.target.value)}
        placeholder="e.g., 'Healthy breakfast recipes' or 'DIY home decor'"
        className="w-full flex-grow bg-transparent text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none px-4 py-2"
        disabled={isLoading}
      />
      <button
        type="submit"
        disabled={isLoading}
        className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-primary-500 text-white font-semibold rounded-full shadow-md hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 focus:ring-offset-gray-100 dark:focus:ring-offset-slate-900 transition-all duration-300 disabled:bg-primary-300 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          'Generating...'
        ) : (
          <>
            <SparklesIcon className="w-5 h-5" />
            Generate Ideas
          </>
        )}
      </button>
    </form>
  );
};

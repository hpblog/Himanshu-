
export type Platform = 'YouTube' | 'Instagram';

export interface GeneratedIdea {
  platform: Platform;
  title: string;
  description: string; // This can be a script or an outline
  hashtags: string[];
  imagePrompt?: string; // Only one idea needs this for generating the thumbnail
}

export type SavedItemType = 'idea' | 'image' | 'thumbnail' | 'video_script';

export interface SavedItem {
  id: string;
  type: SavedItemType;
  content: string; // Text for ideas/scripts, Base64 for images
  meta: {
    title?: string;
    prompt?: string;
    date: string;
    platform?: string;
  };
}

import { SavedItem } from '../types';

const STORAGE_KEY = 'VIDSCRIBE_CLOUD_STORE';

export const getSavedItems = (): SavedItem[] => {
  try {
    const items = localStorage.getItem(STORAGE_KEY);
    return items ? JSON.parse(items) : [];
  } catch (e) {
    console.error("Failed to load items", e);
    return [];
  }
};

export const saveItem = (item: Omit<SavedItem, 'id'>): boolean => {
  try {
    const items = getSavedItems();
    const newItem: SavedItem = {
      ...item,
      id: crypto.randomUUID(),
    };
    
    // Save locally
    const updatedItems = [newItem, ...items];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedItems));

    return true;
  } catch (e) {
    console.error("Failed to save item (likely quota exceeded)", e);
    alert("Storage full! Please delete some items from your Cloud Store.");
    return false;
  }
};

export const deleteItem = (id: string): SavedItem[] => {
  const items = getSavedItems();
  const updatedItems = items.filter(item => item.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedItems));
  return updatedItems;
};
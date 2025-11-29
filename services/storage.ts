import { WorkItem, Series } from '../types';

const STORAGE_KEY = 'weekly_focus_items_v1';
const SERIES_KEY = 'weekly_focus_series_v1';

// --- Items ---

export const getStoredItems = (): WorkItem[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error("Failed to load items", error);
    return [];
  }
};

export const saveItem = (item: WorkItem): WorkItem[] => {
  const current = getStoredItems();
  const updated = [item, ...current];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
};

export const updateItem = (updatedItem: WorkItem): WorkItem[] => {
  const current = getStoredItems();
  const updated = current.map(item => 
    item.id === updatedItem.id ? updatedItem : item
  );
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
};

export const deleteItem = (id: string): WorkItem[] => {
  const current = getStoredItems();
  const updated = current.filter(i => i.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
};

// --- Series ---

export const getStoredSeries = (): Series[] => {
  try {
    const stored = localStorage.getItem(SERIES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error("Failed to load series", error);
    return [];
  }
};

export const saveSeries = (series: Series): Series[] => {
  const current = getStoredSeries();
  const updated = [series, ...current];
  localStorage.setItem(SERIES_KEY, JSON.stringify(updated));
  return updated;
};

export const updateSeries = (updatedSeries: Series): Series[] => {
  const current = getStoredSeries();
  const updated = current.map(s => 
    s.id === updatedSeries.id ? updatedSeries : s
  );
  localStorage.setItem(SERIES_KEY, JSON.stringify(updated));
  return updated;
};

export const deleteSeries = (id: string): Series[] => {
  const current = getStoredSeries();
  // Note: We don't delete the items associated, we just keep them loosely.
  // Or we could remove seriesId from items, but simpler is fine.
  const updated = current.filter(s => s.id !== id);
  localStorage.setItem(SERIES_KEY, JSON.stringify(updated));
  return updated;
};

export const clearAll = (): void => {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(SERIES_KEY);
};
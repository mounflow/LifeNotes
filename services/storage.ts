import { WorkItem, Series } from '../types';

const API_BASE = '';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

// --- Items ---

export const getStoredItems = async (): Promise<WorkItem[]> => {
  try {
    const response = await fetch(`${API_BASE}/api/items`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch items');
    return await response.json();
  } catch (error) {
    console.error("Failed to load items", error);
    return [];
  }
};

export const saveItem = async (item: WorkItem): Promise<WorkItem[]> => {
  try {
    await fetch(`${API_BASE}/api/items`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(item),
    });
    return await getStoredItems();
  } catch (error) {
    console.error("Failed to save item", error);
    return [];
  }
};

export const updateItem = async (updatedItem: WorkItem): Promise<WorkItem[]> => {
  try {
    await fetch(`${API_BASE}/api/items`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(updatedItem),
    });
    return await getStoredItems();
  } catch (error) {
    console.error("Failed to update item", error);
    return [];
  }
};

export const deleteItem = async (id: string): Promise<WorkItem[]> => {
  try {
    await fetch(`${API_BASE}/api/items/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return await getStoredItems();
  } catch (error) {
    console.error("Failed to delete item", error);
    return [];
  }
};

// --- Series ---

export const getStoredSeries = async (): Promise<Series[]> => {
  try {
    const response = await fetch(`${API_BASE}/api/series`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch series');
    return await response.json();
  } catch (error) {
    console.error("Failed to load series", error);
    return [];
  }
};

export const saveSeries = async (series: Series): Promise<Series[]> => {
  try {
    await fetch(`${API_BASE}/api/series`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(series),
    });
    return await getStoredSeries();
  } catch (error) {
    console.error("Failed to save series", error);
    return [];
  }
};

export const updateSeries = async (updatedSeries: Series): Promise<Series[]> => {
  try {
    await fetch(`${API_BASE}/api/series`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(updatedSeries),
    });
    return await getStoredSeries();
  } catch (error) {
    console.error("Failed to update series", error);
    return [];
  }
};

export const deleteSeries = async (id: string): Promise<Series[]> => {
  try {
    await fetch(`${API_BASE}/api/series/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return await getStoredSeries();
  } catch (error) {
    console.error("Failed to delete series", error);
    return [];
  }
};

export const clearAll = (): void => {
  // No longer needed for API-based storage
  console.warn('clearAll is deprecated with API storage');
};
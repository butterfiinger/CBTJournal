// Storage layer — all data lives in the browser's localStorage.
// This is the privacy-first approach: nothing leaves the device except active LLM calls.

const STORAGE_KEY = 'emotional_processing_entries';

// Generate a simple ID for new entries
const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
};

// Get all entries from storage
export const getAllEntries = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    return JSON.parse(data);
  } catch (e) {
    console.error('Failed to read entries:', e);
    return [];
  }
};

// Save an entry (create or update based on whether id exists)
export const saveEntry = (entry) => {
  const entries = getAllEntries();
  const existingIndex = entries.findIndex((e) => e.id === entry.id);

  if (existingIndex >= 0) {
    // Update existing
    entries[existingIndex] = { ...entries[existingIndex], ...entry, updatedAt: new Date().toISOString() };
  } else {
    // Create new
    const newEntry = {
      id: generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...entry,
    };
    entries.push(newEntry);
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  return existingIndex >= 0 ? entries[existingIndex] : entries[entries.length - 1];
};

// Delete an entry
export const deleteEntry = (id) => {
  const entries = getAllEntries().filter((e) => e.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
};

// Get entries by status: 'captured', 'processing', 'processed', 'good_moment'
export const getEntriesByStatus = (status) => {
  return getAllEntries().filter((e) => e.status === status);
};

// Get open captures (status = captured or processing) sorted oldest first
export const getOpenCaptures = () => {
  return getAllEntries()
    .filter((e) => e.status === 'captured' || e.status === 'processing')
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
};

// Get good moments sorted newest first
export const getGoodMoments = () => {
  return getAllEntries()
    .filter((e) => e.status === 'good_moment')
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
};

// Export all data as JSON (for backup)
export const exportAllData = () => {
  return JSON.stringify(getAllEntries(), null, 2);
};

// Import data from JSON (for restore)
export const importData = (jsonString) => {
  try {
    const data = JSON.parse(jsonString);
    if (!Array.isArray(data)) throw new Error('Invalid data format');
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch (e) {
    console.error('Failed to import:', e);
    return false;
  }
};

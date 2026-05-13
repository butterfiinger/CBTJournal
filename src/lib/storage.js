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

// Export all data as JSON (for backup) — wrapped in a versioned envelope
export const exportAllData = () => {
  const envelope = {
    version: 1,
    exportedAt: new Date().toISOString(),
    appName: 'emotional-processing-tool',
    entries: getAllEntries(),
  };
  return JSON.stringify(envelope, null, 2);
};

// Import data from JSON (replace mode) — returns { success, count, error }
export const importData = (jsonString) => {
  try {
    const data = JSON.parse(jsonString);

    // Support both versioned envelope (new) and bare array (legacy)
    let entries;
    if (data && Array.isArray(data.entries)) {
      entries = data.entries;
    } else if (Array.isArray(data)) {
      entries = data;
    } else {
      return { success: false, count: 0, error: 'File does not look like a valid export.' };
    }

    // Validate each entry has at least an id and createdAt
    const valid = entries.every((e) => e && typeof e.id === 'string' && typeof e.createdAt === 'string');
    if (!valid) {
      return { success: false, count: 0, error: 'Some entries are missing required fields.' };
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    return { success: true, count: entries.length, error: null };
  } catch (e) {
    console.error('Failed to import:', e);
    return { success: false, count: 0, error: 'Could not read this file as JSON.' };
  }
};

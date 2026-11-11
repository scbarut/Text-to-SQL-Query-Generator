export interface HistoryItem {
  id: string;
  question: string;
  timestamp: number;
  sql?: string;
  rowCount?: number;
  status: 'success' | 'error';
  errorMessage?: string;
}

export const STORAGE_KEY = 'text_to_sql_query_history_v1';
export const MAX_HISTORY_ITEMS = 50;

/**
 * Loads query history list from browser localStorage.
 * Returns empty array if localStorage is unavailable or corrupted.
 */
export function loadQueryHistory(): HistoryItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return [];
  } catch (err) {
    console.warn('Failed to parse query history from localStorage:', err);
    return [];
  }
}

/**
 * Prepends a new query execution record to the history and caps list at MAX_HISTORY_ITEMS (50).
 */
export function saveQueryToHistory(
  item:
    | HistoryItem
    | {
        question: string;
        sql?: string;
        rowCount?: number;
        status: 'success' | 'error';
        errorMessage?: string;
        id?: string;
        timestamp?: number;
      }
): HistoryItem[] {
  try {
    const existing = loadQueryHistory();
    const fullItem: HistoryItem = {
      id: item.id || `hist_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      question: item.question.trim(),
      timestamp: item.timestamp || Date.now(),
      sql: item.sql,
      rowCount: item.rowCount,
      status: item.status,
      errorMessage: item.errorMessage,
    };

    // Prepend new item and keep up to MAX_HISTORY_ITEMS (50)
    const updated = [fullItem, ...existing].slice(0, MAX_HISTORY_ITEMS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.warn('Failed to persist query to history:', err);
    return loadQueryHistory();
  }
}

/**
 * Removes a specific query history entry by id.
 */
export function deleteHistoryItem(id: string): HistoryItem[] {
  try {
    const existing = loadQueryHistory();
    const updated = existing.filter((item) => item.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.warn('Failed to delete query history item:', err);
    return loadQueryHistory();
  }
}

/**
 * Completely clears all query history records from localStorage.
 */
export function clearQueryHistory(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.warn('Failed to clear query history from localStorage:', err);
  }
}


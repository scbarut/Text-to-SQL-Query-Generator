import { describe, it, expect, beforeEach } from 'vitest';
import {
  loadQueryHistory,
  saveQueryToHistory,
  deleteHistoryItem,
  clearQueryHistory,
  MAX_HISTORY_ITEMS,
} from '../historyStorage';

class LocalStorageMock {
  private store: Record<string, string> = {};

  clear() {
    this.store = {};
  }

  getItem(key: string) {
    return this.store[key] || null;
  }

  setItem(key: string, value: string) {
    this.store[key] = String(value);
  }

  removeItem(key: string) {
    delete this.store[key];
  }
}

describe('historyStorage', () => {
  beforeEach(() => {
    (globalThis as unknown as { localStorage: LocalStorageMock }).localStorage = new LocalStorageMock();
  });

  it('loads empty array when localStorage is empty', () => {
    const history = loadQueryHistory();
    expect(history).toEqual([]);
  });

  it('saves a query and generates id and timestamp if omitted', () => {
    const item = saveQueryToHistory({
      question: 'Show total salary by department',
      sql: 'SELECT department, SUM(salary) FROM employees GROUP BY department',
      rowCount: 5,
      status: 'success',
    });

    expect(item.length).toBe(1);
    expect(item[0].question).toBe('Show total salary by department');
    expect(item[0].id).toBeDefined();
    expect(item[0].timestamp).toBeGreaterThan(0);
    expect(item[0].rowCount).toBe(5);
    expect(item[0].status).toBe('success');
  });

  it('prepends newest query to the beginning of the list', () => {
    saveQueryToHistory({
      question: 'First query',
      status: 'success',
    });
    saveQueryToHistory({
      question: 'Second query',
      status: 'success',
    });

    const history = loadQueryHistory();
    expect(history.length).toBe(2);
    expect(history[0].question).toBe('Second query');
    expect(history[1].question).toBe('First query');
  });

  it('enforces maximum limit of 50 items (FIFO eviction)', () => {
    for (let i = 1; i <= 60; i++) {
      saveQueryToHistory({
        question: `Query ${i}`,
        status: 'success',
      });
    }

    const history = loadQueryHistory();
    expect(history.length).toBe(MAX_HISTORY_ITEMS);
    expect(history.length).toBe(50);
    // Most recent is Query 60, oldest is Query 11
    expect(history[0].question).toBe('Query 60');
    expect(history[history.length - 1].question).toBe('Query 11');
  });

  it('deletes an item by id', () => {
    saveQueryToHistory({ question: 'Query A', status: 'success' });
    saveQueryToHistory({ question: 'Query B', status: 'success' });

    const current = loadQueryHistory();
    const idToDelete = current[0].id;
    const updated = deleteHistoryItem(idToDelete);

    expect(updated.length).toBe(1);
    expect(updated[0].question).toBe('Query A');
    expect(loadQueryHistory().length).toBe(1);
  });

  it('clears all history', () => {
    saveQueryToHistory({ question: 'Query 1', status: 'success' });
    saveQueryToHistory({ question: 'Query 2', status: 'success' });

    clearQueryHistory();
    expect(loadQueryHistory()).toEqual([]);
  });

  it('handles invalid JSON in localStorage gracefully', () => {
    localStorage.setItem('text_to_sql_query_history_v1', 'invalid-json{{{');
    expect(loadQueryHistory()).toEqual([]);
  });
});

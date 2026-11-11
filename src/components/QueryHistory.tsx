import React, { useState, useEffect } from 'react';
import {
  History,
  X,
  Trash2,
  Play,
  Clock,
  Search,
  CheckCircle2,
  AlertCircle,
  FileText,
} from 'lucide-react';
import {
  HistoryItem,
  loadQueryHistory,
  deleteHistoryItem,
  clearQueryHistory,
} from '../utils/historyStorage';

export interface QueryHistoryProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectQuery: (question: string, executeImmediately?: boolean) => void;
  /** Counter or trigger to tell the component to refresh history when a new query is run */
  lastUpdated?: number;
}

function formatRelativeTime(timestamp: number): string {
  const diffSec = Math.floor((Date.now() - timestamp) / 1000);
  if (diffSec < 10) return 'Just now';
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}h ago`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return new Date(timestamp).toLocaleDateString();
}

export const QueryHistory: React.FC<QueryHistoryProps> = ({
  isOpen,
  onClose,
  onSelectQuery,
  lastUpdated,
}) => {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  useEffect(() => {
    setHistory(loadQueryHistory());
  }, [isOpen, lastUpdated]);

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = deleteHistoryItem(id);
    setHistory(updated);
  };

  const handleClearAll = () => {
    clearQueryHistory();
    setHistory([]);
    setShowClearConfirm(false);
  };

  const filteredHistory = history.filter((item) =>
    item.question.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <aside
      role="complementary"
      aria-label="Query History"
      className="fixed inset-y-0 right-0 z-30 w-80 sm:w-96 bg-white border-l border-slate-200 shadow-xl flex flex-col transform transition-transform duration-200 ease-in-out"
    >
      {/* Header */}
      <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
            <History className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <span>Query History</span>
              <span className="text-[10px] bg-slate-200/80 text-slate-700 px-1.5 py-0.5 rounded-full font-mono">
                {history.length} / 50
              </span>
            </h2>
            <p className="text-[11px] text-slate-500">Persistent across browser sessions</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          title="Close History Panel"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Search and Action Bar */}
      <div className="p-3 border-b border-slate-100 bg-white space-y-2">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search recent queries..."
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:ring-1 focus:ring-blue-500 text-slate-800 placeholder-slate-400"
          />
        </div>

        {history.length > 0 && (
          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] text-slate-400">
              Click to load &middot; Play to rerun
            </span>
            {showClearConfirm ? (
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-red-600 font-medium">Clear all?</span>
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="px-2 py-0.5 text-[10px] bg-red-600 text-white rounded-md font-semibold hover:bg-red-700 active:scale-95"
                >
                  Yes
                </button>
                <button
                  type="button"
                  onClick={() => setShowClearConfirm(false)}
                  className="px-2 py-0.5 text-[10px] bg-slate-100 text-slate-600 rounded-md hover:bg-slate-200"
                >
                  No
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowClearConfirm(true)}
                className="text-[11px] text-slate-400 hover:text-red-600 transition-colors flex items-center gap-1"
                title="Clear all stored history"
              >
                <Trash2 className="w-3 h-3" />
                <span>Clear history</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* History Items List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {history.length === 0 ? (
          <div className="text-center py-12 px-4 text-slate-400">
            <History className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm font-medium text-slate-600">No queries executed yet</p>
            <p className="text-xs mt-1 text-slate-400">
              Queries you run will automatically appear here for one-click rerun.
            </p>
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs">
            No history items match &ldquo;{searchTerm}&rdquo;
          </div>
        ) : (
          filteredHistory.map((item) => (
            <div
              key={item.id}
              onClick={() => {
                onSelectQuery(item.question, false);
                onClose();
              }}
              className="group relative bg-white hover:bg-slate-50 border border-slate-200/90 hover:border-blue-300 rounded-lg p-3 text-left transition-all duration-150 shadow-2xs cursor-pointer"
            >
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-1.5">
                  {item.status === 'success' ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                  )}
                  <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatRelativeTime(item.timestamp)}
                  </span>
                </div>

                <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                  {item.rowCount !== undefined && (
                    <span className="text-[10px] font-mono px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded-md">
                      {item.rowCount} {item.rowCount === 1 ? 'row' : 'rows'}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectQuery(item.question, true);
                      onClose();
                    }}
                    className="p-1 rounded-md bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white transition-colors"
                    title="Rerun query immediately"
                  >
                    <Play className="w-3 h-3 fill-current" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleDelete(item.id, e)}
                    className="p-1 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    title="Delete item"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Question Text */}
              <p className="text-xs text-slate-800 font-medium line-clamp-2 leading-relaxed">
                {item.question}
              </p>

              {/* SQL Preview Snippet if available */}
              {item.sql && (
                <div className="mt-2 pt-1.5 border-t border-slate-100 text-[10px] font-mono text-slate-500 truncate flex items-center gap-1">
                  <FileText className="w-3 h-3 text-slate-400 shrink-0" />
                  <span className="truncate">{item.sql}</span>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </aside>
  );
};


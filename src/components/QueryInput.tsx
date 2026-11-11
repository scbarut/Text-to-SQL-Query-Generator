import React from 'react';
import { Send, Sparkles, CornerDownLeft, RotateCcw } from 'lucide-react';

export interface QueryInputProps {
  question: string;
  onChange: (value: string) => void;
  onSubmit: (e?: React.FormEvent) => void;
  loading: boolean;
  sampleQueries?: string[];
  onSelectSample?: (sample: string) => void;
}

const DEFAULT_SAMPLES = [
  'Calculate total salary by department',
  'List all active projects and team counts',
  'Show employees hired after 2021',
  'Find employees earning over $100,000',
];

export const QueryInput: React.FC<QueryInputProps> = ({
  question,
  onChange,
  onSubmit,
  loading,
  sampleQueries = DEFAULT_SAMPLES,
  onSelectSample,
}) => {
  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!question.trim() || loading) return;
    onSubmit(e);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const charCount = question.length;
  const isNearLimit = charCount > 900;
  const isAtLimit = charCount >= 1000;

  return (
    <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-6 transition-shadow duration-200 hover:shadow-sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <label
              htmlFor="query-input"
              className="text-sm font-semibold text-slate-800 flex items-center gap-1.5"
            >
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span>Natural Language Query</span>
            </label>
            <div className="flex items-center gap-3">
              <span
                className={`text-xs transition-colors font-mono ${
                  isAtLimit
                    ? 'text-red-600 font-bold'
                    : isNearLimit
                    ? 'text-amber-600 font-semibold'
                    : 'text-slate-400'
                }`}
              >
                {charCount} / 1,000
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md font-mono">
                <CornerDownLeft className="w-3 h-3" />
                Ctrl + Enter
              </span>
            </div>
          </div>

          <div className="relative">
            <textarea
              id="query-input"
              value={question}
              maxLength={1000}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
              className="w-full h-28 px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 placeholder-slate-400 resize-none transition-all shadow-2xs font-sans text-sm disabled:bg-slate-50 disabled:cursor-not-allowed"
              placeholder="Ask a question about your database (e.g. 'Show total salary expenditure by department', 'List active projects and team sizes')..."
            />

            {question && !loading && (
              <button
                type="button"
                onClick={() => onChange('')}
                className="absolute right-3 bottom-3 text-xs text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-100 transition-colors"
                title="Clear input"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Quick Sample Query Pills */}
        {sampleQueries.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-0.5">
            <span className="text-xs font-medium text-slate-500">Quick queries:</span>
            {sampleQueries.map((sample, idx) => (
              <button
                key={idx}
                type="button"
                disabled={loading}
                onClick={() => onSelectSample?.(sample)}
                className="text-xs bg-slate-100/80 hover:bg-slate-200/90 text-slate-700 px-2.5 py-1 rounded-md transition-all duration-150 border border-slate-200/60 active:scale-[0.98] disabled:opacity-50"
              >
                {sample}
              </button>
            ))}
          </div>
        )}

        {/* Submit Action */}
        <div className="flex items-center justify-between pt-1 border-t border-slate-100">
          <p className="text-xs text-slate-400">
            Defense-in-depth: Verified read-only execution with AST whitelist.
          </p>

          <button
            type="submit"
            disabled={loading || !question.trim()}
            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-medium py-2 px-5 rounded-lg transition-all duration-150 shadow-xs disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 text-sm cursor-pointer"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                <span>Executing...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Run Query</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};


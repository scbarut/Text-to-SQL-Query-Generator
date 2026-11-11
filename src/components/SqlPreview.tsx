import React, { useState } from 'react';
import { Terminal, Copy, Check, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';

export interface SqlPreviewProps {
  sql: string;
  explanation: string;
  defaultExpanded?: boolean;
}

export const SqlPreview: React.FC<SqlPreviewProps> = ({
  sql,
  explanation,
  defaultExpanded = true,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!sql) return;
    navigator.clipboard.writeText(sql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden transition-all duration-200">
      <div
        className="flex items-center justify-between px-6 py-4 bg-slate-50/80 border-b border-slate-200 cursor-pointer select-none hover:bg-slate-100/70 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsExpanded(!isExpanded);
          }
        }}
      >
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
            <Terminal className="w-4 h-4" />
          </div>
          <h2 className="text-sm font-bold text-slate-800">Generated SQL</h2>
          <span className="text-xs px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full font-medium">
            Verified SELECT
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-2xs hover:bg-slate-50 active:scale-[0.98] transition-all duration-150"
            title="Copy SQL to clipboard"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700 font-semibold">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-500" />
                <span>Copy SQL</span>
              </>
            )}
          </button>

          <span
            className="text-slate-400 hover:text-slate-600 p-1"
            aria-label={isExpanded ? 'Collapse SQL' : 'Expand SQL'}
          >
            {isExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </span>
        </div>
      </div>

      {isExpanded && (
        <div className="p-6 space-y-4 bg-white">
          {/* Explanation Banner */}
          <div className="bg-blue-50/70 border border-blue-100 rounded-lg p-3.5 text-sm text-slate-700 flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <span className="font-semibold text-blue-950">Explanation: </span>
              <span className="text-slate-700">{explanation}</span>
            </div>
          </div>

          {/* Syntax Code Block */}
          <div className="relative">
            <pre className="bg-slate-950 text-emerald-400 rounded-lg p-4.5 text-xs font-mono overflow-x-auto shadow-inner leading-relaxed border border-slate-900 selection:bg-emerald-950 selection:text-emerald-300">
              <code>{sql}</code>
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};


import React from 'react';
import { Database, PanelLeft, History, Sparkles } from 'lucide-react';

export interface NavbarProps {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  historyOpen: boolean;
  onToggleHistory: () => void;
  tableCount?: number;
  historyCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  sidebarOpen,
  onToggleSidebar,
  historyOpen,
  onToggleHistory,
  tableCount,
  historyCount = 0,
}) => {
  return (
    <header className="bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 py-3.5 sticky top-0 z-20 shadow-2xs">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        {/* Left Branding and Sidebar Trigger */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onToggleSidebar}
            title={sidebarOpen ? 'Collapse Schema Explorer' : 'Expand Schema Explorer'}
            className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 active:scale-[0.98] transition-all border border-slate-200"
            aria-label="Toggle Schema Explorer"
          >
            <PanelLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-gradient-to-tr from-blue-700 to-blue-600 rounded-lg text-white shadow-xs">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold tracking-tight text-slate-800">
                  Text-to-SQL Generator
                </h1>
                <span className="text-[11px] font-semibold px-2 py-0.2 bg-blue-50 text-blue-700 border border-blue-200/70 rounded-full">
                  v2.0
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-blue-500" />
                Gemini 2.5 Flash Lite &middot; Dynamic SQLite Schema &middot; Zero-Shot AST Security
              </p>
            </div>
          </div>
        </div>

        {/* Right Navigation Actions */}
        <div className="flex items-center gap-2">
          {/* Query History Toggle */}
          <button
            type="button"
            onClick={onToggleHistory}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-150 active:scale-[0.98] cursor-pointer ${
              historyOpen
                ? 'bg-blue-50 border-blue-300 text-blue-700 shadow-2xs'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900'
            }`}
            title="Toggle Query History"
          >
            <History className="w-3.5 h-3.5 text-blue-600" />
            <span className="hidden xs:inline">History</span>
            {historyCount > 0 && (
              <span className="px-1.5 py-0.2 bg-blue-100 text-blue-800 text-[10px] rounded-full font-bold">
                {historyCount}
              </span>
            )}
          </button>

          {/* Schema Explorer Toggle */}
          <button
            type="button"
            onClick={onToggleSidebar}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-150 active:scale-[0.98] cursor-pointer ${
              sidebarOpen
                ? 'bg-blue-50 border-blue-300 text-blue-700 shadow-2xs'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900'
            }`}
            title="Toggle Schema Explorer"
          >
            <Database className="w-3.5 h-3.5 text-blue-600" />
            <span className="hidden sm:inline">Schema Explorer</span>
            {tableCount !== undefined && (
              <span className="px-1.5 py-0.2 bg-blue-100 text-blue-800 text-[10px] rounded-full font-bold">
                {tableCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};


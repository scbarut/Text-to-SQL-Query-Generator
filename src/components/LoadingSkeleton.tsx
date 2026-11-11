import React from 'react';
import { Terminal, Table as TableIcon } from 'lucide-react';

export const LoadingSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 animate-pulse" aria-busy="true" aria-label="Loading query results">
      {/* SQL Preview Skeleton */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50/80 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-slate-300" />
            <div className="h-4 w-28 bg-slate-200 rounded-md" />
            <div className="h-4 w-24 bg-slate-100 rounded-full" />
          </div>
          <div className="h-6 w-20 bg-slate-200 rounded-md" />
        </div>
        <div className="p-6 space-y-4">
          {/* Explanation bar skeleton */}
          <div className="h-12 bg-blue-50/60 rounded-lg border border-blue-100/50" />
          {/* Code block skeleton */}
          <div className="h-24 bg-slate-900/10 rounded-lg" />
        </div>
      </div>

      {/* Results Table Skeleton */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <TableIcon className="w-4 h-4 text-slate-300" />
            <div className="h-4 w-24 bg-slate-200 rounded-md" />
            <div className="h-4 w-16 bg-slate-100 rounded-md" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-8 w-28 bg-slate-100 rounded-lg" />
            <div className="h-8 w-16 bg-slate-100 rounded-lg" />
          </div>
        </div>
        <div className="p-6 space-y-3">
          <div className="grid grid-cols-4 gap-4 pb-2 border-b border-slate-100">
            <div className="h-4 bg-slate-200 rounded-sm" />
            <div className="h-4 bg-slate-200 rounded-sm" />
            <div className="h-4 bg-slate-200 rounded-sm" />
            <div className="h-4 bg-slate-200 rounded-sm" />
          </div>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="grid grid-cols-4 gap-4 py-2 border-b border-slate-50">
              <div className="h-3.5 bg-slate-100 rounded-sm" />
              <div className="h-3.5 bg-slate-100 rounded-sm" />
              <div className="h-3.5 bg-slate-100 rounded-sm" />
              <div className="h-3.5 bg-slate-100 rounded-sm" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};


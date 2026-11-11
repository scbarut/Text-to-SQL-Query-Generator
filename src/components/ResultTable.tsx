import React, { useState, useMemo } from 'react';
import {
  Table as TableIcon,
  BarChart3,
  Search,
  FileSpreadsheet,
  FileCode,
  Info,
} from 'lucide-react';
import { ColumnMetadata } from './SchemaExplorer';

export interface ResultTableProps {
  columns: ColumnMetadata[];
  rows: (string | number | boolean | null)[][];
  totalCount: number;
  viewMode: 'table' | 'chart';
  onViewModeChange: (mode: 'table' | 'chart') => void;
  chartType?: string;
  onExportCsv: () => void;
  onExportJson: () => void;
}

export const ResultTable: React.FC<ResultTableProps> = ({
  columns,
  rows,
  totalCount,
  viewMode,
  onViewModeChange,
  chartType,
  onExportCsv,
  onExportJson,
}) => {
  const [filterText, setFilterText] = useState('');

  const filteredRows = useMemo(() => {
    if (!filterText.trim()) return rows;
    const q = filterText.toLowerCase();
    return rows.filter((row) =>
      row.some((cell) => cell !== null && String(cell).toLowerCase().includes(q))
    );
  }, [rows, filterText]);

  const isCappedAtLimit = totalCount > rows.length;

  return (
    <div className="space-y-4">
      {/* Action and View Control Bar */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 px-6 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
            <TableIcon className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-800">Query Results</h2>
              <span className="text-xs text-slate-500 font-medium">
                {isCappedAtLimit
                  ? `Displaying ${rows.length} of ${totalCount.toLocaleString('en-US')} rows`
                  : `(${rows.length} ${rows.length === 1 ? 'record' : 'records'})`}
              </span>
            </div>
            {isCappedAtLimit && (
              <span className="inline-flex items-center gap-1 text-[11px] text-amber-700 font-medium mt-0.5">
                <Info className="w-3 h-3 text-amber-600" />
                Automatic safeguard applied: results capped at 1,000 rows.
              </span>
            )}
          </div>
        </div>

        {/* View Mode Toggle Switch (Segmented Control) */}
        <div className="flex items-center justify-center">
          <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200/80">
            <button
              type="button"
              onClick={() => onViewModeChange('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all duration-150 active:scale-[0.98] ${
                viewMode === 'table'
                  ? 'bg-white text-blue-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>Table View</span>
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange('chart')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all duration-150 active:scale-[0.98] ${
                viewMode === 'chart'
                  ? 'bg-white text-blue-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Chart View</span>
              {chartType && chartType !== 'table' && (
                <span className="ml-1 text-[10px] px-1.5 py-0.2 bg-blue-100 text-blue-700 rounded-full font-bold uppercase">
                  {chartType}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Filter and Export Options */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {viewMode === 'table' && rows.length > 0 && (
            <div className="relative w-full sm:w-48">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                placeholder="Filter records..."
                className="w-full pl-7 pr-2.5 py-1 text-xs rounded-md border border-slate-200 focus:outline-hidden focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-slate-800"
              />
            </div>
          )}
          <button
            type="button"
            onClick={onExportCsv}
            disabled={rows.length === 0}
            className="flex items-center gap-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-2xs hover:bg-slate-50 active:scale-[0.98] transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Export dataset to CSV file"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>CSV</span>
          </button>
          <button
            type="button"
            onClick={onExportJson}
            disabled={rows.length === 0}
            className="flex items-center gap-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-2xs hover:bg-slate-50 active:scale-[0.98] transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Export dataset to JSON file"
          >
            <FileCode className="w-3.5 h-3.5 text-blue-600" />
            <span>JSON</span>
          </button>
        </div>
      </div>

      {/* Table Content */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
        {rows.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            No records found matching the query.
          </div>
        ) : filteredRows.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">
            No records match your filter &ldquo;{filterText}&rdquo;.
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-50/95 sticky top-0 z-10 backdrop-blur-xs">
                <tr>
                  {columns.map((col, idx) => (
                    <th
                      key={idx}
                      scope="col"
                      className="px-6 py-3 text-xs font-semibold text-slate-700 uppercase tracking-wider whitespace-nowrap"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>{col.name}</span>
                        <span className="text-[10px] lowercase px-1.5 py-0.5 rounded-sm bg-slate-200/70 text-slate-600 font-normal">
                          {col.type}
                        </span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-100">
                {filteredRows.map((row, rowIdx) => (
                  <tr
                    key={rowIdx}
                    className="hover:bg-blue-50/30 transition-colors"
                  >
                    {row.map((cell, cellIdx) => (
                      <td
                        key={cellIdx}
                        className="px-6 py-3.5 whitespace-nowrap text-slate-700 text-xs font-mono"
                      >
                        {cell === null ? (
                          <span className="text-slate-400 italic">null</span>
                        ) : typeof cell === 'boolean' ? (
                          <span
                            className={`px-1.5 py-0.5 rounded-sm text-[11px] font-medium ${
                              cell
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-rose-50 text-rose-700'
                            }`}
                          >
                            {cell ? 'true' : 'false'}
                          </span>
                        ) : (
                          String(cell)
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import {
  Database,
  RefreshCw,
  ChevronRight,
  ChevronDown,
  Key,
  Link2,
  Search,
  X,
  Layers,
  Sparkles,
} from 'lucide-react';

export interface ColumnMetadata {
  name: string;
  type: string;
  primary_key: boolean;
  nullable: boolean;
}

export interface ForeignKeyInfo {
  column: string;
  referred_table: string;
  referred_column: string;
}

export interface TableSchema {
  name: string;
  columns: ColumnMetadata[];
  foreign_keys: ForeignKeyInfo[];
  row_count: number | null;
  ddl: string;
}

export interface DatabaseSchemaResponse {
  database_name: string;
  tables: TableSchema[];
  ddl: string;
}

interface SchemaExplorerProps {
  isOpen: boolean;
  onClose: () => void;
  schema: DatabaseSchemaResponse | null;
  loading: boolean;
  refreshing: boolean;
  onRefresh: () => Promise<void>;
  onSelectQuery?: (query: string) => void;
}

export function SchemaExplorer({
  isOpen,
  onClose,
  schema,
  loading,
  refreshing,
  onRefresh,
  onSelectQuery,
}: SchemaExplorerProps) {
  const [search, setSearch] = useState('');
  const [expandedTables, setExpandedTables] = useState<Record<string, boolean>>({
    employees: true,
    departments: true,
    projects: false,
    employee_projects: false,
  });

  const toggleTable = (tableName: string) => {
    setExpandedTables((prev) => ({
      ...prev,
      [tableName]: !prev[tableName],
    }));
  };

  const filteredTables = React.useMemo(() => {
    if (!schema?.tables) return [];
    if (!search.trim()) return schema.tables;

    const term = search.toLowerCase();
    return schema.tables.filter((table) => {
      const tableNameMatches = table.name.toLowerCase().includes(term);
      const columnMatches = table.columns.some((col) =>
        col.name.toLowerCase().includes(term) || col.type.toLowerCase().includes(term)
      );
      return tableNameMatches || columnMatches;
    });
  }, [schema, search]);

  const totalRowCount = React.useMemo(() => {
    if (!schema?.tables) return 0;
    return schema.tables.reduce((sum, t) => sum + (t.row_count || 0), 0);
  }, [schema]);

  const getTypeBadgeClass = (type: string) => {
    const upper = type.toUpperCase();
    if (upper.includes('INT')) return 'bg-purple-50 text-purple-700 border-purple-200';
    if (upper.includes('REAL') || upper.includes('FLOAT') || upper.includes('NUMERIC'))
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (upper.includes('DATE') || upper.includes('TIME'))
      return 'bg-amber-50 text-amber-700 border-amber-200';
    return 'bg-blue-50 text-blue-700 border-blue-200';
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-30 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Panel */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-80 bg-white border-r border-slate-200 flex flex-col shadow-xl lg:shadow-none transition-transform duration-200 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-600 rounded-lg text-white shadow-xs">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-800 font-mono">
                  {schema?.database_name || 'sql_app.db'}
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded-full font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  SQLite
                </span>
              </div>
              <p className="text-[11px] text-slate-500">Dynamic Schema Explorer</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onRefresh}
              disabled={refreshing || loading}
              title="Refresh Schema from Database"
              className="p-1.5 rounded-md text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-blue-600' : ''}`} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 lg:hidden"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="p-3 border-b border-slate-100 bg-white">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter tables or columns..."
              className="w-full pl-8 pr-7 py-1.5 text-xs rounded-md border border-slate-200 focus:outline-hidden focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-slate-800 placeholder-slate-400"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Table & Column Tree */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {loading ? (
            <div className="space-y-3 p-2 animate-pulse">
              <div className="h-6 bg-slate-200 rounded-sm w-3/4" />
              <div className="h-4 bg-slate-100 rounded-sm w-full" />
              <div className="h-4 bg-slate-100 rounded-sm w-5/6" />
              <div className="h-6 bg-slate-200 rounded-sm w-2/3 pt-3" />
              <div className="h-4 bg-slate-100 rounded-sm w-4/5" />
            </div>
          ) : filteredTables.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500">
              {search ? 'No tables or columns match your search.' : 'No tables discovered.'}
            </div>
          ) : (
            filteredTables.map((table) => {
              const isExpanded = !!expandedTables[table.name];
              const fkMap = new Map(table.foreign_keys.map((fk) => [fk.column, fk]));

              return (
                <div
                  key={table.name}
                  className="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-2xs transition-shadow"
                >
                  {/* Table Header Row */}
                  <div
                    onClick={() => toggleTable(table.name)}
                    className="flex items-center justify-between px-3 py-2.5 bg-slate-50/80 hover:bg-slate-100/80 cursor-pointer select-none transition-colors border-b border-slate-100"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-slate-400">
                        {isExpanded ? (
                          <ChevronDown className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronRight className="w-3.5 h-3.5" />
                        )}
                      </span>
                      <Layers className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span className="text-xs font-semibold text-slate-800 font-mono truncate">
                        {table.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {table.row_count !== null && (
                        <span className="text-[10px] font-medium text-slate-500 bg-slate-200/70 px-1.5 py-0.5 rounded-full">
                          {table.row_count} {table.row_count === 1 ? 'row' : 'rows'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Expanded Columns List */}
                  {isExpanded && (
                    <div className="p-2 space-y-1 bg-white">
                      {onSelectQuery && (
                        <button
                          type="button"
                          onClick={() => onSelectQuery(`Show all records from ${table.name}`)}
                          className="w-full mb-1 flex items-center justify-center gap-1 text-[11px] font-medium text-blue-600 bg-blue-50/60 hover:bg-blue-100/70 border border-blue-200/50 py-1 px-2 rounded-md transition-colors"
                        >
                          <Sparkles className="w-3 h-3" />
                          <span>Query {table.name}</span>
                        </button>
                      )}

                      <div className="space-y-0.5">
                        {table.columns.map((col) => {
                          const fk = fkMap.get(col.name);

                          return (
                            <div
                              key={col.name}
                              className="flex items-center justify-between px-2 py-1 rounded-sm text-xs hover:bg-slate-50 transition-colors group"
                            >
                              <div className="flex items-center gap-1.5 min-w-0">
                                {col.primary_key ? (
                                  <span
                                    title="Primary Key"
                                    className="p-0.5 bg-amber-100 text-amber-700 rounded-sm shrink-0"
                                  >
                                    <Key className="w-2.5 h-2.5" />
                                  </span>
                                ) : fk ? (
                                  <span
                                    title={`Foreign Key -> ${fk.referred_table}.${fk.referred_column}`}
                                    className="p-0.5 bg-indigo-100 text-indigo-700 rounded-sm shrink-0"
                                  >
                                    <Link2 className="w-2.5 h-2.5" />
                                  </span>
                                ) : (
                                  <span className="w-3.5" />
                                )}
                                <span className="font-mono text-slate-700 truncate text-[11px]">
                                  {col.name}
                                </span>
                              </div>

                              <div className="flex items-center gap-1 shrink-0">
                                {fk && (
                                  <span
                                    title={`References ${fk.referred_table}.${fk.referred_column}`}
                                    className="text-[9px] font-mono text-indigo-600 bg-indigo-50 border border-indigo-200 px-1 rounded-sm"
                                  >
                                    FK→{fk.referred_table}
                                  </span>
                                )}
                                <span
                                  className={`text-[9px] font-mono font-medium border px-1 rounded-sm ${getTypeBadgeClass(
                                    col.type
                                  )}`}
                                >
                                  {col.type}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer Summary */}
        <div className="p-3 border-t border-slate-200 bg-slate-50 text-[11px] text-slate-500 flex items-center justify-between">
          <span>
            {schema?.tables.length || 0} tables • {totalRowCount} rows
          </span>
          <span className="text-[10px] text-slate-400 font-mono">sqlite_master</span>
        </div>
      </aside>
    </>
  );
}


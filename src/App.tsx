import React, { useState, useEffect, useCallback } from 'react';
import { Toaster, toast } from 'sonner';
import {
  Send,
  Database,
  Terminal,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  AlertTriangle,
  ShieldAlert,
  Table as TableIcon,
  Search,
  PanelLeft,
  BarChart3,
  FileSpreadsheet,
  FileCode,
} from 'lucide-react';
import {
  SchemaExplorer,
  DatabaseSchemaResponse,
  ColumnMetadata,
} from './components/SchemaExplorer';
import { ExampleQueries } from './components/ExampleQueries';
import { ChartView, AnalysisData } from './components/ChartView';
import { exportToCsv, exportToJson } from './utils/exportUtils';

interface QueryResponse {
  sql: string;
  explanation: string;
  columns: ColumnMetadata[];
  rows: (string | number | boolean | null)[][];
  total_count: number;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const SAMPLE_QUERIES = [
  'Calculate total salary by department',
  'List all active projects and team counts',
  'Show employees hired after 2021',
  'Find employees earning over $100,000',
];

interface InlineErrorState {
  title: string;
  message: string;
  isSecurityViolation: boolean;
}

export function App() {
  const [question, setQuestion] = useState('');
  const [result, setResult] = useState<QueryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [inlineError, setInlineError] = useState<InlineErrorState | null>(null);
  const [sqlExpanded, setSqlExpanded] = useState(true);
  const [copied, setCopied] = useState(false);
  const [filterText, setFilterText] = useState('');

  // Analysis & View states
  const [viewMode, setViewMode] = useState<'table' | 'chart'>('table');
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [customAnalyzing, setCustomAnalyzing] = useState(false);

  // Dynamic Schema Explorer states
  const [schema, setSchema] = useState<DatabaseSchemaResponse | null>(null);
  const [schemaLoading, setSchemaLoading] = useState(false);
  const [schemaRefreshing, setSchemaRefreshing] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const fetchSchema = useCallback(async () => {
    try {
      setSchemaLoading(true);
      const response = await fetch(`${API_BASE_URL}/schema`);
      if (response.ok) {
        const data: DatabaseSchemaResponse = await response.json();
        setSchema(data);
      }
    } catch (err) {
      console.error('Failed to fetch schema:', err);
    } finally {
      setSchemaLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSchema();
  }, [fetchSchema]);

  const handleRefreshSchema = async () => {
    try {
      setSchemaRefreshing(true);
      const response = await fetch(`${API_BASE_URL}/refresh-schema`, {
        method: 'POST',
      });
      if (response.ok) {
        const data: DatabaseSchemaResponse = await response.json();
        setSchema(data);
        toast.success('Schema Refreshed', {
          description: `Discovered ${data.tables.length} tables from ${data.database_name}.`,
        });
      } else {
        toast.error('Schema Refresh Failed', {
          description: 'Failed to refresh schema from database.',
        });
      }
    } catch (err: unknown) {
      console.error('Schema refresh error:', err);
      toast.error('Connection Error', {
        description: 'Failed to connect to backend to refresh schema.',
      });
    } finally {
      setSchemaRefreshing(false);
    }
  };

  const executeWithQuery = async (queryText: string) => {
    const cleanQuery = queryText.trim();
    if (!cleanQuery || loading) return;

    setQuestion(cleanQuery);

    try {
      setLoading(true);
      setInlineError(null);

      const response = await fetch(`${API_BASE_URL}/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question: cleanQuery }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const rawDetail = errorData?.detail;
        let detailMessage = `Server responded with status ${response.status}`;
        if (typeof rawDetail === 'string') {
          detailMessage = rawDetail;
        } else if (Array.isArray(rawDetail)) {
          detailMessage = rawDetail
            .map((item: { msg?: string }) => item?.msg || JSON.stringify(item))
            .join('; ');
        } else if (rawDetail && typeof rawDetail === 'object') {
          detailMessage = JSON.stringify(rawDetail);
        }

        if (response.status === 429) {
          toast.error('Rate Limit Exceeded', {
            description:
              detailMessage ||
              'You have exceeded the limit of 30 requests per minute. Please wait a moment and try again.',
          });
          return;
        }

        if (response.status >= 500) {
          toast.error('Server Error', {
            description:
              'The backend service encountered an unexpected error. Please retry shortly.',
          });
          return;
        }

        const isSecurity =
          detailMessage.toLowerCase().includes('security') ||
          detailMessage.toLowerCase().includes('injection') ||
          detailMessage.toLowerCase().includes('blocked') ||
          detailMessage.toLowerCase().includes('prohibited');

        setInlineError({
          title: isSecurity ? 'Security Violation' : 'Query Rejection',
          message: detailMessage,
          isSecurityViolation: isSecurity,
        });
        setResult(null);
        return;
      }

      const data: QueryResponse = await response.json();
      setResult(data);
      setInlineError(null);
      setFilterText('');
      fetchAnalysis(data.columns, data.rows, undefined, false);
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'Failed to connect to the backend server. Please verify it is running.';
      toast.error('Connection Error', {
        description: message,
      });
      console.error('Query execution error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalysis = useCallback(
    async (
      columns: ColumnMetadata[],
      rows: (string | number | boolean | null)[][],
      userRequest?: string,
      useLlm = false
    ) => {
      if (rows.length === 0) {
        setAnalysis(null);
        return;
      }
      try {
        if (useLlm) {
          setCustomAnalyzing(true);
        } else {
          setAnalysisLoading(true);
        }

        const response = await fetch(`${API_BASE_URL}/analyze`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            columns: columns.map((col) => ({ name: col.name, type: col.type })),
            rows,
            user_request: userRequest,
            use_llm: useLlm,
          }),
        });

        if (response.ok) {
          const data: AnalysisData = await response.json();
          setAnalysis(data);
          if (useLlm) {
            setViewMode('chart');
            toast.success('Visualization Updated', {
              description: `Generated ${data.chart_type} chart configuration.`,
            });
          }
        } else {
          if (useLlm) {
            toast.error('Visualization Failed', {
              description: 'Unable to customize visualization.',
            });
          }
        }
      } catch (err) {
        console.error('Failed to fetch analysis:', err);
      } finally {
        setAnalysisLoading(false);
        setCustomAnalyzing(false);
      }
    },
    []
  );

  const handleCustomAnalyze = async (userReq: string) => {
    if (!result) return;
    await fetchAnalysis(result.columns, result.rows, userReq, true);
  };

  const handleExportCsv = () => {
    if (!result || result.rows.length === 0) {
      toast.error('No Data', { description: 'There is no data to export.' });
      return;
    }
    try {
      exportToCsv(result.columns, result.rows, `query_results_${Date.now()}.csv`);
      toast.success('CSV Exported', { description: 'Results downloaded as CSV.' });
    } catch (err) {
      console.error('CSV export failed:', err);
      toast.error('Export Error', { description: 'Failed to export CSV.' });
    }
  };

  const handleExportJson = () => {
    if (!result || result.rows.length === 0) {
      toast.error('No Data', { description: 'There is no data to export.' });
      return;
    }
    try {
      exportToJson(result.columns, result.rows, `query_results_${Date.now()}.json`);
      toast.success('JSON Exported', { description: 'Results downloaded as JSON.' });
    } catch (err) {
      console.error('JSON export failed:', err);
      toast.error('Export Error', { description: 'Failed to export JSON.' });
    }
  };

  const handleExecuteQuery = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    await executeWithQuery(question);
  };

  const handleSelectExampleQuery = (queryText: string, executeImmediately = false) => {
    setQuestion(queryText);
    if (inlineError) setInlineError(null);
    if (executeImmediately) {
      executeWithQuery(queryText);
    }
  };

  const handleCopySql = () => {
    if (!result?.sql) return;
    navigator.clipboard.writeText(result.sql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredRows = React.useMemo(() => {
    if (!result || !filterText.trim()) return result?.rows || [];
    const query = filterText.toLowerCase();
    return result.rows.filter((row) =>
      row.some((cell) => cell !== null && String(cell).toLowerCase().includes(query))
    );
  }, [result, filterText]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      <Toaster richColors position="top-right" />

      {/* Schema Explorer Sidebar */}
      <SchemaExplorer
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        schema={schema}
        loading={schemaLoading}
        refreshing={schemaRefreshing}
        onRefresh={handleRefreshSchema}
        onSelectQuery={(q) => handleSelectExampleQuery(q, true)}
      />

      {/* Main Content with dynamic sidebar margin */}
      <div
        className={`transition-all duration-200 ease-in-out ${
          sidebarOpen ? 'lg:pl-80' : 'pl-0'
        }`}
      >
        {/* Top Navigation Bar */}
        <nav className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-20 shadow-xs">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                title={sidebarOpen ? 'Collapse Schema Explorer' : 'Expand Schema Explorer'}
                className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors border border-slate-200"
              >
                <PanelLeft className="w-4 h-4" />
              </button>

              <div className="p-2 bg-blue-600 rounded-lg text-white shadow-xs">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-lg font-bold tracking-tight text-slate-800 flex items-center gap-2">
                  Text-to-SQL Generator
                  <span className="text-xs font-semibold px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-full">
                    v2.0
                  </span>
                </h1>
                <p className="text-xs text-slate-500">
                  Powered by Gemini 2.5 Flash Lite & Dynamic SQLite Schema
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                  sidebarOpen
                    ? 'bg-blue-50 border-blue-200 text-blue-700 shadow-2xs'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Database className="w-3.5 h-3.5 text-blue-600" />
                <span>Schema Explorer</span>
                {schema?.tables && (
                  <span className="px-1.5 py-0.2 bg-blue-100 text-blue-800 text-[10px] rounded-full font-bold">
                    {schema.tables.length}
                  </span>
                )}
              </button>
            </div>
          </div>
        </nav>

        {/* Main Container */}
        <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 space-y-6">
          {/* Input Card */}
          <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-6">
            <form onSubmit={handleExecuteQuery} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label
                    htmlFor="query-input"
                    className="text-sm font-semibold text-slate-700 flex items-center gap-1.5"
                  >
                    <Sparkles className="w-4 h-4 text-blue-600" />
                    Natural Language Query
                  </label>
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-xs ${
                        question.length >= 1000
                          ? 'text-red-600 font-semibold'
                          : question.length > 900
                          ? 'text-amber-600 font-medium'
                          : 'text-slate-400'
                      }`}
                    >
                      {question.length} / 1,000
                    </span>
                    <span className="text-xs text-slate-400">
                      Ctrl + Enter to run
                    </span>
                  </div>
                </div>
                <textarea
                  id="query-input"
                  value={question}
                  maxLength={1000}
                  onChange={(e) => {
                    setQuestion(e.target.value);
                    if (inlineError) setInlineError(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                      e.preventDefault();
                      handleExecuteQuery();
                    }
                  }}
                  className="w-full h-28 px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-800 placeholder-slate-400 resize-none transition-all shadow-inner font-sans text-sm"
                  placeholder="Ask a question about your relational database (e.g. 'Show total salary expenditure by department', 'List active projects and team sizes')..."
                />
              </div>

              {/* Example Query Quick Pills */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-xs font-medium text-slate-500">Quick queries:</span>
                {SAMPLE_QUERIES.map((sample, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectExampleQuery(sample, false)}
                    className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded-md transition-colors border border-slate-200/60"
                  >
                    {sample}
                  </button>
                ))}
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={loading || !question.trim()}
                  className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-6 rounded-lg transition-colors shadow-xs disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                      <span>Executing Query...</span>
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

          {/* Inline Warning Banner for Query Rejections / Security Violations */}
          {inlineError && (
            <div
              className={`rounded-xl p-4 flex items-start gap-3 shadow-xs animate-in fade-in border ${
                inlineError.isSecurityViolation
                  ? 'bg-amber-50/90 border-amber-300 text-amber-900'
                  : 'bg-red-50/90 border-red-200 text-red-900'
              }`}
            >
              {inlineError.isSecurityViolation ? (
                <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <h3
                  className={`text-sm font-semibold ${
                    inlineError.isSecurityViolation ? 'text-amber-900' : 'text-red-800'
                  }`}
                >
                  {inlineError.title}
                </h3>
                <p
                  className={`text-sm mt-1 leading-relaxed ${
                    inlineError.isSecurityViolation ? 'text-amber-800' : 'text-red-700'
                  }`}
                >
                  {inlineError.message}
                </p>
                {inlineError.isSecurityViolation && (
                  <p className="text-xs text-amber-700/80 mt-2 font-medium">
                    Defense-in-depth policy active: destructive keywords, multi-statement queries, and prompt injection signatures are blocked.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Loading Skeleton */}
          {loading && (
            <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-6 space-y-4 animate-pulse">
              <div className="h-4 bg-slate-200 rounded-sm w-1/4" />
              <div className="h-20 bg-slate-100 rounded-sm" />
              <div className="h-4 bg-slate-200 rounded-sm w-1/3 pt-4" />
              <div className="h-40 bg-slate-100 rounded-sm" />
            </div>
          )}

          {/* Result Container */}
          {result && !loading && (
            <div className="space-y-6">
              {/* Generated SQL Panel (Collapsible, Expanded by default) */}
              <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
                <div
                  className="flex items-center justify-between px-6 py-4 bg-slate-50/80 border-b border-slate-200 cursor-pointer select-none"
                  onClick={() => setSqlExpanded(!sqlExpanded)}
                >
                  <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-blue-600" />
                    <h2 className="text-sm font-bold text-slate-800">
                      Generated SQL
                    </h2>
                    <span className="text-xs px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full font-medium">
                      Verified SELECT
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopySql();
                      }}
                      className="flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-2 py-1 rounded-sm shadow-2xs transition-colors"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-600 font-medium">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy SQL</span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      className="text-slate-400 hover:text-slate-600 p-1"
                      aria-label={sqlExpanded ? 'Collapse SQL' : 'Expand SQL'}
                    >
                      {sqlExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {sqlExpanded && (
                  <div className="p-6 space-y-4 bg-white">
                    {/* Explanation */}
                    <div className="bg-blue-50/60 border border-blue-100 rounded-lg p-3.5 text-sm text-slate-700 flex items-start gap-2.5">
                      <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold text-blue-900">Explanation: </span>
                        <span>{result.explanation}</span>
                      </div>
                    </div>

                    {/* SQL Code Block */}
                    <div className="relative">
                      <pre className="bg-slate-900 text-emerald-400 rounded-lg p-4 text-xs font-mono overflow-x-auto shadow-inner leading-relaxed">
                        <code>{result.sql}</code>
                      </pre>
                    </div>
                  </div>
                )}
              </div>

              {/* Query Results Section with Table/Chart Toggle and Export Options */}
              <div className="space-y-4">
                {/* Results Action & View Bar */}
                <div className="bg-white rounded-xl shadow-xs border border-slate-200 px-6 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <TableIcon className="w-4 h-4 text-blue-600" />
                    <h2 className="text-sm font-bold text-slate-800">
                      Query Results
                    </h2>
                    <span className="text-xs text-slate-500 font-medium">
                      ({result.total_count} {result.total_count === 1 ? 'record' : 'records'})
                    </span>
                  </div>

                  {/* View Mode Toggle Switch */}
                  <div className="flex items-center justify-center">
                    <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
                      <button
                        type="button"
                        onClick={() => setViewMode('table')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
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
                        onClick={() => setViewMode('chart')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                          viewMode === 'chart'
                            ? 'bg-white text-blue-700 shadow-2xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <BarChart3 className="w-3.5 h-3.5" />
                        <span>Chart View</span>
                        {analysis?.chart_type && analysis.chart_type !== 'table' && (
                          <span className="ml-1 text-[10px] px-1.5 py-0.2 bg-blue-100 text-blue-700 rounded-full font-bold uppercase">
                            {analysis.chart_type}
                          </span>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Export Options & Filter */}
                  <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                    {viewMode === 'table' && result.rows.length > 0 && (
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
                      onClick={handleExportCsv}
                      className="flex items-center gap-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 bg-white border border-slate-200 px-2.5 py-1.5 rounded-lg shadow-2xs hover:bg-slate-50 transition-colors"
                      title="Export dataset to CSV file"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                      <span>CSV</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleExportJson}
                      className="flex items-center gap-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 bg-white border border-slate-200 px-2.5 py-1.5 rounded-lg shadow-2xs hover:bg-slate-50 transition-colors"
                      title="Export dataset to JSON file"
                    >
                      <FileCode className="w-3.5 h-3.5 text-blue-600" />
                      <span>JSON</span>
                    </button>
                  </div>
                </div>

                {/* View Content (Table or Chart) */}
                {viewMode === 'chart' ? (
                  <ChartView
                    analysis={analysis}
                    loading={analysisLoading}
                    onCustomAnalyze={handleCustomAnalyze}
                    isAnalyzing={customAnalyzing}
                  />
                ) : (
                  <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
                    {result.rows.length === 0 ? (
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
                          <thead className="bg-slate-50/90 sticky top-0 z-10 backdrop-blur-xs">
                            <tr>
                              {result.columns.map((col, idx) => (
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
                )}
              </div>
            </div>
          )}

          {/* Example Query Cards */}
          <div className="pt-4">
            <ExampleQueries
              onSelectQuery={handleSelectExampleQuery}
              disabled={loading}
            />
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;

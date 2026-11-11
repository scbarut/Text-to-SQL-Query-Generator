import { useState, useCallback } from 'react';
import { Toaster, toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { Navbar } from './components/Navbar';
import { SchemaExplorer } from './components/SchemaExplorer';
import { QueryHistory } from './components/QueryHistory';
import { QueryInput } from './components/QueryInput';
import { SqlPreview } from './components/SqlPreview';
import { ResultTable } from './components/ResultTable';
import { ChartView, AnalysisData } from './components/ChartView';
import { ExampleQueries } from './components/ExampleQueries';
import { InlineError } from './components/InlineError';
import { LoadingSkeleton } from './components/LoadingSkeleton';

import {
  fetchSchemaApi,
  refreshSchemaApi,
  executeQueryApi,
  analyzeQueryApi,
  QueryResponse,
  AppApiError,
} from './services/api';
import { saveQueryToHistory, loadQueryHistory } from './utils/historyStorage';
import { exportToCsv, exportToJson } from './utils/exportUtils';

interface InlineErrorState {
  title: string;
  message: string;
  isSecurityViolation: boolean;
}

export function App() {
  const queryClient = useQueryClient();

  // Primary Workspace States
  const [question, setQuestion] = useState('');
  const [result, setResult] = useState<QueryResponse | null>(null);
  const [inlineError, setInlineError] = useState<InlineErrorState | null>(null);

  // Visualization & View States
  const [viewMode, setViewMode] = useState<'table' | 'chart'>('table');
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);

  // Sidebars & Panels
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyUpdated, setHistoryUpdated] = useState<number>(Date.now());

  // 1. TanStack Query: Dynamic Schema Discovery
  const {
    data: schema,
    isLoading: schemaLoading,
  } = useQuery({
    queryKey: ['schema'],
    queryFn: fetchSchemaApi,
  });

  // 2. TanStack Mutation: Schema Refresh
  const refreshSchemaMutation = useMutation({
    mutationFn: refreshSchemaApi,
    onSuccess: (data) => {
      queryClient.setQueryData(['schema'], data);
      toast.success('Schema Refreshed', {
        description: `Discovered ${data.tables.length} tables from ${data.database_name}.`,
      });
    },
    onError: (error: AppApiError | Error) => {
      console.error('Schema refresh error:', error);
      toast.error('Schema Refresh Failed', {
        description: error.message || 'Failed to refresh schema from database.',
      });
    },
  });

  // 3. TanStack Mutation: Analysis Engine (Heuristic or LLM)
  const analyzeMutation = useMutation({
    mutationFn: analyzeQueryApi,
    onSuccess: (data, variables) => {
      setAnalysis(data);
      if (variables.use_llm) {
        setViewMode('chart');
        toast.success('Visualization Updated', {
          description: `Generated ${data.chart_type} chart configuration.`,
        });
      }
    },
    onError: (error: AppApiError | Error, variables) => {
      console.error('Analysis error:', error);
      if (variables.use_llm) {
        toast.error('Visualization Failed', {
          description: error.message || 'Unable to customize visualization.',
        });
      }
    },
  });

  // 4. TanStack Mutation: Secure Query Execution
  const executeQueryMutation = useMutation({
    mutationFn: executeQueryApi,
    onSuccess: (data, submittedQuestion) => {
      setResult(data);
      setInlineError(null);

      // Persist to local storage query history
      saveQueryToHistory({
        question: submittedQuestion,
        sql: data.sql,
        rowCount: data.total_count,
        status: 'success',
      });
      setHistoryUpdated(Date.now());

      // Trigger automatic zero-latency heuristic chart analysis
      if (data.rows.length > 0) {
        analyzeMutation.mutate({
          columns: data.columns,
          rows: data.rows,
          use_llm: false,
        });
      } else {
        setAnalysis(null);
      }
    },
    onError: (error: AppApiError | Error, submittedQuestion) => {
      console.error('Query execution error:', error);

      if (error instanceof AppApiError) {
        const { apiError } = error;
        if (apiError.isRateLimit) {
          toast.error('Rate Limit Exceeded', {
            description: apiError.message,
          });
        } else if (apiError.isServerError) {
          toast.error('Server Error', {
            description:
              'The backend service encountered an unexpected error. Please retry shortly.',
          });
        } else {
          setInlineError({
            title: apiError.title,
            message: apiError.message,
            isSecurityViolation: apiError.isSecurityViolation,
          });
        }
      } else {
        toast.error('Connection Error', {
          description:
            error.message ||
            'Failed to connect to the backend server. Please verify it is running.',
        });
      }

      // Persist failed attempt to query history
      saveQueryToHistory({
        question: submittedQuestion,
        status: 'error',
        errorMessage: error.message,
      });
      setHistoryUpdated(Date.now());
      setResult(null);
    },
  });

  const handleExecute = useCallback((customQuestion?: string) => {
    const targetQuestion = (customQuestion ?? question).trim();
    if (!targetQuestion || executeQueryMutation.isPending) return;

    if (customQuestion) {
      setQuestion(targetQuestion);
    }
    setInlineError(null);
    executeQueryMutation.mutate(targetQuestion);
  }, [question, executeQueryMutation]);

  const handleSelectQuery = useCallback(
    (queryText: string, executeImmediately = false) => {
      const clean = queryText.trim();
      setQuestion(clean);
      setInlineError(null);
      if (executeImmediately) {
        handleExecute(clean);
      }
    },
    [handleExecute]
  );

  const handleCustomAnalyze = async (userRequest: string): Promise<void> => {
    if (!result || result.rows.length === 0) return;
    try {
      await analyzeMutation.mutateAsync({
        columns: result.columns,
        rows: result.rows,
        user_request: userRequest,
        use_llm: true,
      });
    } catch {
      // Handled by mutation onError callback
    }
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

  const historyItemsCount = loadQueryHistory().length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16 antialiased selection:bg-blue-100 selection:text-blue-900">
      <Toaster richColors position="top-right" />

      {/* Schema Explorer Sidebar (Left) */}
      <SchemaExplorer
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        schema={schema || null}
        loading={schemaLoading}
        refreshing={refreshSchemaMutation.isPending}
        onRefresh={async () => {
          try {
            await refreshSchemaMutation.mutateAsync();
          } catch {
            // Handled by mutation onError callback
          }
        }}
        onSelectQuery={(q) => handleSelectQuery(q, true)}
      />

      {/* Query History Drawer (Right) */}
      <QueryHistory
        isOpen={historyOpen}
        onClose={() => setHistoryOpen(false)}
        onSelectQuery={handleSelectQuery}
        lastUpdated={historyUpdated}
      />

      {/* Backdrop overlay for mobile when History drawer is open */}
      {historyOpen && (
        <div
          className="fixed inset-0 bg-slate-900/30 z-25 backdrop-blur-2xs transition-opacity sm:hidden"
          onClick={() => setHistoryOpen(false)}
        />
      )}

      {/* Main Content Area */}
      <div
        className={`transition-all duration-200 ease-in-out ${sidebarOpen ? 'lg:pl-80' : 'pl-0'
          }`}
      >
        {/* Navigation Bar */}
        <Navbar
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
          historyOpen={historyOpen}
          onToggleHistory={() => setHistoryOpen((prev) => !prev)}
          tableCount={schema?.tables?.length}
          historyCount={historyItemsCount}
        />

        {/* Central Workspace Container */}
        <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 space-y-6">
          {/* Query Input Card */}
          <QueryInput
            question={question}
            onChange={(val) => {
              setQuestion(val);
              if (inlineError) setInlineError(null);
            }}
            onSubmit={() => handleExecute()}
            loading={executeQueryMutation.isPending}
            onSelectSample={(sample) => handleSelectQuery(sample, false)}
          />

          {/* Inline Error Banner for Security Violations / AST Rejections */}
          {inlineError && (
            <InlineError
              title={inlineError.title}
              message={inlineError.message}
              isSecurityViolation={inlineError.isSecurityViolation}
              onDismiss={() => setInlineError(null)}
            />
          )}

          {/* Responsive Loading Skeleton */}
          {executeQueryMutation.isPending && <LoadingSkeleton />}

          {/* Query Results and Visualizations */}
          {result && !executeQueryMutation.isPending && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Generated SQL Preview */}
              <SqlPreview
                sql={result.sql}
                explanation={result.explanation}
              />

              {/* View Container: Table or Chart */}
              {viewMode === 'chart' ? (
                <div className="space-y-4">
                  {/* Results Action Bar */}
                  <ResultTable
                    columns={result.columns}
                    rows={result.rows}
                    totalCount={result.total_count}
                    viewMode={viewMode}
                    onViewModeChange={setViewMode}
                    chartType={analysis?.chart_type}
                    onExportCsv={handleExportCsv}
                    onExportJson={handleExportJson}
                  />

                  {/* Interactive Chart Component */}
                  <ChartView
                    analysis={analysis}
                    loading={analyzeMutation.isPending && !analyzeMutation.variables?.use_llm}
                    onCustomAnalyze={handleCustomAnalyze}
                    isAnalyzing={analyzeMutation.isPending && !!analyzeMutation.variables?.use_llm}
                  />
                </div>
              ) : (
                <ResultTable
                  columns={result.columns}
                  rows={result.rows}
                  totalCount={result.total_count}
                  viewMode={viewMode}
                  onViewModeChange={setViewMode}
                  chartType={analysis?.chart_type}
                  onExportCsv={handleExportCsv}
                  onExportJson={handleExportJson}
                />
              )}
            </div>
          )}

          {/* Example Query Gallery */}
          <div className="pt-2">
            <ExampleQueries
              onSelectQuery={handleSelectQuery}
              disabled={executeQueryMutation.isPending}
            />
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;

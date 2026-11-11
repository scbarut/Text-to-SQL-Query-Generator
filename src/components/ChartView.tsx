import React, { useRef, useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import {
  BarChart3,
  LineChart as LineChartIcon,
  PieChart as PieChartIcon,
  Activity,
  Download,
  Sparkles,
  Send,
  Loader2,
  TrendingUp,
} from 'lucide-react';
import { exportChartToPng } from '../utils/exportUtils';
import { toast } from 'sonner';

export interface AnalysisData {
  chart_type: 'bar' | 'line' | 'pie' | 'area' | 'stat' | 'table' | string;
  x_key?: string | null;
  y_keys: string[];
  title: string;
  insight: string;
  stat_value?: string | number | boolean | null;
  stat_label?: string | null;
  data: Record<string, unknown>[];
}

interface ChartViewProps {
  analysis: AnalysisData | null;
  loading: boolean;
  onCustomAnalyze: (userRequest: string) => Promise<void>;
  isAnalyzing: boolean;
}

const PALETTE = [
  '#2563eb', // blue-600
  '#7c3aed', // violet-600
  '#059669', // emerald-600
  '#d97706', // amber-600
  '#e11d48', // rose-600
  '#0891b2', // cyan-600
  '#4f46e5', // indigo-600
  '#db2777', // pink-600
];

export const ChartView: React.FC<ChartViewProps> = ({
  analysis,
  loading,
  onCustomAnalyze,
  isAnalyzing,
}) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const [customRequest, setCustomRequest] = useState('');
  const [exportingPng, setExportingPng] = useState(false);

  const handleExportPng = async () => {
    if (!chartRef.current) return;
    try {
      setExportingPng(true);
      await exportChartToPng(chartRef.current, `chart_${analysis?.chart_type || 'export'}.png`);
      toast.success('Chart Exported', {
        description: 'PNG image downloaded successfully.',
      });
    } catch (err) {
      console.error('PNG export failed:', err);
      toast.error('Export Failed', {
        description: 'Failed to capture chart as PNG image.',
      });
    } finally {
      setExportingPng(false);
    }
  };

  const handleCustomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customRequest.trim() || isAnalyzing) return;
    await onCustomAnalyze(customRequest.trim());
    setCustomRequest('');
  };

  if (loading) {
    return (
      <div className="p-12 flex flex-col items-center justify-center space-y-3 bg-white rounded-xl border border-slate-200">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        <p className="text-sm font-medium text-slate-600">Analyzing query results...</p>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="p-12 text-center text-slate-500 bg-white rounded-xl border border-slate-200">
        No visualization available. Run a query to generate charts.
      </div>
    );
  }

  const { chart_type, x_key, y_keys, title, insight, stat_value, stat_label, data } = analysis;
  const primaryY = y_keys[0];

  const getChartIcon = () => {
    switch (chart_type) {
      case 'line':
        return <LineChartIcon className="w-4 h-4 text-blue-600" />;
      case 'pie':
        return <PieChartIcon className="w-4 h-4 text-purple-600" />;
      case 'area':
        return <Activity className="w-4 h-4 text-emerald-600" />;
      case 'stat':
        return <TrendingUp className="w-4 h-4 text-amber-600" />;
      case 'bar':
      default:
        return <BarChart3 className="w-4 h-4 text-blue-600" />;
    }
  };

  const formatValue = (val: unknown): string => {
    if (typeof val === 'number') {
      return val.toLocaleString();
    }
    return String(val ?? '');
  };

  return (
    <div className="space-y-4">
      {/* Insight Summary Banner */}
      {insight && (
        <div className="bg-gradient-to-r from-blue-50/80 via-indigo-50/50 to-white border border-blue-200/80 rounded-xl p-4 flex items-start gap-3 shadow-xs">
          <div className="p-2 bg-blue-100 rounded-lg text-blue-700 shrink-0 mt-0.5">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="flex-1">
            <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wider mb-1">
              Analytical Insight
            </h4>
            <p className="text-sm text-slate-800 leading-relaxed font-medium">
              {insight}
            </p>
          </div>
        </div>
      )}

      {/* Main Chart Card */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
        {/* Card Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-white border border-slate-200 rounded-lg shadow-2xs">
              {getChartIcon()}
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">{title || 'Visualization'}</h3>
              <p className="text-xs text-slate-500">
                Type:{' '}
                <span className="font-semibold text-slate-700 capitalize">
                  {chart_type === 'stat' ? 'Stat Card' : `${chart_type} Chart`}
                </span>
                {x_key && (
                  <span className="ml-2 text-slate-400">
                    • Axis: <span className="font-medium text-slate-600">{x_key}</span>
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportPng}
              disabled={exportingPng}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs disabled:opacity-50"
              title="Export visualization as PNG image"
            >
              {exportingPng ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
              ) : (
                <Download className="w-3.5 h-3.5 text-slate-500" />
              )}
              <span>Export PNG</span>
            </button>
          </div>
        </div>

        {/* Chart Canvas Area */}
        <div ref={chartRef} className="p-6 bg-white min-h-[360px] flex items-center justify-center">
          {chart_type === 'stat' ? (
            <div className="w-full py-10 flex flex-col items-center justify-center text-center">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                {stat_label?.replace('_', ' ') || title}
              </span>
              <div className="text-5xl font-extrabold text-blue-600 font-mono tracking-tight">
                {formatValue(stat_value)}
              </div>
              <div className="mt-4 px-3 py-1 bg-blue-50 border border-blue-200 rounded-full text-xs font-semibold text-blue-700 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Single Metric Aggregate</span>
              </div>
            </div>
          ) : chart_type === 'pie' && x_key && primaryY ? (
            <div className="w-full h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip
                    formatter={(val: unknown) => [formatValue(val), primaryY]}
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderColor: '#e2e8f0',
                      borderRadius: '0.5rem',
                      fontSize: '12px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    }}
                  />
                  <Legend verticalAlign="bottom" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <Pie
                    data={data}
                    dataKey={primaryY}
                    nameKey={x_key}
                    cx="50%"
                    cy="50%"
                    outerRadius={110}
                    innerRadius={50}
                    paddingAngle={2}
                    label={({ name, value }: { name?: unknown; value?: unknown }) =>
                      `${String(name ?? '')}: ${formatValue(value)}`
                    }
                  >
                    {data.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={PALETTE[index % PALETTE.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : chart_type === 'line' && x_key && primaryY ? (
            <div className="w-full h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis
                    dataKey={x_key}
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    tickLine={{ stroke: '#cbd5e1' }}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    tickLine={{ stroke: '#cbd5e1' }}
                    tickFormatter={formatValue}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderColor: '#e2e8f0',
                      borderRadius: '0.5rem',
                      fontSize: '12px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    }}
                    formatter={(val: unknown, name?: unknown) => [formatValue(val), String(name || '')]}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  {y_keys.map((yKey, index) => (
                    <Line
                      key={yKey}
                      type="monotone"
                      dataKey={yKey}
                      stroke={PALETTE[index % PALETTE.length]}
                      strokeWidth={2.5}
                      dot={{ r: 4, strokeWidth: 1.5, fill: '#ffffff' }}
                      activeDot={{ r: 6 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : chart_type === 'area' && x_key && primaryY ? (
            <div className="w-full h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <defs>
                    {y_keys.map((yKey, index) => (
                      <linearGradient
                        key={`color-${yKey}`}
                        id={`area-grad-${yKey}`}
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop offset="5%" stopColor={PALETTE[index % PALETTE.length]} stopOpacity={0.6} />
                        <stop offset="95%" stopColor={PALETTE[index % PALETTE.length]} stopOpacity={0.05} />
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis
                    dataKey={x_key}
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    tickLine={{ stroke: '#cbd5e1' }}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    tickLine={{ stroke: '#cbd5e1' }}
                    tickFormatter={formatValue}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderColor: '#e2e8f0',
                      borderRadius: '0.5rem',
                      fontSize: '12px',
                    }}
                    formatter={(val: unknown, name?: unknown) => [formatValue(val), String(name || '')]}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  {y_keys.map((yKey, index) => (
                    <Area
                      key={yKey}
                      type="monotone"
                      dataKey={yKey}
                      stroke={PALETTE[index % PALETTE.length]}
                      strokeWidth={2}
                      fillOpacity={1}
                      fill={`url(#area-grad-${yKey})`}
                    />
                  ))}
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : chart_type === 'table' || !primaryY ? (
            <div className="text-center py-10 space-y-2">
              <p className="text-sm font-medium text-slate-700">
                This query returns categorical records best viewed in the Table View.
              </p>
              <p className="text-xs text-slate-500">
                Switch to the Table tab above to browse the complete tabular dataset.
              </p>
            </div>
          ) : (
            // Default to Bar Chart
            <div className="w-full h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis
                    dataKey={x_key || undefined}
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    tickLine={{ stroke: '#cbd5e1' }}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    tickLine={{ stroke: '#cbd5e1' }}
                    tickFormatter={formatValue}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderColor: '#e2e8f0',
                      borderRadius: '0.5rem',
                      fontSize: '12px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    }}
                    formatter={(val: unknown, name?: unknown) => [formatValue(val), String(name || '')]}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  {y_keys.map((yKey, index) => (
                    <Bar
                      key={yKey}
                      dataKey={yKey}
                      fill={PALETTE[index % PALETTE.length]}
                      radius={[4, 4, 0, 0]}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Natural Language Custom Visualization Command Bar */}
        <div className="px-6 py-3.5 bg-slate-50/80 border-t border-slate-200">
          <form onSubmit={handleCustomSubmit} className="flex items-center gap-2">
            <div className="relative flex-1">
              <Sparkles className="w-3.5 h-3.5 text-blue-600 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={customRequest}
                onChange={(e) => setCustomRequest(e.target.value)}
                placeholder="Ask Gemini to customize chart (e.g. 'Show as area chart', 'Display budget share as pie')..."
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-800 bg-white shadow-2xs"
                disabled={isAnalyzing}
              />
            </div>
            <button
              type="submit"
              disabled={isAnalyzing || !customRequest.trim()}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-2xs disabled:opacity-50"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Customizing...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Customize</span>
                </>
              )}
            </button>
          </form>
          <div className="flex items-center gap-2 mt-2 pt-1">
            <span className="text-[11px] text-slate-400">Quick commands:</span>
            {['Show as pie chart', 'Show as line chart', 'Show as area chart', 'Compare values as bar chart'].map(
              (prompt, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => onCustomAnalyze(prompt)}
                  disabled={isAnalyzing}
                  className="text-[11px] text-slate-600 hover:text-blue-700 bg-white hover:bg-blue-50/60 border border-slate-200 px-2 py-0.5 rounded-md transition-colors"
                >
                  {prompt}
                </button>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
};


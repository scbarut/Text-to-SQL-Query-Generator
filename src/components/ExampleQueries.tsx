import { Sparkles, ArrowRight, Layers, BarChart3, Filter, Briefcase } from 'lucide-react';

export interface ExampleQueryItem {
  id: string;
  title: string;
  query: string;
  category: 'Relational JOIN' | 'Aggregation' | 'Filtering' | 'Analytics';
  description: string;
  tables: string[];
}

export const EXAMPLE_QUERIES: ExampleQueryItem[] = [
  {
    id: 'dept-payroll',
    title: 'Total Payroll by Department',
    query: 'Calculate the total and average salary for each department',
    category: 'Aggregation',
    description: 'Aggregates employee compensation joined with department names.',
    tables: ['departments', 'employees'],
  },
  {
    id: 'active-projects-staffing',
    title: 'Active Projects & Team Sizes',
    query: 'List all active projects and the number of employees assigned to each',
    category: 'Relational JOIN',
    description: 'Relational multi-table JOIN across projects and assignments with COUNT.',
    tables: ['projects', 'employee_projects'],
  },
  {
    id: 'employee-directory',
    title: 'Employee Directory with Departments',
    query: 'Show each employee full name, email, department name, and hire date',
    category: 'Relational JOIN',
    description: 'Standard relational JOIN between employee profiles and department metadata.',
    tables: ['employees', 'departments'],
  },
  {
    id: 'high-earners-engineering',
    title: 'High Earners in Engineering',
    query: 'Find employees in Engineering with a salary greater than 100000',
    category: 'Filtering',
    description: 'Multi-criteria filter pairing department name with numerical salary thresholds.',
    tables: ['employees', 'departments'],
  },
  {
    id: 'project-leaders',
    title: 'Project Managers & Technical Leads',
    query: 'List all project managers and lead architects with their assigned project names',
    category: 'Relational JOIN',
    description: '3-table JOIN linking employees to projects via assignment roles.',
    tables: ['employees', 'employee_projects', 'projects'],
  },
  {
    id: 'department-budgets',
    title: 'Department Budgets & Locations',
    query: 'Show all departments ordered by budget descending with their office location',
    category: 'Analytics',
    description: 'Ranks corporate departments by fiscal budget allocation.',
    tables: ['departments'],
  },
];

interface ExampleQueriesProps {
  onSelectQuery: (query: string, executeImmediately?: boolean) => void;
  disabled?: boolean;
}

export function ExampleQueries({ onSelectQuery, disabled = false }: ExampleQueriesProps) {
  const getCategoryBadge = (category: ExampleQueryItem['category']) => {
    switch (category) {
      case 'Relational JOIN':
        return {
          icon: <Layers className="w-3 h-3 text-indigo-600" />,
          style: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        };
      case 'Aggregation':
        return {
          icon: <BarChart3 className="w-3 h-3 text-emerald-600" />,
          style: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        };
      case 'Filtering':
        return {
          icon: <Filter className="w-3 h-3 text-amber-600" />,
          style: 'bg-amber-50 text-amber-700 border-amber-200',
        };
      case 'Analytics':
        return {
          icon: <Briefcase className="w-3 h-3 text-purple-600" />,
          style: 'bg-purple-50 text-purple-700 border-purple-200',
        };
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-blue-600" />
          <h2 className="text-sm font-bold text-slate-800">
            Relational Example Queries
          </h2>
          <span className="text-[11px] font-medium px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-full">
            Single-click execution
          </span>
        </div>
        <span className="text-xs text-slate-400 hidden sm:inline">
          Tested against the 4-table demo database
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {EXAMPLE_QUERIES.map((item) => {
          const badge = getCategoryBadge(item.category);

          return (
            <button
              key={item.id}
              type="button"
              disabled={disabled}
              onClick={() => onSelectQuery(item.query, true)}
              className="text-left bg-white rounded-xl p-4 border border-slate-200/90 hover:border-blue-400 hover:shadow-md transition-all duration-150 group flex flex-col justify-between space-y-3 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span
                    className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${badge.style}`}
                  >
                    {badge.icon}
                    {item.category}
                  </span>
                  <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono">
                    {item.tables.map((t) => (
                      <span key={t} className="bg-slate-100 px-1 py-0.2 rounded-xs">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                <h3 className="text-xs font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                  {item.title}
                </h3>
                <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                  &ldquo;{item.query}&rdquo;
                </p>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 group-hover:text-blue-600">
                <span className="text-[10px]">{item.description}</span>
                <span className="inline-flex items-center gap-1 font-semibold shrink-0 ml-2">
                  Run <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}


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
    id: 'recent-hires',
    title: 'Recent Hires Across Departments',
    query: 'Show all employees hired after 2021 ordered by hire date descending',
    category: 'Analytics',
    description: 'Chronological timeline query inspecting recent talent acquisitions.',
    tables: ['employees', 'departments'],
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

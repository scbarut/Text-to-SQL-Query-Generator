import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { ResultTable } from '../ResultTable';
import { ColumnMetadata } from '../SchemaExplorer';

describe('ResultTable', () => {
  const sampleColumns: ColumnMetadata[] = [
    { name: 'department', type: 'TEXT', primary_key: false, nullable: true },
    { name: 'headcount', type: 'INTEGER', primary_key: false, nullable: true },
  ];
  const sampleRows = [
    ['Engineering', 12],
    ['Marketing', 5],
  ];

  it('renders records, column names, and type badges', () => {
    const html = renderToStaticMarkup(
      <ResultTable
        columns={sampleColumns}
        rows={sampleRows}
        totalCount={2}
        viewMode="table"
        onViewModeChange={() => {}}
        onExportCsv={() => {}}
        onExportJson={() => {}}
      />
    );

    expect(html).toContain('Query Results');
    expect(html).toContain('(2 records)');
    expect(html).toContain('department');
    expect(html).toContain('TEXT');
    expect(html).toContain('headcount');
    expect(html).toContain('INTEGER');
    expect(html).toContain('Engineering');
    expect(html).toContain('12');
  });

  it('renders safeguard notice when result rows are capped below totalCount', () => {
    const html = renderToStaticMarkup(
      <ResultTable
        columns={sampleColumns}
        rows={sampleRows}
        totalCount={3480}
        viewMode="table"
        onViewModeChange={() => {}}
        onExportCsv={() => {}}
        onExportJson={() => {}}
      />
    );

    expect(html).toContain('Displaying 2 of 3,480 rows');
    expect(html).toContain('Automatic safeguard applied: results capped at 1,000 rows');
  });

  it('renders empty state message when rows is empty', () => {
    const html = renderToStaticMarkup(
      <ResultTable
        columns={sampleColumns}
        rows={[]}
        totalCount={0}
        viewMode="table"
        onViewModeChange={() => {}}
        onExportCsv={() => {}}
        onExportJson={() => {}}
      />
    );

    expect(html).toContain('No records found matching the query.');
  });
});


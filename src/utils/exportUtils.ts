import { toPng } from 'html-to-image';
import { ColumnMetadata } from '../components/SchemaExplorer';

/**
 * Escapes a cell value for safe RFC 4180 CSV export.
 */
function escapeCsvCell(value: unknown): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Downloads tabular data as a CSV file using the browser Blob API.
 */
export function exportToCsv(
  columns: ColumnMetadata[],
  rows: (string | number | boolean | null)[][],
  filename = 'query_results.csv'
): void {
  const header = columns.map((col) => escapeCsvCell(col.name)).join(',');
  const rowStrings = rows.map((row) =>
    row.map((cell) => escapeCsvCell(cell)).join(',')
  );
  const csvContent = [header, ...rowStrings].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Downloads tabular data as a structured JSON file.
 */
export function exportToJson(
  columns: ColumnMetadata[],
  rows: (string | number | boolean | null)[][],
  filename = 'query_results.json'
): void {
  const colNames = columns.map((c) => c.name);
  const data = rows.map((row) => {
    const item: Record<string, unknown> = {};
    colNames.forEach((name, idx) => {
      item[name] = row[idx];
    });
    return item;
  });

  const jsonContent = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Captures an HTML element (e.g. chart container) and downloads it as a PNG image.
 */
export async function exportChartToPng(
  element: HTMLElement,
  filename = 'chart_visualization.png'
): Promise<void> {
  const dataUrl = await toPng(element, {
    backgroundColor: '#ffffff',
    cacheBust: true,
    pixelRatio: 2,
  });
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}


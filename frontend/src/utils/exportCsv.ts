import type { TestCase } from '../types';

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function exportTestCasesToCsv(testCases: TestCase[], filename: string) {
  const headers = [
    'ID',
    'Title',
    'Category',
    'Priority',
    'Preconditions',
    'Steps',
    'Expected Result',
    'Status',
  ];

  const rows = testCases.map((tc) => [
    tc.id,
    tc.title,
    tc.category,
    tc.priority,
    tc.preconditions ?? '',
    tc.steps.map((s, i) => `${i + 1}. ${s}`).join(' | '),
    tc.expectedResult,
    tc.status,
  ]);

  const csvContent = [headers, ...rows]
    .map((row) => row.map((cell) => csvEscape(String(cell))).join(','))
    .join('\n');

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

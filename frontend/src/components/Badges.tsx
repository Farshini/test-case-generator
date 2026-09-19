import type { TestCaseCategory, TestCasePriority } from '../types';
import './Badges.css';

const CATEGORY_LABELS: Record<TestCaseCategory, string> = {
  positive: 'Positive',
  negative: 'Negative',
  edge_case: 'Edge case',
  validation: 'Validation',
};

const PRIORITY_LABELS: Record<TestCasePriority, string> = {
  high: 'High',
  medium: 'Medium',
  low: 'Low',
};

export function CategoryBadge({ category }: { category: TestCaseCategory }) {
  return (
    <span className={`badge badge--category-${category}`}>{CATEGORY_LABELS[category]}</span>
  );
}

export function PriorityBadge({ priority }: { priority: TestCasePriority }) {
  return (
    <span className={`badge badge--priority-${priority}`}>{PRIORITY_LABELS[priority]}</span>
  );
}

export function StatusBadge({ status }: { status: 'draft' | 'saved' }) {
  return (
    <span className={`badge badge--status-${status}`}>
      {status === 'saved' ? 'Saved' : 'Draft'}
    </span>
  );
}

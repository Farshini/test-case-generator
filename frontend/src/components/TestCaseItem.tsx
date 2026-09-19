import { useState } from 'react';
import type { TestCase } from '../types';
import { CategoryBadge, PriorityBadge, StatusBadge } from './Badges';
import { ChevronDownIcon, EditIcon, TrashIcon } from './Icons';
import { TestCaseEditForm } from './TestCaseEditForm';
import './TestCaseItem.css';

interface TestCaseItemProps {
  testCase: TestCase;
  index: number;
  selected: boolean;
  isEditing: boolean;
  onToggleSelect: () => void;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSaveEdit: (patch: Partial<TestCase>) => Promise<void>;
  onDelete: () => void;
}

export function TestCaseItem({
  testCase,
  index,
  selected,
  isEditing,
  onToggleSelect,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onDelete,
}: TestCaseItemProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <li className="test-case-item">
      <div className="test-case-item__row">
        <input
          type="checkbox"
          className="test-case-item__checkbox"
          checked={selected}
          onChange={onToggleSelect}
          aria-label={`Select ${testCase.title}`}
        />
        <button
          type="button"
          className="test-case-item__main"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
        >
          <span className="test-case-item__index">TC-{index + 1}</span>
          <span className="test-case-item__title">{testCase.title}</span>
          <span className="test-case-item__badges">
            <CategoryBadge category={testCase.category} />
            <PriorityBadge priority={testCase.priority} />
            <StatusBadge status={testCase.status} />
          </span>
          <ChevronDownIcon
            size={16}
            className={`test-case-item__chevron ${expanded ? 'test-case-item__chevron--open' : ''}`}
          />
        </button>
        <div className="test-case-item__row-actions">
          <button
            type="button"
            className="test-case-item__icon-button"
            onClick={onStartEdit}
            aria-label="Edit test case"
            title="Edit"
          >
            <EditIcon size={15} />
          </button>
          <button
            type="button"
            className="test-case-item__icon-button test-case-item__icon-button--danger"
            onClick={onDelete}
            aria-label="Delete test case"
            title="Delete"
          >
            <TrashIcon size={15} />
          </button>
        </div>
      </div>

      {isEditing && (
        <TestCaseEditForm testCase={testCase} onSave={onSaveEdit} onCancel={onCancelEdit} />
      )}

      {expanded && !isEditing && (
        <div className="test-case-item__details">
          {testCase.preconditions && (
            <div className="test-case-item__detail-block">
              <h4>Preconditions</h4>
              <p>{testCase.preconditions}</p>
            </div>
          )}
          <div className="test-case-item__detail-block">
            <h4>Steps</h4>
            <ol>
              {testCase.steps.map((step, i) => (
                <li key={i}>{step}</li>
              ))}
            </ol>
          </div>
          <div className="test-case-item__detail-block">
            <h4>Expected result</h4>
            <p>{testCase.expectedResult}</p>
          </div>
        </div>
      )}
    </li>
  );
}

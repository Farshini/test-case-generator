import { useState } from 'react';
import type { TestCase, TestCaseCategory, TestCasePriority } from '../types';
import './TestCaseEditForm.css';

interface TestCaseEditFormProps {
  testCase: TestCase;
  onSave: (patch: Partial<TestCase>) => Promise<void>;
  onCancel: () => void;
}

const CATEGORIES: TestCaseCategory[] = ['positive', 'negative', 'edge_case', 'validation'];
const PRIORITIES: TestCasePriority[] = ['high', 'medium', 'low'];

export function TestCaseEditForm({ testCase, onSave, onCancel }: TestCaseEditFormProps) {
  const [title, setTitle] = useState(testCase.title);
  const [category, setCategory] = useState(testCase.category);
  const [priority, setPriority] = useState(testCase.priority);
  const [preconditions, setPreconditions] = useState(testCase.preconditions ?? '');
  const [stepsText, setStepsText] = useState(testCase.steps.join('\n'));
  const [expectedResult, setExpectedResult] = useState(testCase.expectedResult);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    const steps = stepsText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    if (!title.trim()) {
      setError('Title is required.');
      return;
    }
    if (steps.length === 0) {
      setError('At least one step is required.');
      return;
    }
    if (!expectedResult.trim()) {
      setError('Expected result is required.');
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      await onSave({
        title: title.trim(),
        category,
        priority,
        preconditions: preconditions.trim() || null,
        steps,
        expectedResult: expectedResult.trim(),
      });
    } catch {
      setError('Failed to save changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="test-case-edit-form">
      <label className="test-case-edit-form__label" htmlFor={`title-${testCase.id}`}>
        Title
      </label>
      <input
        id={`title-${testCase.id}`}
        className="test-case-edit-form__input"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      <div className="test-case-edit-form__row">
        <div>
          <label className="test-case-edit-form__label" htmlFor={`category-${testCase.id}`}>
            Category
          </label>
          <select
            id={`category-${testCase.id}`}
            className="test-case-edit-form__select"
            value={category}
            onChange={(e) => setCategory(e.target.value as TestCaseCategory)}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c.replace('_', ' ')}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="test-case-edit-form__label" htmlFor={`priority-${testCase.id}`}>
            Priority
          </label>
          <select
            id={`priority-${testCase.id}`}
            className="test-case-edit-form__select"
            value={priority}
            onChange={(e) => setPriority(e.target.value as TestCasePriority)}
          >
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
      </div>

      <label className="test-case-edit-form__label" htmlFor={`preconditions-${testCase.id}`}>
        Preconditions
      </label>
      <textarea
        id={`preconditions-${testCase.id}`}
        className="test-case-edit-form__textarea"
        rows={2}
        value={preconditions}
        onChange={(e) => setPreconditions(e.target.value)}
        placeholder="Optional"
      />

      <label className="test-case-edit-form__label" htmlFor={`steps-${testCase.id}`}>
        Steps (one per line)
      </label>
      <textarea
        id={`steps-${testCase.id}`}
        className="test-case-edit-form__textarea"
        rows={4}
        value={stepsText}
        onChange={(e) => setStepsText(e.target.value)}
      />

      <label className="test-case-edit-form__label" htmlFor={`expected-${testCase.id}`}>
        Expected result
      </label>
      <textarea
        id={`expected-${testCase.id}`}
        className="test-case-edit-form__textarea"
        rows={2}
        value={expectedResult}
        onChange={(e) => setExpectedResult(e.target.value)}
      />

      {error && <div className="test-case-edit-form__error">{error}</div>}

      <div className="test-case-edit-form__actions">
        <button type="button" className="btn btn--sm btn--ghost" onClick={onCancel} disabled={isSaving}>
          Cancel
        </button>
        <button
          type="button"
          className="btn btn--sm btn--primary"
          onClick={handleSave}
          disabled={isSaving}
        >
          {isSaving ? 'Saving…' : 'Save changes'}
        </button>
      </div>
    </div>
  );
}

import { useMemo, useState } from 'react';
import { useRequirementFlow } from '../context/RequirementFlowContext';
import type { TestCase } from '../types';
import { exportTestCasesToCsv } from '../utils/exportCsv';
import { DownloadIcon, RefreshIcon, TrashIcon } from './Icons';
import { TestCaseItem } from './TestCaseItem';
import './TestCaseList.css';

export function TestCaseList() {
  const {
    testCases,
    requirement,
    isRegenerating,
    isSaving,
    regenerate,
    saveAll,
    updateTestCase,
    deleteTestCase,
  } = useRequirementFlow();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const savedCount = useMemo(
    () => testCases.filter((tc) => tc.status === 'saved').length,
    [testCases],
  );

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleDeleteSelected = async () => {
    const ids = Array.from(selectedIds);
    await Promise.all(ids.map((id) => deleteTestCase(id)));
    setSelectedIds(new Set());
  };

  const handleSaveEdit = async (id: string, patch: Partial<TestCase>) => {
    await updateTestCase(id, patch);
    setEditingId(null);
  };

  const handleExport = () => {
    exportTestCasesToCsv(testCases, `${requirement?.title || 'test-cases'}.csv`);
  };

  if (testCases.length === 0) {
    return null;
  }

  return (
    <div className="test-case-list card">
      <div className="test-case-list__header">
        <div>
          <h2>Generated Test Cases ({testCases.length})</h2>
          <p className="test-case-list__subtitle">
            {savedCount} of {testCases.length} saved
          </p>
        </div>
        <div className="test-case-list__header-actions">
          <button
            type="button"
            className="btn btn--sm btn--secondary"
            onClick={handleExport}
            title="Export as CSV"
          >
            <DownloadIcon size={14} /> Export CSV
          </button>
          <button
            type="button"
            className="btn btn--sm btn--secondary"
            onClick={regenerate}
            disabled={isRegenerating}
            title="Regenerate with AI"
          >
            <RefreshIcon size={14} className={isRegenerating ? 'spin-icon' : ''} />
            {isRegenerating ? 'Regenerating…' : 'Regenerate'}
          </button>
          <button
            type="button"
            className="btn btn--sm btn--primary"
            onClick={saveAll}
            disabled={isSaving || savedCount === testCases.length}
          >
            {isSaving ? 'Saving…' : 'Save all'}
          </button>
        </div>
      </div>

      <ul className="test-case-list__items">
        {testCases.map((tc, index) => (
          <TestCaseItem
            key={tc.id}
            testCase={tc}
            index={index}
            selected={selectedIds.has(tc.id)}
            isEditing={editingId === tc.id}
            onToggleSelect={() => toggleSelect(tc.id)}
            onStartEdit={() => setEditingId(tc.id)}
            onCancelEdit={() => setEditingId(null)}
            onSaveEdit={(patch) => handleSaveEdit(tc.id, patch)}
            onDelete={() => deleteTestCase(tc.id)}
          />
        ))}
      </ul>

      {selectedIds.size > 0 && (
        <div className="test-case-list__bulk-bar">
          <span>{selectedIds.size} selected</span>
          <button
            type="button"
            className="btn btn--sm btn--danger"
            onClick={handleDeleteSelected}
          >
            <TrashIcon size={14} /> Delete
          </button>
          <button
            type="button"
            className="btn btn--sm btn--ghost"
            onClick={() => setSelectedIds(new Set())}
          >
            Clear
          </button>
        </div>
      )}
    </div>
  );
}

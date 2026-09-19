import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from 'react';
import { api, ApiError } from '../api/client';
import type { TestCase } from '../types';
import {
  initialState,
  requirementFlowReducer,
  type RequirementFlowState,
} from './requirementFlowReducer';

const STORAGE_KEY = 'tcg.requirementId';

function errorMessage(err: unknown): string {
  if (err instanceof ApiError) return err.message;
  if (err instanceof Error) return err.message;
  return 'Something went wrong. Please try again.';
}

interface RequirementFlowContextValue extends RequirementFlowState {
  submitRequirement: (input: { title: string; content?: string; file?: File }) => Promise<void>;
  regenerate: () => Promise<void>;
  updateTestCase: (id: string, patch: Partial<TestCase>) => Promise<void>;
  deleteTestCase: (id: string) => Promise<void>;
  addTestCase: (
    testCase: Pick<
      TestCase,
      'title' | 'category' | 'priority' | 'preconditions' | 'steps' | 'expectedResult'
    >,
  ) => Promise<void>;
  saveAll: () => Promise<void>;
  startOver: () => void;
  clearError: () => void;
}

const RequirementFlowContext = createContext<RequirementFlowContextValue | null>(null);

export function RequirementFlowProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(requirementFlowReducer, initialState);

  // Rehydrate from a previous session so a page refresh doesn't lose work.
  useEffect(() => {
    const savedId = localStorage.getItem(STORAGE_KEY);
    if (!savedId) return;

    (async () => {
      try {
        dispatch({ type: 'GENERATING_STARTED' });
        const requirement = await api.getRequirement(savedId);
        dispatch({ type: 'REQUIREMENT_READY', requirement });
        const testCases = await api.listTestCases(savedId);
        dispatch({ type: 'TEST_CASES_READY', testCases });
      } catch {
        // Stale/deleted requirement - start fresh rather than getting stuck.
        localStorage.removeItem(STORAGE_KEY);
        dispatch({ type: 'RESET' });
      }
    })();
  }, []);

  const submitRequirement = useCallback(
    async (input: { title: string; content?: string; file?: File }) => {
      dispatch({ type: 'GENERATING_STARTED' });
      try {
        const requirement = input.file
          ? await api.createRequirementFromFile(input.title, input.file)
          : await api.createRequirementFromText(input.title, input.content ?? '');
        dispatch({ type: 'REQUIREMENT_READY', requirement });
        localStorage.setItem(STORAGE_KEY, requirement.id);

        const testCases = await api.generateTestCases(requirement.id);
        dispatch({ type: 'TEST_CASES_READY', testCases });
      } catch (err) {
        dispatch({ type: 'ERROR', message: errorMessage(err) });
      }
    },
    [],
  );

  const regenerate = useCallback(async () => {
    if (!state.requirement) return;
    dispatch({ type: 'REGENERATE_STARTED' });
    try {
      const testCases = await api.generateTestCases(state.requirement.id);
      dispatch({ type: 'TEST_CASES_READY', testCases });
    } catch (err) {
      dispatch({ type: 'ERROR', message: errorMessage(err) });
    }
  }, [state.requirement]);

  const updateTestCase = useCallback(async (id: string, patch: Partial<TestCase>) => {
    try {
      const updated = await api.updateTestCase(id, patch);
      dispatch({ type: 'TEST_CASE_UPDATED', testCase: updated });
    } catch (err) {
      dispatch({ type: 'ERROR', message: errorMessage(err) });
      throw err;
    }
  }, []);

  const deleteTestCase = useCallback(async (id: string) => {
    try {
      await api.deleteTestCase(id);
      dispatch({ type: 'TEST_CASE_REMOVED', id });
    } catch (err) {
      dispatch({ type: 'ERROR', message: errorMessage(err) });
    }
  }, []);

  const addTestCase = useCallback(
    async (
      testCase: Pick<
        TestCase,
        'title' | 'category' | 'priority' | 'preconditions' | 'steps' | 'expectedResult'
      >,
    ) => {
      if (!state.requirement) return;
      try {
        const created = await api.createTestCase(state.requirement.id, testCase);
        dispatch({ type: 'TEST_CASE_ADDED', testCase: created });
      } catch (err) {
        dispatch({ type: 'ERROR', message: errorMessage(err) });
        throw err;
      }
    },
    [state.requirement],
  );

  const saveAll = useCallback(async () => {
    if (!state.requirement) return;
    dispatch({ type: 'SAVE_STARTED' });
    try {
      const testCases = await api.saveAllTestCases(state.requirement.id);
      dispatch({ type: 'SAVE_FINISHED', testCases });
    } catch (err) {
      dispatch({ type: 'ERROR', message: errorMessage(err) });
    }
  }, [state.requirement]);

  const startOver = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    dispatch({ type: 'RESET' });
  }, []);

  const clearError = useCallback(() => dispatch({ type: 'CLEAR_ERROR' }), []);

  const value = useMemo<RequirementFlowContextValue>(
    () => ({
      ...state,
      submitRequirement,
      regenerate,
      updateTestCase,
      deleteTestCase,
      addTestCase,
      saveAll,
      startOver,
      clearError,
    }),
    [
      state,
      submitRequirement,
      regenerate,
      updateTestCase,
      deleteTestCase,
      addTestCase,
      saveAll,
      startOver,
      clearError,
    ],
  );

  return (
    <RequirementFlowContext.Provider value={value}>{children}</RequirementFlowContext.Provider>
  );
}

export function useRequirementFlow() {
  const ctx = useContext(RequirementFlowContext);
  if (!ctx) {
    throw new Error('useRequirementFlow must be used within a RequirementFlowProvider');
  }
  return ctx;
}

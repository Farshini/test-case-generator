import type { Requirement, TestCase } from '../types';

export type Stage = 'landing' | 'generating' | 'results';

export interface RequirementFlowState {
  stage: Stage;
  requirement: Requirement | null;
  testCases: TestCase[];
  isRegenerating: boolean;
  isSaving: boolean;
  error: string | null;
}

export const initialState: RequirementFlowState = {
  stage: 'landing',
  requirement: null,
  testCases: [],
  isRegenerating: false,
  isSaving: false,
  error: null,
};

export type RequirementFlowAction =
  | { type: 'GENERATING_STARTED' }
  | { type: 'REQUIREMENT_READY'; requirement: Requirement }
  | { type: 'TEST_CASES_READY'; testCases: TestCase[] }
  | { type: 'REGENERATE_STARTED' }
  | { type: 'REGENERATE_FINISHED' }
  | { type: 'TEST_CASE_UPDATED'; testCase: TestCase }
  | { type: 'TEST_CASE_REMOVED'; id: string }
  | { type: 'TEST_CASE_ADDED'; testCase: TestCase }
  | { type: 'SAVE_STARTED' }
  | { type: 'SAVE_FINISHED'; testCases: TestCase[] }
  | { type: 'ERROR'; message: string }
  | { type: 'CLEAR_ERROR' }
  | { type: 'RESET' };

export function requirementFlowReducer(
  state: RequirementFlowState,
  action: RequirementFlowAction,
): RequirementFlowState {
  switch (action.type) {
    case 'GENERATING_STARTED':
      return { ...state, stage: 'generating', error: null };
    case 'REQUIREMENT_READY':
      return { ...state, requirement: action.requirement, error: null };
    case 'TEST_CASES_READY':
      return {
        ...state,
        stage: 'results',
        testCases: action.testCases,
        isRegenerating: false,
        error: null,
      };
    case 'REGENERATE_STARTED':
      return { ...state, isRegenerating: true, error: null };
    case 'REGENERATE_FINISHED':
      return { ...state, isRegenerating: false };
    case 'TEST_CASE_UPDATED':
      return {
        ...state,
        testCases: state.testCases.map((tc) =>
          tc.id === action.testCase.id ? action.testCase : tc,
        ),
      };
    case 'TEST_CASE_REMOVED':
      return {
        ...state,
        testCases: state.testCases.filter((tc) => tc.id !== action.id),
      };
    case 'TEST_CASE_ADDED':
      return { ...state, testCases: [...state.testCases, action.testCase] };
    case 'SAVE_STARTED':
      return { ...state, isSaving: true, error: null };
    case 'SAVE_FINISHED':
      return { ...state, isSaving: false, testCases: action.testCases };
    case 'ERROR':
      return {
        ...state,
        error: action.message,
        stage: state.stage === 'generating' ? 'landing' : state.stage,
        isRegenerating: false,
        isSaving: false,
      };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

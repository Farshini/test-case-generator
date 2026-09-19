export type TestCaseCategory = 'positive' | 'negative' | 'edge_case' | 'validation';
export type TestCasePriority = 'low' | 'medium' | 'high';
export type TestCaseStatus = 'draft' | 'saved';

export interface Requirement {
  id: string;
  title: string;
  content: string;
  sourceType: 'text' | 'file';
  originalFileName: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TestCase {
  id: string;
  requirementId: string;
  title: string;
  category: TestCaseCategory;
  priority: TestCasePriority;
  preconditions: string | null;
  steps: string[];
  expectedResult: string;
  status: TestCaseStatus;
  isEdited: boolean;
  generationRound: number;
  createdAt: string;
  updatedAt: string;
}

export interface ApiErrorBody {
  statusCode: number;
  error: string;
  message: string | string[];
  path?: string;
  timestamp?: string;
}

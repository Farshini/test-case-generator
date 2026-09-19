import type { ApiErrorBody, Requirement, TestCase } from '../types';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

export class ApiError extends Error {
  statusCode: number;
  errorType: string;

  constructor(message: string, statusCode: number, errorType: string) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.errorType = errorType;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers:
      options.body instanceof FormData
        ? options.headers
        : { 'Content-Type': 'application/json', ...options.headers },
  });

  // Handle 204 No Content responses first
  if (response.status === 204) {
    return undefined as T;
  }

  if (!response.ok) {
    let body: ApiErrorBody | null = null;
    try {
      const text = await response.text();
      if (text) {
        body = JSON.parse(text);
      }
    } catch {
      // response wasn't JSON - fall through to generic message
    }
    const message = Array.isArray(body?.message)
      ? body.message.join(' ')
      : body?.message ?? `Request failed with status ${response.status}`;
    throw new ApiError(message, response.status, body?.error ?? 'Unknown Error');
  }

  // Handle successful responses with empty body (like DELETE requests)
  const text = await response.text();
  if (!text) {
    return undefined as T;
  }

  return JSON.parse(text);
}

export const api = {
  createRequirementFromText: (title: string, content: string): Promise<Requirement> =>
    request<Requirement>('/requirements', {
      method: 'POST',
      body: JSON.stringify({ title, content }),
    }),

  createRequirementFromFile: (title: string, file: File): Promise<Requirement> => {
    const formData = new FormData();
    if (title) formData.append('title', title);
    formData.append('file', file);
    return request<Requirement>('/requirements', {
      method: 'POST',
      body: formData,
    });
  },

  getRequirement: (id: string): Promise<Requirement> =>
    request<Requirement>(`/requirements/${id}`),

  generateTestCases: (requirementId: string): Promise<TestCase[]> =>
    request<TestCase[]>(`/requirements/${requirementId}/generate`, {
      method: 'POST',
    }),

  listTestCases: (requirementId: string): Promise<TestCase[]> =>
    request<TestCase[]>(`/requirements/${requirementId}/test-cases`),

  updateTestCase: (id: string, patch: Partial<TestCase>): Promise<TestCase> =>
    request<TestCase>(`/test-cases/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    }),

  deleteTestCase: (id: string): Promise<void> =>
    request<void>(`/test-cases/${id}`, { method: 'DELETE' }),

  saveAllTestCases: (requirementId: string): Promise<TestCase[]> =>
    request<TestCase[]>(`/requirements/${requirementId}/test-cases/save`, {
      method: 'POST',
    }),

  createTestCase: (
    requirementId: string,
    testCase: Pick<
      TestCase,
      'title' | 'category' | 'priority' | 'preconditions' | 'steps' | 'expectedResult'
    >,
  ): Promise<TestCase> =>
    request<TestCase>(`/requirements/${requirementId}/test-cases`, {
      method: 'POST',
      body: JSON.stringify(testCase),
    }),
};

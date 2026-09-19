import { z } from 'zod';

/**
 * Schema the AI's JSON output is validated against. Mirrors the structure
 * requested in the Gemini prompt (see ai.service.ts) so we can catch
 * malformed / hallucinated output before it ever reaches the database.
 */
export const aiTestCaseSchema = z.object({
  title: z.string().min(1).max(500),
  category: z.enum(['positive', 'negative', 'edge_case', 'validation']),
  priority: z.enum(['low', 'medium', 'high']),
  preconditions: z.string().nullable().optional().default(null),
  steps: z.array(z.string().min(1)).min(1),
  expectedResult: z.string().min(1),
});

export const aiTestCaseListSchema = z.object({
  testCases: z.array(aiTestCaseSchema).min(1),
});

export type AiTestCase = z.infer<typeof aiTestCaseSchema>;
export type AiTestCaseList = z.infer<typeof aiTestCaseListSchema>;

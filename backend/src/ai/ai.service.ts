import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { aiTestCaseListSchema, AiTestCase } from './ai.schema';
import { AiGenerationException, AiRateLimitException } from './ai.exceptions';

const RESPONSE_SCHEMA = {
  type: SchemaType.OBJECT,
  properties: {
    testCases: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          title: { type: SchemaType.STRING },
          category: {
            type: SchemaType.STRING,
            enum: ['positive', 'negative', 'edge_case', 'validation'],
          },
          priority: {
            type: SchemaType.STRING,
            enum: ['low', 'medium', 'high'],
          },
          preconditions: { type: SchemaType.STRING, nullable: true },
          steps: {
            type: SchemaType.ARRAY,
            items: { type: SchemaType.STRING },
          },
          expectedResult: { type: SchemaType.STRING },
        },
        required: ['title', 'category', 'priority', 'steps', 'expectedResult'],
      },
    },
  },
  required: ['testCases'],
};

const SYSTEM_INSTRUCTION = `You are a senior QA engineer generating test cases from software requirements.
Given a requirement or user story, produce a thorough, non-redundant set of test cases that together
give strong coverage of the requirement.

Rules:
- Always include a mix of categories: "positive" (happy path), "negative" (invalid input / misuse),
  "edge_case" (boundary values, unusual but valid conditions), and "validation" (field-level rules,
  formats, required fields).
- Produce between 6 and 12 test cases. Favor quality and distinct coverage over quantity.
- Each test case must have concrete, executable steps (not vague instructions) and a specific,
  verifiable expected result.
- Do not invent requirements that are not stated or reasonably implied by the input.
- Keep each title short and specific (max ~90 characters).
- Output must strictly match the provided JSON schema.`;

function buildPrompt(requirementText: string, previousTitles: string[] = []): string {
  let prompt = `Requirement / user story:\n"""\n${requirementText}\n"""\n\nGenerate the test cases now.`;
  if (previousTitles.length > 0) {
    prompt += `\n\nThis is a regeneration request. The previous attempt produced test cases with these titles:\n${previousTitles
      .map((t) => `- ${t}`)
      .join(
        '\n',
      )}\nProduce a fresh set. You may cover similar ground, but rephrase and look for scenarios the previous attempt missed rather than repeating it verbatim.`;
  }
  return prompt;
}

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableError(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err);
  return /429|500|502|503|504|overloaded|rate.?limit|ECONNRESET|ETIMEDOUT/i.test(
    message,
  );
}

function isRateLimitError(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err);
  return /429|rate.?limit|quota/i.test(message);
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly client: GoogleGenerativeAI | null;
  private readonly modelName: string;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('gemini.apiKey');
    this.modelName = this.configService.get<string>('gemini.model') ?? 'gemini-1.5-pro-001';
    this.client = apiKey ? new GoogleGenerativeAI(apiKey) : null;
    if (!apiKey) {
      this.logger.warn(
        'GEMINI_API_KEY is not set. AI generation calls will fail until it is configured in .env.',
      );
    }
  }

  async generateTestCases(
    requirementText: string,
    previousTitles: string[] = [],
  ): Promise<AiTestCase[]> {
    if (!this.client) {
      throw new AiGenerationException(
        'AI provider is not configured. Set GEMINI_API_KEY in the backend .env file.',
      );
    }

    const model = this.client.getGenerativeModel({
      model: this.modelName,
      systemInstruction: SYSTEM_INSTRUCTION,
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: RESPONSE_SCHEMA as never,
        temperature: 0.6,
      },
    });

    const prompt = buildPrompt(requirementText, previousTitles);

    let lastError: unknown;
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const result = await model.generateContent(prompt);
        const rawText = result.response.text();
        return this.parseAndValidate(rawText);
      } catch (err) {
        lastError = err;

        // Schema/parse failures are not transport errors - retrying with the
        // exact same prompt tends to reproduce the same malformed output, so
        // fail fast instead of burning retry budget.
        if (err instanceof AiGenerationException) {
          throw err;
        }

        if (!isRetryableError(err) || attempt === MAX_RETRIES) {
          break;
        }

        const delay = BASE_DELAY_MS * 2 ** (attempt - 1);
        this.logger.warn(
          `Gemini call failed (attempt ${attempt}/${MAX_RETRIES}), retrying in ${delay}ms: ${
            err instanceof Error ? err.message : err
          }`,
        );
        await sleep(delay);
      }
    }

    if (isRateLimitError(lastError)) {
      throw new AiRateLimitException();
    }

    this.logger.error(
      `Gemini generation failed after ${MAX_RETRIES} attempts`,
      lastError instanceof Error ? lastError.stack : undefined,
    );
    throw new AiGenerationException(
      'The AI provider failed to generate test cases after multiple attempts. Please try again.',
      lastError,
    );
  }

  private parseAndValidate(rawText: string): AiTestCase[] {
    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(rawText);
    } catch (err) {
      this.logger.error(`Gemini returned non-JSON output: ${rawText.slice(0, 500)}`);
      throw new AiGenerationException(
        'AI provider returned a response that could not be parsed as JSON.',
        err,
      );
    }

    const validation = aiTestCaseListSchema.safeParse(parsedJson);
    if (!validation.success) {
      this.logger.error(
        `Gemini output failed schema validation: ${JSON.stringify(
          validation.error.issues,
        )}`,
      );
      throw new AiGenerationException(
        'AI provider returned output that did not match the expected structure (likely a hallucination). Please try regenerating.',
        validation.error,
      );
    }

    return validation.data.testCases;
  }
}

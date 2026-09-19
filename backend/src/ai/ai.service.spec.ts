import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { AiService } from './ai.service';
import { AiGenerationException, AiRateLimitException } from './ai.exceptions';

// Mock the Gemini SDK so tests run deterministically with no network access
// and no API key. Each test configures generateContentMock's behavior.
const generateContentMock = jest.fn();
jest.mock('@google/generative-ai', () => {
  return {
    GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
      getGenerativeModel: jest.fn().mockReturnValue({
        generateContent: generateContentMock,
      }),
    })),
    SchemaType: {
      OBJECT: 'object',
      ARRAY: 'array',
      STRING: 'string',
    },
  };
});

function mockResponse(text: string) {
  return { response: { text: () => text } };
}

const VALID_PAYLOAD = {
  testCases: [
    {
      title: 'User logs in with valid credentials',
      category: 'positive',
      priority: 'high',
      preconditions: 'User has an account',
      steps: ['Go to login page', 'Enter valid credentials', 'Submit'],
      expectedResult: 'User reaches the dashboard',
    },
    {
      title: 'User logs in with wrong password',
      category: 'negative',
      priority: 'medium',
      steps: ['Go to login page', 'Enter wrong password', 'Submit'],
      expectedResult: 'An invalid credentials error is shown',
    },
  ],
};

describe('AiService', () => {
  let service: AiService;

  beforeEach(async () => {
    generateContentMock.mockReset();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiService,
        {
          provide: ConfigService,
          useValue: {
            get: (key: string) => {
              const map: Record<string, unknown> = {
                'gemini.apiKey': 'test-api-key',
                'gemini.model': 'gemini-2.0-flash',
              };
              return map[key];
            },
          },
        },
      ],
    }).compile();

    service = module.get<AiService>(AiService);
  });

  it('parses and returns valid AI output', async () => {
    generateContentMock.mockResolvedValueOnce(
      mockResponse(JSON.stringify(VALID_PAYLOAD)),
    );

    const result = await service.generateTestCases('Some requirement text');

    expect(result).toHaveLength(2);
    expect(result[0].title).toBe('User logs in with valid credentials');
    expect(generateContentMock).toHaveBeenCalledTimes(1);
  });

  it('throws AiGenerationException on malformed JSON without retrying', async () => {
    generateContentMock.mockResolvedValueOnce(mockResponse('not valid json {'));

    await expect(service.generateTestCases('Some requirement text')).rejects.toThrow(
      AiGenerationException,
    );
    expect(generateContentMock).toHaveBeenCalledTimes(1);
  });

  it('throws AiGenerationException when output fails schema validation', async () => {
    generateContentMock.mockResolvedValueOnce(
      mockResponse(JSON.stringify({ testCases: [{ title: 'missing fields' }] })),
    );

    await expect(service.generateTestCases('Some requirement text')).rejects.toThrow(
      AiGenerationException,
    );
    expect(generateContentMock).toHaveBeenCalledTimes(1);
  });

  it('retries on transient failures and eventually succeeds', async () => {
    generateContentMock
      .mockRejectedValueOnce(new Error('503 Service Unavailable'))
      .mockResolvedValueOnce(mockResponse(JSON.stringify(VALID_PAYLOAD)));

    const result = await service.generateTestCases('Some requirement text');

    expect(result).toHaveLength(2);
    expect(generateContentMock).toHaveBeenCalledTimes(2);
  }, 10000);

  it('surfaces a rate-limit-specific error after exhausting retries on 429s', async () => {
    generateContentMock.mockRejectedValue(new Error('429 Too Many Requests'));

    await expect(service.generateTestCases('Some requirement text')).rejects.toThrow(
      AiRateLimitException,
    );
    expect(generateContentMock).toHaveBeenCalledTimes(3);
  }, 15000);

  it('includes previous titles in the prompt when regenerating', async () => {
    generateContentMock.mockResolvedValueOnce(
      mockResponse(JSON.stringify(VALID_PAYLOAD)),
    );

    await service.generateTestCases('Some requirement text', [
      'Old test case title',
    ]);

    const promptArg = generateContentMock.mock.calls[0][0] as string;
    expect(promptArg).toContain('Old test case title');
    expect(promptArg).toContain('regeneration request');
  });
});

import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * Raised whenever the AI provider cannot produce a usable result -
 * whether that's a transport failure, a rate limit that survived retries,
 * or output that fails schema validation (a likely hallucination).
 * Mapped to 502 Bad Gateway: the request was valid, but the upstream
 * dependency failed.
 */
export class AiGenerationException extends HttpException {
  constructor(message: string, public readonly originalError?: unknown) {
    super(
      {
        statusCode: HttpStatus.BAD_GATEWAY,
        error: 'AI Generation Failed',
        message,
      },
      HttpStatus.BAD_GATEWAY,
    );
  }
}

export class AiRateLimitException extends HttpException {
  constructor(message = 'AI provider rate limit exceeded. Please try again shortly.') {
    super(
      {
        statusCode: HttpStatus.TOO_MANY_REQUESTS,
        error: 'AI Rate Limited',
        message,
      },
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }
}

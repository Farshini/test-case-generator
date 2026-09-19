import { BadRequestException } from '@nestjs/common';
import { TextExtractionService } from './text-extraction.service';

function makeFile(originalname: string, content: string): Express.Multer.File {
  return {
    originalname,
    buffer: Buffer.from(content, 'utf-8'),
  } as Express.Multer.File;
}

describe('TextExtractionService', () => {
  let service: TextExtractionService;

  beforeEach(() => {
    service = new TextExtractionService();
  });

  it('extracts plain text from a .txt file', async () => {
    const text = await service.extract(makeFile('req.txt', 'Hello requirement'));
    expect(text).toBe('Hello requirement');
  });

  it('extracts plain text from a .md file', async () => {
    const text = await service.extract(makeFile('req.md', '# Heading\nBody text'));
    expect(text).toBe('# Heading\nBody text');
  });

  it('rejects unsupported file extensions', async () => {
    await expect(
      service.extract(makeFile('req.exe', 'binary junk')),
    ).rejects.toThrow(BadRequestException);
  });
});

import { BadRequestException, Injectable, Logger } from '@nestjs/common';

const SUPPORTED_EXTENSIONS = ['.txt', '.md', '.pdf', '.docx'];

@Injectable()
export class TextExtractionService {
  private readonly logger = new Logger(TextExtractionService.name);

  async extract(file: Express.Multer.File): Promise<string> {
    const extension = this.getExtension(file.originalname);

    if (!SUPPORTED_EXTENSIONS.includes(extension)) {
      throw new BadRequestException(
        `Unsupported file type "${extension}". Supported types: ${SUPPORTED_EXTENSIONS.join(', ')}.`,
      );
    }

    try {
      switch (extension) {
        case '.txt':
        case '.md':
          return file.buffer.toString('utf-8');
        case '.pdf':
          return await this.extractPdf(file.buffer);
        case '.docx':
          return await this.extractDocx(file.buffer);
        default:
          throw new BadRequestException(`Unsupported file type "${extension}".`);
      }
    } catch (err) {
      if (err instanceof BadRequestException) {
        throw err;
      }
      this.logger.error(
        `Failed to extract text from ${file.originalname}`,
        err instanceof Error ? err.stack : undefined,
      );
      throw new BadRequestException(
        'Could not extract text from the uploaded file. Please check the file is not corrupted.',
      );
    }
  }

  private async extractPdf(buffer: Buffer): Promise<string> {
    const { PDFParse } = await import('pdf-parse');
    const parser = new PDFParse({ data: buffer });
    try {
      const result = await parser.getText();
      // Join per-page text ourselves rather than using result.text, which
      // interleaves "-- N of M --" page-break markers into the content.
      return result.pages.map((page) => page.text).join('\n\n');
    } finally {
      await parser.destroy();
    }
  }

  private async extractDocx(buffer: Buffer): Promise<string> {
    const mammoth = await import('mammoth');
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }

  private getExtension(filename: string): string {
    const idx = filename.lastIndexOf('.');
    return idx === -1 ? '' : filename.slice(idx).toLowerCase();
  }
}

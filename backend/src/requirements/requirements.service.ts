import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Requirement, RequirementSourceType } from './entities/requirement.entity';
import { CreateRequirementDto } from './dto/create-requirement.dto';
import { TextExtractionService } from './text-extraction.service';
import { AiService } from '../ai/ai.service';
import { TestCasesService } from '../test-cases/test-cases.service';
import { TestCase } from '../test-cases/entities/test-case.entity';

const MAX_GENERATION_ROUND = 20;

@Injectable()
export class RequirementsService {
  constructor(
    @InjectRepository(Requirement)
    private readonly requirementRepository: Repository<Requirement>,
    private readonly textExtractionService: TextExtractionService,
    private readonly aiService: AiService,
    private readonly testCasesService: TestCasesService,
  ) {}

  async create(
    dto: CreateRequirementDto,
    file?: Express.Multer.File,
  ): Promise<Requirement> {
    let content: string;
    let sourceType: RequirementSourceType;
    let originalFileName: string | null = null;

    if (file) {
      content = (await this.textExtractionService.extract(file)).trim();
      sourceType = RequirementSourceType.FILE;
      originalFileName = file.originalname;
    } else if (dto.content && dto.content.trim().length > 0) {
      content = dto.content.trim();
      sourceType = RequirementSourceType.TEXT;
    } else {
      throw new BadRequestException(
        'Provide requirement text in "content" or upload a file.',
      );
    }

    if (content.length < 10) {
      throw new BadRequestException(
        'Extracted requirement text is too short to generate meaningful test cases.',
      );
    }

    const requirement = this.requirementRepository.create({
      title: dto.title?.trim() || this.deriveTitle(content),
      content,
      sourceType,
      originalFileName,
    });

    return this.requirementRepository.save(requirement);
  }

  async findAll(): Promise<Requirement[]> {
    return this.requirementRepository.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: string): Promise<Requirement> {
    const requirement = await this.requirementRepository.findOne({ where: { id } });
    if (!requirement) {
      throw new NotFoundException(`Requirement ${id} not found.`);
    }
    return requirement;
  }

  async remove(id: string): Promise<void> {
    const requirement = await this.findOne(id);
    await this.requirementRepository.remove(requirement);
  }

  /**
   * Generates a fresh batch of test cases. On first generation there is
   * nothing to replace; on regeneration, the previous *draft* (unsaved)
   * batch is discarded in favor of the new one so we don't accumulate
   * abandoned drafts, while anything the user already saved is preserved.
   */
  async generateTestCases(id: string): Promise<TestCase[]> {
    const requirement = await this.findOne(id);
    const existing = await this.testCasesService.findAllForRequirement(id);

    const previousTitles = existing.map((tc) => tc.title);
    const draftIds = existing.filter((tc) => tc.status === 'draft').map((tc) => tc.id);
    const nextRound = Math.min(
      (existing.reduce((max, tc) => Math.max(max, tc.generationRound), 0) || 0) + 1,
      MAX_GENERATION_ROUND,
    );

    const generated = await this.aiService.generateTestCases(
      requirement.content,
      previousTitles,
    );

    if (draftIds.length > 0) {
      await Promise.all(
        draftIds.map((draftId) => this.testCasesService.remove(draftId)),
      );
    }

    return this.testCasesService.saveGeneratedBatch(id, generated, nextRound);
  }

  private deriveTitle(content: string): string {
    const firstLine = content.split('\n').find((line) => line.trim().length > 0) ?? content;
    return firstLine.trim().slice(0, 100);
  }
}

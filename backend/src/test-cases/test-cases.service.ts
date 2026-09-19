import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  TestCase,
  TestCaseCategory,
  TestCasePriority,
  TestCaseStatus,
} from './entities/test-case.entity';
import { UpdateTestCaseDto } from './dto/update-test-case.dto';
import { CreateTestCaseDto } from './dto/create-test-case.dto';
import { AiTestCase } from '../ai/ai.schema';

@Injectable()
export class TestCasesService {
  constructor(
    @InjectRepository(TestCase)
    private readonly testCaseRepository: Repository<TestCase>,
  ) {}

  async findAllForRequirement(requirementId: string): Promise<TestCase[]> {
    return this.testCaseRepository.find({
      where: { requirementId },
      order: { createdAt: 'ASC' },
    });
  }

  async findOne(id: string): Promise<TestCase> {
    const testCase = await this.testCaseRepository.findOne({ where: { id } });
    if (!testCase) {
      throw new NotFoundException(`Test case ${id} not found.`);
    }
    return testCase;
  }

  async create(requirementId: string, dto: CreateTestCaseDto): Promise<TestCase> {
    const testCase = this.testCaseRepository.create({
      ...dto,
      priority: dto.priority ?? TestCasePriority.MEDIUM,
      preconditions: dto.preconditions ?? null,
      requirementId,
      status: TestCaseStatus.SAVED,
      isEdited: true,
    });
    return this.testCaseRepository.save(testCase);
  }

  async update(id: string, dto: UpdateTestCaseDto): Promise<TestCase> {
    const testCase = await this.findOne(id);
    Object.assign(testCase, dto);
    testCase.isEdited = true;
    return this.testCaseRepository.save(testCase);
  }

  async remove(id: string): Promise<void> {
    const testCase = await this.findOne(id);
    await this.testCaseRepository.remove(testCase);
  }

  /**
   * Persists a fresh batch of AI-generated test cases for a requirement,
   * tagged with an incrementing generation round so the UI/history can
   * distinguish regenerations.
   */
  async saveGeneratedBatch(
    requirementId: string,
    items: AiTestCase[],
    generationRound: number,
  ): Promise<TestCase[]> {
    const entities: TestCase[] = items.map((item) => {
      const entity = new TestCase();
      entity.requirementId = requirementId;
      entity.title = item.title;
      entity.category = item.category as TestCaseCategory;
      entity.priority = item.priority as TestCasePriority;
      entity.preconditions = item.preconditions ?? null;
      entity.steps = item.steps;
      entity.expectedResult = item.expectedResult;
      entity.status = TestCaseStatus.DRAFT;
      entity.isEdited = false;
      entity.generationRound = generationRound;
      return entity;
    });
    return this.testCaseRepository.save(entities);
  }

  async deleteAllForRequirement(requirementId: string): Promise<void> {
    await this.testCaseRepository.delete({ requirementId });
  }

  async markAllSaved(requirementId: string): Promise<TestCase[]> {
    await this.testCaseRepository.update(
      { requirementId },
      { status: TestCaseStatus.SAVED },
    );
    return this.findAllForRequirement(requirementId);
  }
}

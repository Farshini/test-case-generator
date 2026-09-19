import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { TestCasesService } from './test-cases.service';
import {
  TestCase,
  TestCaseCategory,
  TestCasePriority,
  TestCaseStatus,
} from './entities/test-case.entity';

type MockRepo = Partial<Record<keyof Repository<TestCase>, jest.Mock>>;

const createMockRepo = (): MockRepo => ({
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
  delete: jest.fn(),
  update: jest.fn(),
});

describe('TestCasesService', () => {
  let service: TestCasesService;
  let repo: MockRepo;

  beforeEach(async () => {
    repo = createMockRepo();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TestCasesService,
        { provide: getRepositoryToken(TestCase), useValue: repo },
      ],
    }).compile();

    service = module.get<TestCasesService>(TestCasesService);
  });

  it('throws NotFoundException when the test case does not exist', async () => {
    (repo.findOne as jest.Mock).mockResolvedValue(null);
    await expect(service.findOne('missing-id')).rejects.toThrow(NotFoundException);
  });

  it('marks a test case as edited when updated', async () => {
    const existing: Partial<TestCase> = {
      id: '1',
      title: 'Old title',
      isEdited: false,
    };
    (repo.findOne as jest.Mock).mockResolvedValue(existing);
    (repo.save as jest.Mock).mockImplementation((e) => Promise.resolve(e));

    const result = await service.update('1', { title: 'New title' });

    expect(result.title).toBe('New title');
    expect(result.isEdited).toBe(true);
  });

  it('persists a generated batch with draft status and the given round', async () => {
    (repo.save as jest.Mock).mockImplementation((entities) => Promise.resolve(entities));

    const result = await service.saveGeneratedBatch(
      'req-1',
      [
        {
          title: 'Case A',
          category: 'positive' as const,
          priority: 'high' as const,
          preconditions: null,
          steps: ['step 1'],
          expectedResult: 'result A',
        },
      ],
      2,
    );

    expect(result).toHaveLength(1);
    expect(result[0].requirementId).toBe('req-1');
    expect(result[0].status).toBe(TestCaseStatus.DRAFT);
    expect(result[0].generationRound).toBe(2);
    expect(result[0].category).toBe(TestCaseCategory.POSITIVE);
    expect(result[0].priority).toBe(TestCasePriority.HIGH);
  });

  it('marks all test cases for a requirement as saved', async () => {
    (repo.update as jest.Mock).mockResolvedValue(undefined);
    (repo.find as jest.Mock).mockResolvedValue([{ id: '1', status: TestCaseStatus.SAVED }]);

    const result = await service.markAllSaved('req-1');

    expect(repo.update).toHaveBeenCalledWith(
      { requirementId: 'req-1' },
      { status: TestCaseStatus.SAVED },
    );
    expect(result).toHaveLength(1);
  });
});

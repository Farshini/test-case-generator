import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Requirement } from '../../requirements/entities/requirement.entity';

export enum TestCaseCategory {
  POSITIVE = 'positive',
  NEGATIVE = 'negative',
  EDGE_CASE = 'edge_case',
  VALIDATION = 'validation',
}

export enum TestCasePriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

export enum TestCaseStatus {
  DRAFT = 'draft',
  SAVED = 'saved',
}

@Entity('test_cases')
export class TestCase {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid' })
  requirementId: string;

  @ManyToOne(() => Requirement, (requirement) => requirement.testCases, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'requirementId' })
  requirement: Requirement;

  @Column({ type: 'varchar', length: 500 })
  title: string;

  @Column({
    type: 'enum',
    enum: TestCaseCategory,
  })
  category: TestCaseCategory;

  @Column({
    type: 'enum',
    enum: TestCasePriority,
    default: TestCasePriority.MEDIUM,
  })
  priority: TestCasePriority;

  @Column({ type: 'text', nullable: true })
  preconditions: string | null;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  steps: string[];

  @Column({ type: 'text' })
  expectedResult: string;

  @Column({
    type: 'enum',
    enum: TestCaseStatus,
    default: TestCaseStatus.DRAFT,
  })
  status: TestCaseStatus;

  @Column({ type: 'boolean', default: false })
  isEdited: boolean;

  @Column({ type: 'int', default: 1 })
  generationRound: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

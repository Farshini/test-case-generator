import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { TestCase } from '../../test-cases/entities/test-case.entity';

export enum RequirementSourceType {
  TEXT = 'text',
  FILE = 'file',
}

@Entity('requirements')
export class Requirement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text' })
  content: string;

  @Column({
    type: 'enum',
    enum: RequirementSourceType,
    default: RequirementSourceType.TEXT,
  })
  sourceType: RequirementSourceType;

  @Column({ type: 'varchar', length: 255, nullable: true })
  originalFileName: string | null;

  @OneToMany(() => TestCase, (testCase) => testCase.requirement, {
    cascade: true,
  })
  testCases: TestCase[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

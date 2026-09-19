import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { TestCaseCategory, TestCasePriority, TestCaseStatus } from '../entities/test-case.entity';

export class UpdateTestCaseDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  title?: string;

  @IsOptional()
  @IsEnum(TestCaseCategory)
  category?: TestCaseCategory;

  @IsOptional()
  @IsEnum(TestCasePriority)
  priority?: TestCasePriority;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  preconditions?: string | null;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  @Type(() => String)
  steps?: string[];

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  expectedResult?: string;

  @IsOptional()
  @IsEnum(TestCaseStatus)
  status?: TestCaseStatus;
}

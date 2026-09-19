import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { TestCaseCategory, TestCasePriority } from '../entities/test-case.entity';

export class CreateTestCaseDto {
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  title: string;

  @IsEnum(TestCaseCategory)
  category: TestCaseCategory;

  @IsOptional()
  @IsEnum(TestCasePriority)
  priority?: TestCasePriority;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  preconditions?: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  @Type(() => String)
  steps: string[];

  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  expectedResult: string;
}

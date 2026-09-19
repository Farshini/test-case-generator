import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Requirement } from './entities/requirement.entity';
import { RequirementsService } from './requirements.service';
import { RequirementsController } from './requirements.controller';
import { TextExtractionService } from './text-extraction.service';
import { AiModule } from '../ai/ai.module';
import { TestCasesModule } from '../test-cases/test-cases.module';

@Module({
  imports: [TypeOrmModule.forFeature([Requirement]), AiModule, TestCasesModule],
  providers: [RequirementsService, TextExtractionService],
  controllers: [RequirementsController],
})
export class RequirementsModule {}

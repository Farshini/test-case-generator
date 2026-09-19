import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { TestCasesService } from './test-cases.service';
import { UpdateTestCaseDto } from './dto/update-test-case.dto';
import { CreateTestCaseDto } from './dto/create-test-case.dto';

@Controller()
export class TestCasesController {
  constructor(private readonly testCasesService: TestCasesService) {}

  @Get('requirements/:requirementId/test-cases')
  findAllForRequirement(
    @Param('requirementId', ParseUUIDPipe) requirementId: string,
  ) {
    return this.testCasesService.findAllForRequirement(requirementId);
  }

  @Post('requirements/:requirementId/test-cases')
  create(
    @Param('requirementId', ParseUUIDPipe) requirementId: string,
    @Body() dto: CreateTestCaseDto,
  ) {
    return this.testCasesService.create(requirementId, dto);
  }

  @Post('requirements/:requirementId/test-cases/save')
  saveAll(@Param('requirementId', ParseUUIDPipe) requirementId: string) {
    return this.testCasesService.markAllSaved(requirementId);
  }

  @Get('test-cases/:id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.testCasesService.findOne(id);
  }

  @Patch('test-cases/:id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateTestCaseDto) {
    return this.testCasesService.update(id, dto);
  }

  @Delete('test-cases/:id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.testCasesService.remove(id);
  }
}

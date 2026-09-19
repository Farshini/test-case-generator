import { IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateRequirementDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  // Required when no file is uploaded; validated in the controller since
  // multipart form fields arrive as strings regardless of the file branch.
  @IsOptional()
  @IsString()
  @MinLength(10, {
    message: 'Requirement text must be at least 10 characters long.',
  })
  @MaxLength(20000)
  content?: string;
}

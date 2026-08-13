import { IsString, IsOptional, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateProjectDto {
  @ApiProperty({ example: 'My Project' })
  @IsString()
  @MinLength(3)
  name: string;

  @ApiProperty({ example: 'Project description', required: false })
  @IsString()
  @IsOptional()
  description?: string;
}
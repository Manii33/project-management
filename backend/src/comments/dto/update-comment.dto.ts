import { IsString, MinLength, MaxLength, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateCommentDto {
  @ApiProperty({ required: false })
  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  @IsOptional()
  content?: string;
}
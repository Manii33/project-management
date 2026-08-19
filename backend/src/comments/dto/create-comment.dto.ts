import { IsString, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCommentDto {
  @ApiProperty({ example: 'Great, I will look into this' })
  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  content: string;
}
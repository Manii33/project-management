import { IsString, IsOptional, IsEnum, IsUUID, IsDateString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IssueStatus, IssuePriority } from '../issue.entity';

export class UpdateIssueDto {
  @ApiProperty({ required: false })
  @IsString()
  @MinLength(3)
  @IsOptional()
  title?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ enum: IssueStatus, required: false })
  @IsEnum(IssueStatus)
  @IsOptional()
  status?: IssueStatus;

  @ApiProperty({ enum: IssuePriority, required: false })
  @IsEnum(IssuePriority)
  @IsOptional()
  priority?: IssuePriority;

  @ApiProperty({ required: false })
  @IsDateString()
  @IsOptional()
  dueDate?: string;

  @ApiProperty({ required: false })
  @IsUUID()
  @IsOptional()
  assigneeId?: string;
}
import { IsString, IsOptional, IsEnum, IsUUID, IsDateString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IssueStatus, IssuePriority } from '../issue.entity';

export class CreateIssueDto {
  @ApiProperty({ example: 'Fix login bug' })
  @IsString()
  @MinLength(3)
  title: string;

  @ApiProperty({ example: 'Login fails on mobile', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ enum: IssueStatus, default: IssueStatus.TODO, required: false })
  @IsEnum(IssueStatus)
  @IsOptional()
  status?: IssueStatus;

  @ApiProperty({ enum: IssuePriority, default: IssuePriority.MEDIUM, required: false })
  @IsEnum(IssuePriority)
  @IsOptional()
  priority?: IssuePriority;

  @ApiProperty({ example: '2026-12-31', required: false })
  @IsDateString()
  @IsOptional()
  dueDate?: string;

  @ApiProperty({ example: 'user-uuid', required: false })
  @IsUUID()
  @IsOptional()
  assigneeId?: string;
}
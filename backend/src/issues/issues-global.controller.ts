import { Controller, Get, Query, Request, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { IssuesService } from './issues.service';
import { QueryIssueDto } from './dto/query-issue.dto';
import { UserRole } from '../users/user.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';

@ApiTags('Issues')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('issues')
export class IssuesGlobalController {
  constructor(private issuesService: IssuesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all issues across projects the user belongs to' })
  findAll(@Query() query: QueryIssueDto, @Request() req: AuthenticatedRequest) {
    const isAdmin = req.user.role === UserRole.ADMIN;
    return this.issuesService.findAllGlobal(query, req.user.id, isAdmin);
  }
}
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { IssuesService } from './issues.service';
import { CreateIssueDto } from './dto/create-issue.dto';
import { UpdateIssueDto } from './dto/update-issue.dto';
import { QueryIssueDto } from './dto/query-issue.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UserRole } from '../users/user.entity';
import { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';

@ApiTags('Issues')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('projects/:projectId/issues')
export class IssuesController {
  constructor(private issuesService: IssuesService) {}

  @Post()
  @ApiOperation({ summary: 'Create issue (project members only)' })
  create(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Body() dto: CreateIssueDto,
    @Request() req: AuthenticatedRequest,
  ) {
    const isAdmin = req.user.role === UserRole.ADMIN;
    return this.issuesService.create(projectId, dto, req.user.id, isAdmin);
  }

  @Get()
  @ApiOperation({ summary: 'Get all issues with filtering & search' })
  findAll(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Query() query: QueryIssueDto,
    @Request() req: AuthenticatedRequest,
  ) {
    const isAdmin = req.user.role === UserRole.ADMIN;
    return this.issuesService.findAll(projectId, query, req.user.id, isAdmin);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get issue by id' })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: AuthenticatedRequest,
  ) {
    const isAdmin = req.user.role === UserRole.ADMIN;
    return this.issuesService.findOne(id, req.user.id, isAdmin);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update issue' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateIssueDto,
    @Request() req: AuthenticatedRequest,
  ) {
    const isAdmin = req.user.role === UserRole.ADMIN;
    return this.issuesService.update(id, dto, req.user.id, isAdmin);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete issue (creator only)' })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.issuesService.remove(id, req.user.id);
  }
}
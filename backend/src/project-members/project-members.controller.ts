import {
  Controller,
  Post,
  Delete,
  Get,
  Param,
  Body,
  UseGuards,
  Request,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ProjectMembersService } from './project-members.service';
import { AddMemberDto } from './dto/add-member.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';

@ApiTags('Project Members')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('projects/:projectId/members')
export class ProjectMembersController {
  constructor(private projectMembersService: ProjectMembersService) {}

  @Post()
  @ApiOperation({ summary: 'Add member to project' })
  addMember(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Body() dto: AddMemberDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.projectMembersService.addMember(projectId, dto.userId, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get project members' })
  getMembers(@Param('projectId', ParseUUIDPipe) projectId: string) {
    return this.projectMembersService.getMembers(projectId);
  }

  @Delete(':userId')
  @ApiOperation({ summary: 'Remove member from project' })
  removeMember(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('userId', ParseUUIDPipe) userId: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.projectMembersService.removeMember(projectId, userId, req.user.id);
  }
}
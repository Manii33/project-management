import { Controller, Get, Param, UseGuards, Request, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ActivityService } from './activity.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';
import { ProjectMembersService } from '../project-members/project-members.service';
import { ForbiddenException } from '@nestjs/common';

@ApiTags('Activity')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('projects/:projectId/activity')
export class ActivityController {
  constructor(
    private activityService: ActivityService,
    private projectMembersService: ProjectMembersService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get project activity log' })
  async getActivity(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Query('limit') limit: number,
    @Request() req: AuthenticatedRequest,
  ) {
    const members = await this.projectMembersService.getMembers(projectId);
    const isMember = members.some((m) => m.user.id === req.user.id);

    if (!isMember) {
      throw new ForbiddenException('Only project members can view activity');
    }

    return this.activityService.getProjectActivity(projectId, limit);
  }
}
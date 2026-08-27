import { Controller, Get, Param, UseGuards, Request, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ActivityService } from './activity.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';
import { UserRole } from '../users/user.entity';
import { ForbiddenException } from '@nestjs/common';

@ApiTags('Activity')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('projects/:projectId/activity')
export class ActivityController {
  constructor(private activityService: ActivityService) {}

  @Get()
  @ApiOperation({ summary: 'Get project activity log' })
  async getActivity(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Query('limit') limit: number,
    @Request() req: AuthenticatedRequest,
  ) {
    if (req.user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admins can view activity log');
    }

    return this.activityService.getProjectActivity(projectId, limit);
  }
}
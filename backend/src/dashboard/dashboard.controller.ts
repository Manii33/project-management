import { Controller, Get, Param, UseGuards, ParseUUIDPipe, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';

@ApiTags('Dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('projects/:projectId/dashboard')
export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  @Get()
  @ApiOperation({ summary: 'Get project dashboard stats (project members only)' })
  getStats(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.dashboardService.getProjectStats(projectId, req.user.id);
  }
}
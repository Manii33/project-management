import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Issue } from '../issues/issue.entity';
import { ProjectMember } from '../project-members/project-member.entity';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Issue, ProjectMember])],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
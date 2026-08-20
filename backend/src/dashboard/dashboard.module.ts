import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Issue } from '../issues/issue.entity';
import { IssuesModule } from '../issues/issues.module';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Issue]), IssuesModule],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
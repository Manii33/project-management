import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Issue } from './issue.entity';
import { IssuesService } from './issues.service';
import { IssuesController } from './issues.controller';
import { IssuesGlobalController } from './issues-global.controller';
import { ProjectMember } from '../project-members/project-member.entity';
import { Project } from '../projects/project.entity';
import { ActivityModule } from '../activity/activity.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Issue, ProjectMember, Project]),
    ActivityModule,
  ],
  controllers: [IssuesController, IssuesGlobalController],
  providers: [IssuesService],
  exports: [IssuesService],
})
export class IssuesModule {}
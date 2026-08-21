import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectMember } from './project-member.entity';
import { ProjectMembersService } from './project-members.service';
import { ProjectMembersController } from './project-members.controller';
import { ProjectsModule } from '../projects/projects.module';
import { UsersModule } from '../users/users.module';
import { ActivityModule } from '../activity/activity.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ProjectMember]),
    ProjectsModule,
    UsersModule,
    ActivityModule,
  ],
  controllers: [ProjectMembersController],
  providers: [ProjectMembersService],
})
export class ProjectMembersModule {}
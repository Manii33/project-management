import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Comment } from './comment.entity';
import { CommentsService } from './comments.service';
import { CommentsController } from './comments.controller';
import { Issue } from '../issues/issue.entity';
import { IssuesModule } from '../issues/issues.module';

@Module({
  imports: [TypeOrmModule.forFeature([Comment, Issue]), IssuesModule],
  controllers: [CommentsController],
  providers: [CommentsService],
})
export class CommentsModule {}
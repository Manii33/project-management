import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from './comment.entity';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { Issue } from '../issues/issue.entity';
import { IssuesService } from '../issues/issues.service';
import { SAFE_USER_SELECT } from '../common/safe-user-select';
import { ActivityService } from '../activity/activity.service';
import { ActivityAction } from '../activity/activity.entity';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(Comment)
    private commentsRepository: Repository<Comment>,
    @InjectRepository(Issue)
    private issuesRepository: Repository<Issue>,
    private issuesService: IssuesService,
    private activityService: ActivityService,
  ) {}

  private async getIssueWithProject(issueId: string): Promise<Issue> {
    const issue = await this.issuesRepository.findOne({
      where: { id: issueId },
      relations: { project: true },
    });
    if (!issue) throw new NotFoundException('Issue not found');
    return issue;
  }

  private async requireMember(issueId: string, userId: string, isAdmin = false): Promise<void> {
    const issue = await this.getIssueWithProject(issueId);
    if (!(await this.issuesService.isMember(issue.project.id, userId, isAdmin))) {
      throw new ForbiddenException('Only project members can interact with comments');
    }
  }

  private async findComment(issueId: string, commentId: string) {
    const comment = await this.commentsRepository.findOne({
      where: { id: commentId },
      relations: { issue: { project: true }, author: true },
    });
    if (!comment) throw new NotFoundException('Comment not found');
    if (comment.issue.id !== issueId) {
      throw new NotFoundException('Comment not found for this issue');
    }
    return comment;
  }

  async create(issueId: string, dto: CreateCommentDto, authorId: string, isAdmin = false): Promise<Comment> {
    await this.requireMember(issueId, authorId, isAdmin);

    const issue = await this.getIssueWithProject(issueId);

    const comment = this.commentsRepository.create({
      content: dto.content,
      issue: { id: issueId } as any,
      author: { id: authorId } as any,
    });

    const saved = await this.commentsRepository.save(comment);

    await this.activityService.log(
      ActivityAction.COMMENT_ADDED,
      authorId,
      issue.project.id,
      { issueId, commentId: saved.id },
    );

    return this.commentsRepository.findOne({
      where: { id: saved.id },
      select: {
        id: true,
        content: true,
        createdAt: true,
        updatedAt: true,
        author: SAFE_USER_SELECT,
      },
    });
  }

  async findAll(issueId: string, userId: string, isAdmin = false) {
    await this.requireMember(issueId, userId, isAdmin);

    return this.commentsRepository.find({
      where: { issue: { id: issueId } },
      select: {
        id: true,
        content: true,
        createdAt: true,
        updatedAt: true,
        author: SAFE_USER_SELECT,
      },
      order: { createdAt: 'ASC' },
    });
  }

  async update(issueId: string, commentId: string, dto: UpdateCommentDto, userId: string, isAdmin: boolean) {
    const comment = await this.findComment(issueId, commentId);
    await this.requireMember(comment.issue.id, userId, isAdmin);

    if (!isAdmin && comment.author.id !== userId) {
      throw new ForbiddenException('Only the comment author can edit it');
    }

    comment.content = dto.content ?? comment.content;
    const saved = await this.commentsRepository.save(comment);

    return this.commentsRepository.findOne({
      where: { id: saved.id },
      select: {
        id: true,
        content: true,
        createdAt: true,
        updatedAt: true,
        author: SAFE_USER_SELECT,
      },
    });
  }

  async remove(issueId: string, commentId: string, userId: string, isAdmin: boolean): Promise<void> {
    const comment = await this.findComment(issueId, commentId);
    await this.requireMember(comment.issue.id, userId, isAdmin);

    if (!isAdmin && comment.author.id !== userId) {
      throw new ForbiddenException('Only the comment author can delete it');
    }

    await this.activityService.log(
      ActivityAction.COMMENT_DELETED,
      userId,
      comment.issue.project.id,
      { commentId, issueId },
    );

    await this.commentsRepository.remove(comment);
  }
}
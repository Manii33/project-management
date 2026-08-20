import { Injectable, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Issue, IssueStatus } from '../issues/issue.entity';
import { IssuesService } from '../issues/issues.service';
import { SAFE_USER_SELECT } from '../common/safe-user-select';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Issue)
    private issuesRepository: Repository<Issue>,
    private issuesService: IssuesService,
  ) {}

  async getProjectStats(projectId: string, userId: string) {
    if (!(await this.issuesService.isMember(projectId, userId))) {
      throw new ForbiddenException('Only project members can view the dashboard');
    }

    const now = new Date();

    // Total issues
    const total = await this.issuesRepository.count({
      where: { project: { id: projectId } },
    });

    // By status
    const byStatus = await this.issuesRepository
      .createQueryBuilder('issue')
      .select('issue.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .where('issue.project = :projectId', { projectId })
      .groupBy('issue.status')
      .getRawMany();

    // By priority
    const byPriority = await this.issuesRepository
      .createQueryBuilder('issue')
      .select('issue.priority', 'priority')
      .addSelect('COUNT(*)', 'count')
      .where('issue.project = :projectId', { projectId })
      .groupBy('issue.priority')
      .getRawMany();

    // By assignee
    const byAssignee = await this.issuesRepository
      .createQueryBuilder('issue')
      .select('assignee.name', 'name')
      .addSelect('assignee.id', 'id')
      .addSelect('COUNT(*)', 'count')
      .leftJoin('issue.assignee', 'assignee')
      .where('issue.project = :projectId', { projectId })
      .andWhere('assignee.id IS NOT NULL')
      .groupBy('assignee.id')
      .addGroupBy('assignee.name')
      .getRawMany();

    // Overdue
    const overdue = await this.issuesRepository
      .createQueryBuilder('issue')
      .where('issue.project = :projectId', { projectId })
      .andWhere('issue.dueDate < :now', { now })
      .andWhere('issue.status != :done', { done: IssueStatus.DONE })
      .getCount();

    // Completion %
    const completed = byStatus.find((s) => s.status === IssueStatus.DONE)?.count ?? 0;
    const completionPercent = total > 0 ? Math.round((Number(completed) / total) * 100) : 0;

    // Recent activity
    const recentIssues = await this.issuesRepository.find({
      where: { project: { id: projectId } },
      select: {
        id: true,
        title: true,
        order: true,
        status: true,
        priority: true,
        dueDate: true,
        createdAt: true,
        updatedAt: true,
        creator: SAFE_USER_SELECT,
        assignee: SAFE_USER_SELECT,
      },
      order: { updatedAt: 'DESC' },
      take: 5,
    });

    return {
      total,
      completed: Number(completed),
      inProgress: Number(byStatus.find((s) => s.status === IssueStatus.IN_PROGRESS)?.count ?? 0),
      inReview: Number(byStatus.find((s) => s.status === IssueStatus.IN_REVIEW)?.count ?? 0),
      todo: Number(byStatus.find((s) => s.status === IssueStatus.TODO)?.count ?? 0),
      overdue,
      completionPercent,
      byStatus,
      byPriority,
      byAssignee,
      recentActivity: recentIssues,
    };
  }
}
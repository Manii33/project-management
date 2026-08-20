import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, ILike, FindOptionsWhere, FindManyOptions } from 'typeorm';
import { Issue } from './issue.entity';
import { CreateIssueDto } from './dto/create-issue.dto';
import { UpdateIssueDto } from './dto/update-issue.dto';
import { QueryIssueDto } from './dto/query-issue.dto';
import { ProjectMember } from '../project-members/project-member.entity';
import { Project } from '../projects/project.entity';
import { SAFE_USER_SELECT } from '../common/safe-user-select';

@Injectable()
export class IssuesService {
  constructor(
    @InjectRepository(Issue)
    private issuesRepository: Repository<Issue>,
    @InjectRepository(ProjectMember)
    private membersRepository: Repository<ProjectMember>,
    @InjectRepository(Project)
    private projectsRepository: Repository<Project>,
  ) {}

  async isMember(projectId: string, userId: string): Promise<boolean> {
    // Owner is always a member
    const project = await this.projectsRepository.findOne({
      where: { id: projectId },
      relations: { owner: true },
    });
    if (project?.owner?.id === userId) return true;

    const member = await this.membersRepository.findOne({
      where: { project: { id: projectId }, user: { id: userId } },
    });
    return !!member;
  }

  async create(projectId: string, dto: CreateIssueDto, creatorId: string): Promise<Issue> {
    const member = await this.isMember(projectId, creatorId);
    if (!member) throw new ForbiddenException('Only project members can create issues');

    // Validate assignee is a member
    if (dto.assigneeId) {
      const assigneeMember = await this.isMember(projectId, dto.assigneeId);
      if (!assigneeMember) throw new ForbiddenException('Assignee must be a project member');
    }

    const issue = this.issuesRepository.create({
      title: dto.title,
      description: dto.description,
      status: dto.status,
      priority: dto.priority,
      dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      project: { id: projectId } as any,
      creator: { id: creatorId } as any,
      assignee: dto.assigneeId ? { id: dto.assigneeId } as any : undefined,
    });

    return this.issuesRepository.save(issue);
  }

  async findAll(projectId: string, query: QueryIssueDto, userId: string) {
    const member = await this.isMember(projectId, userId);
    if (!member) throw new ForbiddenException('Only project members can view issues');

    const { status, priority, assigneeId, search, page = 1, limit = 10 } = query;

    const qb = this.issuesRepository
  .createQueryBuilder('issue')
  .leftJoinAndSelect('issue.creator', 'creator')
  .leftJoinAndSelect('issue.assignee', 'assignee')
  .select([
    'issue.id',
    'issue.title',
    'issue.order',
    'issue.description',
    'issue.status',
    'issue.priority',
    'issue.dueDate',
    'issue.createdAt',
    'issue.updatedAt',
    'creator.id',
    'creator.name',
    'creator.email',
    'creator.role',
    'assignee.id',
    'assignee.name',
    'assignee.email',
    'assignee.role',
  ])
  .where('issue.project = :projectId', { projectId })
  .orderBy('issue.order', 'ASC')
  .addOrderBy('issue.createdAt', 'DESC');

    if (status) qb.andWhere('issue.status = :status', { status });
    if (priority) qb.andWhere('issue.priority = :priority', { priority });
    if (assigneeId) qb.andWhere('assignee.id = :assigneeId', { assigneeId });
    if (search) {
      qb.andWhere(
        '(LOWER(issue.title) LIKE LOWER(:search) OR LOWER(issue.description) LIKE LOWER(:search))',
        { search: `%${search}%` },
      );
    }

    const total = await qb.getCount();
    const data = await qb.skip((page - 1) * limit).take(limit).getMany();

    return { data, total, page, limit };
  }

  async findAllGlobal(query: QueryIssueDto, userId: string) {
    const { status, priority, assigneeId, search, page = 1, limit = 10 } = query;

    const memberships = await this.membersRepository.find({
      where: { user: { id: userId } },
      relations: { project: true },
    });
    const projectIds = memberships.map((m) => m.project.id);
    if (projectIds.length === 0) return { data: [], total: 0, page, limit };

    const buildWhere = (): FindOptionsWhere<Issue> => {
      const where: FindOptionsWhere<Issue> = { project: { id: In(projectIds) } };
      if (status) where.status = status;
      if (priority) where.priority = priority;
      if (assigneeId) where.assignee = { id: assigneeId };
      return where;
    };

    const base: FindManyOptions<Issue> = {
      select: {
        id: true,
        title: true,
        order: true,
        description: true,
        status: true,
        priority: true,
        dueDate: true,
        createdAt: true,
        updatedAt: true,
        project: { id: true, name: true },
        creator: SAFE_USER_SELECT,
        assignee: SAFE_USER_SELECT,
      },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    };

    let data: Issue[];
    let total: number;
    if (search) {
      const where = buildWhere();
      const pattern = `%${search}%`;
      [data, total] = await this.issuesRepository.findAndCount({
        ...base,
        where: [
          { ...where, title: ILike(pattern) },
          { ...where, description: ILike(pattern) },
        ],
      });
    } else {
      [data, total] = await this.issuesRepository.findAndCount({
        ...base,
        where: buildWhere(),
      });
    }

    return { data, total, page, limit };
  }

  async findOne(id: string, userId: string): Promise<Issue> {
    const issue = await this.issuesRepository.findOne({
      where: { id },
      select: {
        id: true,
        title: true,
        order: true,
        description: true,
        status: true,
        priority: true,
        dueDate: true,
        createdAt: true,
        updatedAt: true,
        project: { id: true },
        creator: SAFE_USER_SELECT,
        assignee: SAFE_USER_SELECT,
      },
    });
    if (!issue) throw new NotFoundException('Issue not found');

    const member = await this.isMember(issue.project.id, userId);
    if (!member) throw new ForbiddenException('Only project members can view issues');

    return issue;
  }

  async update(id: string, dto: UpdateIssueDto, userId: string): Promise<Issue> {
    const issue = await this.findOne(id, userId);

    if (dto.assigneeId) {
      const assigneeMember = await this.isMember(issue.project.id, dto.assigneeId);
      if (!assigneeMember) throw new ForbiddenException('Assignee must be a project member');
    }

    Object.assign(issue, {
      ...dto,
      dueDate: dto.dueDate ? new Date(dto.dueDate) : issue.dueDate,
      assignee: dto.assigneeId ? { id: dto.assigneeId } as any : issue.assignee,
    });

    return this.issuesRepository.save(issue);
  }

  async remove(id: string, userId: string): Promise<void> {
    const issue = await this.findOne(id, userId);
    if (issue.creator.id !== userId) {
      throw new ForbiddenException('Only issue creator can delete it');
    }
    await this.issuesRepository.remove(issue);
  }
}
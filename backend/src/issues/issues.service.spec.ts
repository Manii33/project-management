import { Test, TestingModule } from '@nestjs/testing';
import { IssuesService } from './issues.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Issue, IssueStatus, IssuePriority } from './issue.entity';
import { ProjectMember } from '../project-members/project-member.entity';
import { Project } from '../projects/project.entity';
import { ActivityService } from '../activity/activity.service';
import { ForbiddenException, NotFoundException } from '@nestjs/common';

const mockProject = {
  id: 'project-uuid',
  owner: { id: 'owner-uuid' },
};

const mockIssue = {
  id: 'issue-uuid',
  title: 'Test Issue',
  description: 'Test',
  status: IssueStatus.TODO,
  priority: IssuePriority.MEDIUM,
  order: 0,
  project: { id: 'project-uuid' },
  creator: { id: 'user-uuid', name: 'Test User' },
  assignee: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockMember = {
  id: 'member-uuid',
  project: { id: 'project-uuid' },
  user: { id: 'user-uuid' },
};

const mockQueryBuilder = (returnValue: unknown = mockIssue) => ({
  leftJoinAndSelect: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  addOrderBy: jest.fn().mockReturnThis(),
  getCount: jest.fn().mockResolvedValue(1),
  skip: jest.fn().mockReturnThis(),
  take: jest.fn().mockReturnThis(),
  getMany: jest.fn().mockResolvedValue([mockIssue]),
  getOne: jest.fn().mockResolvedValue(returnValue),
});

const mockIssueRepository = {
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  remove: jest.fn(),
  findAndCount: jest.fn(),
  createQueryBuilder: jest.fn(() => mockQueryBuilder()),
};

const mockMemberRepository = {
  findOne: jest.fn(),
  find: jest.fn(),
};

const mockProjectRepository = {
  findOne: jest.fn(),
};

const mockActivityService = {
  log: jest.fn(),
};

describe('IssuesService', () => {
  let service: IssuesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IssuesService,
        { provide: getRepositoryToken(Issue), useValue: mockIssueRepository },
        { provide: getRepositoryToken(ProjectMember), useValue: mockMemberRepository },
        { provide: getRepositoryToken(Project), useValue: mockProjectRepository },
        { provide: ActivityService, useValue: mockActivityService },
      ],
    }).compile();

    service = module.get<IssuesService>(IssuesService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create issue for project member', async () => {
      mockProjectRepository.findOne.mockResolvedValue(mockProject);
      mockMemberRepository.findOne.mockResolvedValue(mockMember);
      mockIssueRepository.create.mockReturnValue(mockIssue);
      mockIssueRepository.save.mockResolvedValue(mockIssue);

      const result = await service.create(
        'project-uuid',
        { title: 'Test Issue' },
        'user-uuid',
      );

      expect(result.title).toBe('Test Issue');
    });

    it('should throw ForbiddenException if not a member', async () => {
      mockProjectRepository.findOne.mockResolvedValue(mockProject);
      mockMemberRepository.findOne.mockResolvedValue(null);

      await expect(
        service.create('project-uuid', { title: 'Test' }, 'non-member-uuid'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException if assignee is not a member', async () => {
      mockProjectRepository.findOne.mockResolvedValue(mockProject);
      mockMemberRepository.findOne
        .mockResolvedValueOnce(mockMember)
        .mockResolvedValueOnce(null);

      await expect(
        service.create(
          'project-uuid',
          { title: 'Test', assigneeId: 'non-member-uuid' },
          'user-uuid',
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('update', () => {
    it('should update issue status and log activity', async () => {
      mockProjectRepository.findOne.mockResolvedValue(mockProject);
      mockMemberRepository.findOne.mockResolvedValue(mockMember);
      mockIssueRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder({ ...mockIssue, project: { id: 'project-uuid' } }),
      );
      mockIssueRepository.save.mockResolvedValue({
        ...mockIssue,
        status: IssueStatus.IN_PROGRESS,
      });

      const result = await service.update(
        'issue-uuid',
        { status: IssueStatus.IN_PROGRESS },
        'user-uuid',
      );

      expect(result.status).toBe(IssueStatus.IN_PROGRESS);
      expect(mockActivityService.log).toHaveBeenCalled();
    });

    it('should throw ForbiddenException if assignee not a member', async () => {
      mockProjectRepository.findOne.mockResolvedValue(mockProject);
      mockMemberRepository.findOne
        .mockResolvedValueOnce(mockMember)
        .mockResolvedValueOnce(null);
      mockIssueRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder({ ...mockIssue, project: { id: 'project-uuid' } }),
      );

      await expect(
        service.update('issue-uuid', { assigneeId: 'non-member' }, 'user-uuid'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('remove', () => {
    it('should delete issue if user is creator', async () => {
      mockProjectRepository.findOne.mockResolvedValue(mockProject);
      mockMemberRepository.findOne.mockResolvedValue(mockMember);
      mockIssueRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder({
          ...mockIssue,
          project: { id: 'project-uuid' },
          creator: { id: 'user-uuid' },
        }),
      );
      mockIssueRepository.remove.mockResolvedValue(undefined);

      await expect(service.remove('issue-uuid', 'user-uuid')).resolves.not.toThrow();
      expect(mockActivityService.log).toHaveBeenCalled();
    });

    it('should throw ForbiddenException if not creator', async () => {
      mockProjectRepository.findOne.mockResolvedValue(mockProject);
      mockMemberRepository.findOne.mockResolvedValue(mockMember);
      mockIssueRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder({
          ...mockIssue,
          project: { id: 'project-uuid' },
          creator: { id: 'other-user-uuid' },
        }),
      );

      await expect(service.remove('issue-uuid', 'user-uuid')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('findOne', () => {
    it('should throw NotFoundException if issue not found', async () => {
      mockIssueRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder(null),
      );

      await expect(service.findOne('bad-uuid', 'user-uuid')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException if not a member', async () => {
      mockProjectRepository.findOne.mockResolvedValue(mockProject);
      mockMemberRepository.findOne.mockResolvedValue(null);
      mockIssueRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder({
          ...mockIssue,
          project: { id: 'project-uuid' },
        }),
      );

      await expect(service.findOne('issue-uuid', 'non-member')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});
import { Test, TestingModule } from '@nestjs/testing';
import { ProjectMembersService } from './project-members.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ProjectMember } from './project-member.entity';
import { ProjectsService } from '../projects/projects.service';
import { UsersService } from '../users/users.service';
import { ActivityService } from '../activity/activity.service';
import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';

const mockProject = {
  id: 'project-uuid',
  name: 'Test Project',
  owner: { id: 'owner-uuid', name: 'Owner' },
};

const mockUser = {
  id: 'user-uuid',
  name: 'Test User',
  email: 'test@test.com',
};

const mockMember = {
  id: 'member-uuid',
  project: { id: 'project-uuid' },
  user: mockUser,
};

const mockMemberRepository = {
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
  find: jest.fn(),
};

const mockProjectsService = { findOne: jest.fn() };
const mockUsersService = { findById: jest.fn() };
const mockActivityService = { log: jest.fn() };

describe('ProjectMembersService', () => {
  let service: ProjectMembersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectMembersService,
        { provide: getRepositoryToken(ProjectMember), useValue: mockMemberRepository },
        { provide: ProjectsService, useValue: mockProjectsService },
        { provide: UsersService, useValue: mockUsersService },
        { provide: ActivityService, useValue: mockActivityService },
      ],
    }).compile();

    service = module.get<ProjectMembersService>(ProjectMembersService);
    jest.clearAllMocks();
  });

  describe('addMember', () => {
    it('should add member to project', async () => {
      mockProjectsService.findOne.mockResolvedValue(mockProject);
      mockUsersService.findById.mockResolvedValue(mockUser);
      mockMemberRepository.findOne.mockResolvedValue(null);
      mockMemberRepository.create.mockReturnValue(mockMember);
      mockMemberRepository.save.mockResolvedValue(mockMember);

      const result = await service.addMember('project-uuid', 'user-uuid', 'owner-uuid');
      expect(result.user.id).toBe('user-uuid');
      expect(mockActivityService.log).toHaveBeenCalled();
    });

    it('should throw ForbiddenException if not owner', async () => {
      mockProjectsService.findOne.mockResolvedValue(mockProject);

      await expect(
        service.addMember('project-uuid', 'user-uuid', 'not-owner-uuid'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException if user not found', async () => {
      mockProjectsService.findOne.mockResolvedValue(mockProject);
      mockUsersService.findById.mockResolvedValue(null);

      await expect(
        service.addMember('project-uuid', 'bad-user', 'owner-uuid'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException if already a member', async () => {
      mockProjectsService.findOne.mockResolvedValue(mockProject);
      mockUsersService.findById.mockResolvedValue(mockUser);
      mockMemberRepository.findOne.mockResolvedValue(mockMember);

      await expect(
        service.addMember('project-uuid', 'user-uuid', 'owner-uuid'),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('removeMember', () => {
    it('should remove member', async () => {
      mockProjectsService.findOne.mockResolvedValue(mockProject);
      mockMemberRepository.findOne.mockResolvedValue(mockMember);
      mockMemberRepository.remove.mockResolvedValue(undefined);

      await expect(
        service.removeMember('project-uuid', 'user-uuid', 'owner-uuid'),
      ).resolves.not.toThrow();
      expect(mockActivityService.log).toHaveBeenCalled();
    });

    it('should throw ForbiddenException when removing owner', async () => {
      mockProjectsService.findOne.mockResolvedValue(mockProject);

      await expect(
        service.removeMember('project-uuid', 'owner-uuid', 'owner-uuid'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException if not owner', async () => {
      mockProjectsService.findOne.mockResolvedValue(mockProject);

      await expect(
        service.removeMember('project-uuid', 'user-uuid', 'not-owner'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException if member not found', async () => {
      mockProjectsService.findOne.mockResolvedValue(mockProject);
      mockMemberRepository.findOne.mockResolvedValue(null);

      await expect(
  service.removeMember('project-uuid', 'user-uuid', 'owner-uuid'),
).rejects.toThrow(NotFoundException);
    });
  });
});
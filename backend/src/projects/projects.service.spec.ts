import { Test, TestingModule } from '@nestjs/testing';
import { ProjectsService } from './projects.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Project, ProjectStatus } from './project.entity';
import { NotFoundException } from '@nestjs/common';

const mockProject = {
  id: 'project-uuid',
  name: 'Test Project',
  description: 'Test Description',
  status: ProjectStatus.PLANNING,
  owner: { id: 'user-uuid', name: 'Admin' },
  createdBy: { id: 'user-uuid', name: 'Admin' },
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockProjectRepository = {
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  remove: jest.fn(),
  createQueryBuilder: jest.fn(() => ({
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    getCount: jest.fn().mockResolvedValue(1),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue([mockProject]),
  })),
};

describe('ProjectsService', () => {
  let service: ProjectsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectsService,
        {
          provide: getRepositoryToken(Project),
          useValue: mockProjectRepository,
        },
      ],
    }).compile();

    service = module.get<ProjectsService>(ProjectsService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a project successfully', async () => {
      mockProjectRepository.create.mockReturnValue(mockProject);
      mockProjectRepository.save.mockResolvedValue(mockProject);

      const result = await service.create(
        { name: 'Test Project', description: 'Test' },
        'user-uuid',
      );

      expect(result.name).toBe('Test Project');
      expect(mockProjectRepository.save).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return project by id', async () => {
      mockProjectRepository.findOne.mockResolvedValue(mockProject);

      const result = await service.findOne('project-uuid');
      expect(result.id).toBe('project-uuid');
    });

    it('should throw NotFoundException if not found', async () => {
      mockProjectRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('bad-uuid')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update project', async () => {
      mockProjectRepository.findOne.mockResolvedValue({ ...mockProject });
      mockProjectRepository.save.mockResolvedValue({
        ...mockProject,
        name: 'Updated Project',
      });

      const result = await service.update('project-uuid', { name: 'Updated Project' });
      expect(result.name).toBe('Updated Project');
    });
  });

  describe('archive', () => {
    it('should archive a project', async () => {
      mockProjectRepository.findOne.mockResolvedValue({ ...mockProject });
      mockProjectRepository.save.mockResolvedValue({
        ...mockProject,
        status: ProjectStatus.ARCHIVED,
      });

      const result = await service.archive('project-uuid');
      expect(result.status).toBe(ProjectStatus.ARCHIVED);
    });
  });

  describe('remove', () => {
    it('should delete a project', async () => {
      mockProjectRepository.findOne.mockResolvedValue(mockProject);
      mockProjectRepository.remove.mockResolvedValue(undefined);

      await expect(service.remove('project-uuid')).resolves.not.toThrow();
    });
  });
});
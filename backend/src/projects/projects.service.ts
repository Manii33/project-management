import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project, ProjectStatus } from './project.entity';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { QueryProjectDto } from './dto/query-project.dto';
import { SAFE_USER_SELECT } from '../common/safe-user-select';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private projectsRepository: Repository<Project>,
  ) {}

  async create(dto: CreateProjectDto, userId: string): Promise<Project> {
    const project = this.projectsRepository.create({
      name: dto.name,
      description: dto.description,
      status: dto.status,
      owner: { id: userId } as any,
      createdBy: { id: userId } as any,
    });
    return this.projectsRepository.save(project);
  }

  async findAll(query: QueryProjectDto): Promise<{ data: Project[]; total: number; page: number; limit: number }> {
    const { status, page = 1, limit = 10 } = query;

    const qb = this.projectsRepository.createQueryBuilder('project')
      .leftJoinAndSelect('project.owner', 'owner')
      .leftJoinAndSelect('project.createdBy', 'createdBy')
      .select([
        'project.id',
        'project.name',
        'project.description',
        'project.status',
        'project.createdAt',
        'project.updatedAt',
        'owner.id',
        'owner.name',
        'owner.email',
        'owner.role',
        'createdBy.id',
        'createdBy.name',
        'createdBy.email',
        'createdBy.role',
      ])
      .orderBy('project.createdAt', 'DESC');

    if (status) {
      qb.andWhere('project.status = :status', { status });
    }

    const total = await qb.getCount();
    const data = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    return { data, total, page, limit };
  }

  async findOne(id: string): Promise<Project> {
    const project = await this.projectsRepository.findOne({
      where: { id },
      select: {
        id: true,
        name: true,
        description: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        owner: SAFE_USER_SELECT,
        createdBy: SAFE_USER_SELECT,
      },
    });
    if (!project) throw new NotFoundException('Project not found');
    return project;
  }

  async update(id: string, dto: UpdateProjectDto): Promise<Project> {
    const project = await this.findOne(id);
    Object.assign(project, dto);
    return this.projectsRepository.save(project);
  }

  async archive(id: string): Promise<Project> {
    const project = await this.findOne(id);
    project.status = ProjectStatus.ARCHIVED;
    return this.projectsRepository.save(project);
  }

  async remove(id: string): Promise<void> {
    const project = await this.findOne(id);
    await this.projectsRepository.remove(project);
  }
}
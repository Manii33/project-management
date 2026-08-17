import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProjectMember } from './project-member.entity';
import { ProjectsService } from '../projects/projects.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class ProjectMembersService {
  constructor(
    @InjectRepository(ProjectMember)
    private membersRepository: Repository<ProjectMember>,
    private projectsService: ProjectsService,
    private usersService: UsersService,
  ) {}

  async addMember(projectId: string, userId: string, requesterId: string): Promise<ProjectMember> {
    const project = await this.projectsService.findOne(projectId);

    if (project.owner.id !== requesterId) {
      throw new ForbiddenException('Only project owner can manage members');
    }

    const user = await this.usersService.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    const existing = await this.membersRepository.findOne({
      where: { project: { id: projectId }, user: { id: userId } },
    });
    if (existing) throw new ConflictException('User is already a member');

    const member = this.membersRepository.create({
      project: { id: projectId } as any,
      user: { id: userId } as any,
    });

    return this.membersRepository.save(member);
  }

  async removeMember(projectId: string, userId: string, requesterId: string): Promise<void> {
    const project = await this.projectsService.findOne(projectId);

    if (project.owner.id === userId) {
      throw new ForbiddenException('Project owner cannot be removed');
    }

    if (project.owner.id !== requesterId) {
      throw new ForbiddenException('Only project owner can manage members');
    }

    const member = await this.membersRepository.findOne({
      where: { project: { id: projectId }, user: { id: userId } },
    });

    if (!member) throw new NotFoundException('Member not found');

    await this.membersRepository.remove(member);
  }

  async getMembers(projectId: string): Promise<ProjectMember[]> {
    return this.membersRepository.find({
      where: { project: { id: projectId } },
      relations: { user: true },
      order: { joinedAt: 'ASC' },
    });
  }
}
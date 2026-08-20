import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Activity, ActivityAction } from './activity.entity';

@Injectable()
export class ActivityService {
  constructor(
    @InjectRepository(Activity)
    private activityRepository: Repository<Activity>,
  ) {}

  async log(
    action: ActivityAction,
    userId: string,
    projectId: string,
    meta?: Record<string, string>,
  ): Promise<void> {
    const activity = this.activityRepository.create({
      action,
      user: { id: userId } as any,
      project: { id: projectId } as any,
      meta,
    });
    await this.activityRepository.save(activity);
  }

  async getProjectActivity(projectId: string, limit = 20) {
    return this.activityRepository.find({
      where: { project: { id: projectId } },
      relations: { user: true },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }
}
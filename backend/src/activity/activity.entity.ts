import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
} from 'typeorm';
import { User } from '../users/user.entity';
import { Project } from '../projects/project.entity';

export enum ActivityAction {
  ISSUE_CREATED = 'ISSUE_CREATED',
  ISSUE_UPDATED = 'ISSUE_UPDATED',
  ISSUE_DELETED = 'ISSUE_DELETED',
  ISSUE_ASSIGNED = 'ISSUE_ASSIGNED',
  ISSUE_STATUS_CHANGED = 'ISSUE_STATUS_CHANGED',
  COMMENT_ADDED = 'COMMENT_ADDED',
  COMMENT_DELETED = 'COMMENT_DELETED',
  MEMBER_JOINED = 'MEMBER_JOINED',
  MEMBER_REMOVED = 'MEMBER_REMOVED',
}

@Entity('activities')
export class Activity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: ActivityAction })
  action: ActivityAction;

  @Column({ type: 'jsonb', nullable: true })
  meta: Record<string, string>;

  @ManyToOne(() => User, { eager: true })
  user: User;

  @ManyToOne(() => Project, { onDelete: 'CASCADE' })
  project: Project;

  @CreateDateColumn()
  createdAt: Date;
}
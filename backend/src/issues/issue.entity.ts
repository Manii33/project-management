import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
} from 'typeorm';
import { User } from '../users/user.entity';
import { Project } from '../projects/project.entity';

export enum IssueStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  IN_REVIEW = 'IN_REVIEW',
  DONE = 'DONE',
}

export enum IssuePriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

@Entity('issues')
export class Issue {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'int', default: 0 })
  order: number;

  @Column({ nullable: true, type: 'text' })
  description: string;

  @Column({ type: 'enum', enum: IssueStatus, default: IssueStatus.TODO })
  status: IssueStatus;

  @Column({ type: 'enum', enum: IssuePriority, default: IssuePriority.MEDIUM })
  priority: IssuePriority;

  @Column({ nullable: true, type: 'date' })
  dueDate: Date;

  @ManyToOne(() => Project, { eager: false, onDelete: 'CASCADE' })
  project: Project;

  @ManyToOne(() => User, { eager: true })
  creator: User;

  @ManyToOne(() => User, { eager: true, nullable: true })
  assignee: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
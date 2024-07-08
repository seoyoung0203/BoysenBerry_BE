import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { User } from './user.entity';

export enum ExType {
  QUESTION = 'question',
  ANSWER = 'answer',
  APPROVE_VOTE = 'approveVote',
}

@Entity()
export class ExperienceHistory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  experienceChange: number;

  @Column({ type: 'enum', enum: ExType })
  exType: ExType;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => User, (user) => user.experienceHistory)
  user: User;
}

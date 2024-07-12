import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Question } from './question.entity';
import { Answer } from './answer.entity';

@Entity()
export class Notification {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.notifications)
  user: User;

  @ManyToOne(() => Question, (question) => question.notifications, {
    nullable: true,
  })
  question: Question;

  @ManyToOne(() => Answer, (answer) => answer.notifications, { nullable: true })
  answer: Answer;

  @Column()
  message: string;

  @Column({ default: false })
  isRead: boolean;

  @CreateDateColumn()
  createdAt: Date;
}

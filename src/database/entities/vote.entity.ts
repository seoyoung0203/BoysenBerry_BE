import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { User } from './user.entity';
import { Question } from './question.entity';
import { Answer } from './answer.entity';

export enum VoteTypeEnum {
  APPROVE = 'approve',
  REJECT = 'reject',
}

export enum ContentType {
  QUESTION = 'question',
  ANSWER = 'answer',
}

@Entity()
export class Vote {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.votes)
  user: User;

  @ManyToOne(() => Question, (question) => question.votes, { nullable: true })
  question: Question;

  @ManyToOne(() => Answer, (answer) => answer.votes, { nullable: true })
  answer: Answer;

  @Column({ type: 'enum', enum: ContentType })
  contentType: 'question' | 'answer';

  @Column({ type: 'enum', enum: VoteTypeEnum })
  voteType: 'approve' | 'reject';

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}

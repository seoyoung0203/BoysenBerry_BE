import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { User } from './user.entity';
import { Question } from './question.entity';
import { Answer } from './answer.entity';

@Entity()
export class Vote {
  @PrimaryGeneratedColumn()
  voteId: number;

  @ManyToOne(() => User, (user) => user.votes)
  user: User;

  @ManyToOne(() => Question, (question) => question.votes, { nullable: true })
  question: Question;

  @ManyToOne(() => Answer, (answer) => answer.votes, { nullable: true })
  answer: Answer;

  @Column()
  isUpvote: boolean;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}

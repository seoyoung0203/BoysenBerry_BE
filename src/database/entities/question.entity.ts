import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { User } from './user.entity';
import { Answer } from './answer.entity';
import { Vote } from './vote.entity';

export enum QuestionStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
}

@Entity()
export class Question {
  @PrimaryGeneratedColumn()
  questionId: number;

  @ManyToOne(() => User, (user) => user.questions)
  user: User;

  @Column()
  title: string;

  @Column('text')
  body: string;

  @Column({ default: 0 })
  viewsCount: number;

  @Column({ default: 0 })
  approveCount: number;

  @Column({ default: 0 })
  rejectCount: number;

  @Column({ type: 'enum', enum: QuestionStatus })
  status: 'draft' | 'published';

  @Column({ default: true })
  isVisible: boolean;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date;

  @OneToMany(() => Answer, (answer) => answer.question)
  answers: Answer[];

  @OneToMany(() => Vote, (vote) => vote.question)
  votes: Vote[];
}

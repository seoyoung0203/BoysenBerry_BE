import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { User } from './user.entity';
import { Answer } from './answer.entity';
import { Vote } from './vote.entity';
import { Tag } from './tag.entity';
import { QuestionTag } from './question-tag.entity';

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
  upvotes: number;

  @Column({ default: 0 })
  downvotes: number;

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

  @ManyToMany(() => Tag, (tag) => tag.questions)
  @JoinTable()
  tags: Tag[];

  @OneToMany(() => QuestionTag, (questionTag) => questionTag.question)
  questionTags: QuestionTag[];
}

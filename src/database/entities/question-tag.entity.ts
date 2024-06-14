import { Entity, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { Question } from './question.entity';
import { Tag } from './tag.entity';

@Entity()
export class QuestionTag {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Question, (question) => question.questionTags)
  question: Question;

  @ManyToOne(() => Tag, (tag) => tag.questions)
  tag: Tag;
}

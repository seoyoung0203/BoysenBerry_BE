import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToOne,
} from 'typeorm';
import { Question } from './question.entity';
import { Answer } from './answer.entity';
import { UserProfile } from './user-profile.entity';
import { Vote } from './vote.entity';
import { Notification } from './notification.entity';
import { Level } from './level.entity';
import { ExperienceHistory } from './experience-history.entity';

export enum SocialLoginEnum {
  GITHUB = 'github',
  GOOGLE = 'google',
}

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column({ select: false })
  password: string;

  @Column({ unique: true })
  nickname: string;

  @Column({ default: false })
  isEmailConsent: boolean;

  @Column({ nullable: true })
  profilePicture: string;

  @Column({ default: 0 })
  experience: number;

  // 초기는 최신 데이터를 그때그때 보여주고 나중에는 rank 데이터를 저장해서 하루 마다 업데이트 하는 방식으로
  @Column({ default: 0 })
  totalExperience: number;

  @Column({ default: 0 })
  previousRank: number;

  @Column({ type: 'enum', enum: SocialLoginEnum, nullable: true })
  socialLoginType: 'github' | 'google';

  @Column({ nullable: true })
  socialLoginId: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date;

  @ManyToOne(() => Level, (level) => level.users)
  level: Level;

  @OneToMany(() => Question, (question) => question.user)
  questions: Question[];

  @OneToMany(() => Answer, (answer) => answer.user)
  answers: Answer[];

  @OneToMany(() => UserProfile, (profile) => profile.user)
  profiles: UserProfile[];

  @OneToMany(() => Vote, (vote) => vote.user)
  votes: Vote[];

  @OneToMany(() => Notification, (notification) => notification.user)
  notifications: Notification[];

  @OneToMany(
    () => ExperienceHistory,
    (experienceHistory) => experienceHistory.user,
  )
  experienceHistory: ExperienceHistory[];
}

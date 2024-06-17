import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { Question } from './question.entity';
import { Answer } from './answer.entity';
import { UserProfile } from './user-profile.entity';
import { Vote } from './vote.entity';
import { Badge } from './badge.entity';
import { UserBadge } from './user-badge.entity';
import { Notification } from './notification.entity';

export enum SocialLoginEnum {
  GITHUB = 'github',
  GOOGLE = 'google',
}

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  userId: number;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ unique: true })
  nickname: string;

  @Column({ default: false })
  isEmailConsent: boolean;

  @Column({ nullable: true })
  profilePicture: string;

  @Column({ default: 0 })
  totalExperience: number;

  @Column({ default: 1 })
  level: number;

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

  @OneToMany(() => Question, (question) => question.user)
  questions: Question[];

  @OneToMany(() => Answer, (answer) => answer.user)
  answers: Answer[];

  @OneToMany(() => UserProfile, (profile) => profile.user)
  profiles: UserProfile[];

  @OneToMany(() => Vote, (vote) => vote.user)
  votes: Vote[];

  @ManyToMany(() => Badge, (badge) => badge.users)
  @JoinTable()
  badges: Badge[];

  @OneToMany(() => UserBadge, (userBadge) => userBadge.user)
  userBadges: UserBadge[];

  @OneToMany(() => Notification, (notification) => notification.user)
  notifications: Notification[];
}

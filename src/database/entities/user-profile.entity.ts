import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { User } from './user.entity';

@Entity()
export class UserProfile {
  @PrimaryGeneratedColumn()
  userProfileId: number;

  @ManyToOne(() => User, (user) => user.profiles)
  user: User;

  @Column()
  experienceYears: number;

  @Column('text', { nullable: true })
  techStack: string;

  @Column({ nullable: true })
  websiteUrl: string;

  @Column({ nullable: true })
  blogUrl: string;

  @Column('text', { nullable: true })
  bio: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  lastLogin: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date;
}

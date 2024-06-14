import { Entity, PrimaryGeneratedColumn, ManyToOne, Column } from 'typeorm';
import { User } from './user.entity';
import { Badge } from './badge.entity';

@Entity()
export class UserBadge {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.userBadges)
  user: User;

  @ManyToOne(() => Badge, (badge) => badge.users)
  badge: Badge;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  awardedAt: Date;
}

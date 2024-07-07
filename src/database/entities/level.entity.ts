import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { User } from './user.entity';

@Entity()
export class Level {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  level: number;

  @Column({ unique: true })
  name: string;

  @Column()
  experienceThreshold: number;

  @OneToMany(() => User, (user) => user.level)
  users: User[];
}

import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Level {
  @PrimaryGeneratedColumn()
  levelId: number;

  @Column({ unique: true })
  name: string;

  @Column()
  experienceThreshold: number;
}

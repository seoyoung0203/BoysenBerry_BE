import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/database/entities';
import {
  ExType,
  ExperienceHistory,
} from 'src/database/entities/experience-history.entity';
import { Repository } from 'typeorm';

@Injectable()
export class ExperienceHistoryService {
  constructor(
    @InjectRepository(ExperienceHistory)
    private readonly ExperienceHistoryRepo: Repository<ExperienceHistory>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async gainExperience(userId: number, exType: ExType) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    let experienceChange = 0;
    if (exType === ExType.QUESTION) {
      experienceChange = 10;
    } else if (exType === ExType.ANSWER) {
      experienceChange = 15;
    } else if (exType === ExType.APPROVE_VOTE) {
      experienceChange = 20;
    }

    user.totalExperience = user.totalExperience + experienceChange;

    const ex = this.ExperienceHistoryRepo.create({
      user: { id: userId },
      experienceChange,
      exType,
    });

    await this.userRepository.save(user);

    await this.ExperienceHistoryRepo.save(ex);
  }

  async loseExperience(userId: number, exType: ExType) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    let experienceChange = 0;
    if (exType === ExType.QUESTION) {
      experienceChange = -10;
    } else if (exType === ExType.ANSWER) {
      experienceChange = -15;
    } else if (exType === ExType.APPROVE_VOTE) {
      experienceChange = -20;
    }

    const changedEx =
      user.totalExperience + experienceChange < 0
        ? 0
        : user.totalExperience + experienceChange;

    user.totalExperience = changedEx;

    const ex = this.ExperienceHistoryRepo.create({
      user: { id: userId },
      experienceChange,
      exType,
    });

    await this.userRepository.save(user);
    await this.ExperienceHistoryRepo.save(ex);
  }
}

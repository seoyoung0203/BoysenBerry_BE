import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
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
  ) {}

  async gainExperience(userId: number, exType: ExType) {
    let experienceChange = 0;
    if (exType === ExType.QUESTION) {
      experienceChange = 10;
    } else if (exType === ExType.ANSWER) {
      experienceChange = 15;
    } else if (exType === ExType.APPROVE_VOTE) {
      experienceChange = 20;
    }

    const ex = this.ExperienceHistoryRepo.create({
      user: { id: userId },
      experienceChange,
      exType,
    });

    await this.ExperienceHistoryRepo.save(ex);
  }
}

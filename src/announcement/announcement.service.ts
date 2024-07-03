import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Announcement } from '../database/entities';
import moment from 'moment';
import { AnnouncementDto } from './dto/announcement.dto';

@Injectable()
export class AnnouncementService {
  constructor(
    @InjectRepository(Announcement)
    private readonly announcementRepository: Repository<Announcement>,
  ) {}

  async getAnnouncements(
    page: number = 1,
    limit: number = 10,
  ): Promise<AnnouncementDto[]> {
    const skipAmount = (page - 1) * limit;

    const announcements = await this.announcementRepository.find({
      select: {
        announcementId: true,
        title: true,
        content: true,
        createdAt: true,
      },
      where: { isVisible: true },
      order: { createdAt: 'DESC' },
      skip: skipAmount, // 건너뛸 항목 수 설정
      take: limit,
    });

    return announcements.map((announcement) => {
      return {
        announcementId: announcement.announcementId,
        title: announcement.title,
        content: announcement.content,
        date: moment(announcement.createdAt).format('YYYY-MM-DD'),
      };
    });
  }

  async getAnnouncementTotalCount() {
    const announcementCount = await this.announcementRepository.count({
      where: {
        isVisible: true,
      },
    });
    return announcementCount;
  }
}

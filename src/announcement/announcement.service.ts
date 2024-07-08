import { Injectable, NotFoundException } from '@nestjs/common';
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

  async getAnnouncement(announcementId: number): Promise<AnnouncementDto> {
    const announcement = await this.announcementRepository.findOne({
      select: {
        id: true,
        title: true,
        body: true,
        createdAt: true,
      },
      where: { isVisible: true, id: announcementId },
    });

    return {
      id: announcement.id,
      title: announcement.title,
      body: announcement.body,
      date: moment(announcement.createdAt).format('YYYY-MM-DD'),
    };
  }

  async getAnnouncements(
    page: number = 1,
    limit: number = 10,
  ): Promise<AnnouncementDto[]> {
    const skipAmount = (page - 1) * limit;

    const announcements = await this.announcementRepository.find({
      select: {
        id: true,
        title: true,
        body: true,
        createdAt: true,
      },
      where: { isVisible: true },
      order: { createdAt: 'DESC' },
      skip: skipAmount, // 건너뛸 항목 수 설정
      take: limit,
    });

    return announcements.map((announcement) => {
      return {
        id: announcement.id,
        title: announcement.title,
        body: announcement.body.slice(0, 100),
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

  async incrementViewCount(announcementId: number): Promise<void> {
    const announcement = await this.announcementRepository.findOne({
      where: { id: announcementId },
    });

    if (!announcement) {
      throw new NotFoundException(
        `Announcement with id ${announcementId} not found`,
      );
    }

    announcement.viewsCount += 1;
    await this.announcementRepository.save(announcement);
  }
}

import { Controller, Get, Query } from '@nestjs/common';
import { AnnouncementService } from './announcement.service';
import {
  AnnouncementDto,
  GetAnnouncementQueryDto,
} from './dto/announcement.dto';

@Controller('announcements')
export class AnnouncementController {
  constructor(private readonly announcementService: AnnouncementService) {}

  @Get()
  async findAll(
    @Query() getAnnouncementsQuery: GetAnnouncementQueryDto,
  ): Promise<{ announcements: AnnouncementDto[]; count: number }> {
    const { page, limit } = getAnnouncementsQuery;
    const announcements = await this.announcementService.getAnnouncements(
      page,
      limit,
    );

    const count = await this.announcementService.getAnnouncementTotalCount();

    return { announcements, count };
  }
}

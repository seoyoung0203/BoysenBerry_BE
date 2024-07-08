import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import { AnnouncementService } from './announcement.service';
import {
  AnnouncementDto,
  GetAnnouncementQueryDto,
} from './dto/announcement.dto';

@Controller('announcements')
export class AnnouncementController {
  constructor(private readonly announcementService: AnnouncementService) {}

  @Post(':id/views')
  async incrementViewCount(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<void> {
    return this.announcementService.incrementViewCount(id);
  }

  @Get(':id')
  async find(
    @Param('id') id: number,
  ): Promise<{ announcement: AnnouncementDto }> {
    const announcement = await this.announcementService.getAnnouncement(id);

    return { announcement };
  }

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

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnnouncementService } from './announcement.service';
import { AnnouncementController } from './announcement.controller';
import { Announcement } from '../database/entities';

@Module({
  imports: [TypeOrmModule.forFeature([Announcement])],
  providers: [AnnouncementService],
  controllers: [AnnouncementController],
})
export class AnnouncementModule {}

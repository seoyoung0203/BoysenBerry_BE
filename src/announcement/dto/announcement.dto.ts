import { IsString, IsNumber, IsDateString } from 'class-validator';
import { PaginationQueryDto } from 'src/common/dto/pagination.dto';

export class GetAnnouncementQueryDto extends PaginationQueryDto {}

export class AnnouncementDto {
  @IsNumber()
  announcementId: number;

  @IsString()
  title: string;

  @IsString()
  content: string;

  @IsDateString()
  date: string;
}

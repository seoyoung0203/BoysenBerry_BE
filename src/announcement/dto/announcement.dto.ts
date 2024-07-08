import { IsString, IsNumber, IsDateString } from 'class-validator';
import { PaginationQueryDto } from 'src/common/dto/pagination.dto';

export class GetAnnouncementQueryDto extends PaginationQueryDto {}

export class AnnouncementDto {
  @IsNumber()
  id: number;

  @IsString()
  title: string;

  @IsString()
  body: string;

  @IsDateString()
  date: string;
}

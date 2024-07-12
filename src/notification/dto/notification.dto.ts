import { IsBoolean, IsNumber, IsString } from 'class-validator';

export class GetNotifications {
  @IsNumber()
  id: number;

  @IsString()
  message: string;

  @IsNumber()
  questionId: number;

  @IsBoolean()
  isRead: boolean;
}

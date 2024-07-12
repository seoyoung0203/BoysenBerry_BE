import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from '../database/entities/notification.entity';
import { User } from '../database/entities/user.entity';
import { Question } from '../database/entities/question.entity';
import { Answer } from '../database/entities/answer.entity';
import { GetNotifications } from './dto/notification.dto';
import moment from 'moment';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
  ) {}

  async createNotificationForQuestion(
    user: User,
    question: Question,
    message: string,
  ): Promise<Notification> {
    const notification = this.notificationRepository.create({
      user,
      question,
      message,
    });

    return this.notificationRepository.save(notification);
  }

  async createNotificationForAnswer(
    user: User,
    answer: Answer,
    message: string,
  ): Promise<Notification> {
    const notification = this.notificationRepository.create({
      user,
      answer,
      message,
    });

    return this.notificationRepository.save(notification);
  }

  async getNotifications(userId: number): Promise<GetNotifications[]> {
    const notifications = await this.notificationRepository.find({
      select: {
        id: true,
        message: true,
        isRead: true,
        createdAt: true,
      },
      where: { user: { id: userId } },
      relations: ['question', 'answer', 'answer.question'],
      order: { createdAt: 'DESC' },
    });

    return notifications.map((notification) => {
      return {
        id: notification.id,
        message: notification.message,
        isRead: notification.isRead,
        questionId:
          notification.question === null
            ? notification.answer.question.id
            : notification.question.id,
        createdAt: moment(notification.createdAt).format('YYYY-MM-DD HH:MM'),
      };
    });
  }

  async markAsRead(notificationId: number, userId: number): Promise<void> {
    const notification = await this.notificationRepository.findOne({
      where: { id: notificationId, user: { id: userId } },
    });

    if (!notification) {
      throw new NotFoundException(
        `Notification with id ${notificationId} not found`,
      );
    }

    notification.isRead = true;
    await this.notificationRepository.save(notification);
  }
}

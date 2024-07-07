import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { Answer, Question, User } from '../database/entities';

@Module({
  imports: [TypeOrmModule.forFeature([User, Question, Answer])],
  providers: [UserService],
  controllers: [UserController],
})
export class UserModule {}

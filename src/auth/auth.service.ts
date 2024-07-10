import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import {
  ChangePasswordDto,
  CreateUserDto,
  LoginUserBodyDto,
} from './dto/auth.dto';
import { ResetPassword, SocialLoginEnum, User } from '../database/entities';
import axios, { AxiosResponse } from 'axios';
import { UserProfileDto } from 'src/common/dto/user.dto';
import moment from 'moment';
import { MailService } from 'src/mail/mail.service';
import { generateRandomString } from 'src/common/utils/utils';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @InjectRepository(ResetPassword)
    private readonly resetPasswordRepository: Repository<ResetPassword>,
    private readonly mailService: MailService,
  ) {}

  async register(createUserDto: CreateUserDto): Promise<User> {
    const { email, password } = createUserDto;
    const hashedPassword = await bcrypt.hash(password, 10);

    // 이메일 앞 아이디를 닉네임으로 초기 세팅
    const nickname = email.split('@')[0];
    const user = this.userRepository.create({
      email,
      password: hashedPassword,
      nickname,
      isEmailConsent: createUserDto.isEmailConsent,
    });

    return this.userRepository.save(user);
  }

  async getRankOfUser(userId: number) {
    const user = await this.userRepository.findOne({
      select: {
        id: true,
        nickname: true,
        profilePicture: true,
        totalExperience: true,
      },
      relations: ['level'],
      where: {
        id: userId,
      },
    });

    const totalUsers = await this.userRepository.find({
      select: {
        id: true,
        nickname: true,
        profilePicture: true,
        totalExperience: true,
      },
      order: { totalExperience: 'DESC' },
    });

    const userRank = totalUsers.findIndex((u) => u.id === user.id) + 1;

    return userRank;
  }

  async login(loginUserDto: LoginUserBodyDto): Promise<{
    accessToken: string;
    refreshToken: string;
    user: UserProfileDto;
  }> {
    const { email, password } = loginUserDto;
    const user = await this.userRepository.findOne({
      select: {
        id: true,
        password: true,
        nickname: true,
        profilePicture: true,
        createdAt: true,
      },
      relations: ['level'],
      where: { email },
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { email: user.email, sub: user.id };
    const accessToken = this.jwtService.sign(payload, { expiresIn: '1h' });
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: '7d',
    });

    return {
      accessToken,
      refreshToken,
      user: {
        userId: user.id,
        nickname: user.nickname,
        level: user.level.level,
        profileImage: user.profilePicture,
        createdAt: moment(user.createdAt).format('YYYY-MM-DD'),
      },
    };
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });
      const newAccessToken = this.jwtService.sign({ email: payload.email });

      const user = await this.userRepository.findOne({
        relations: ['level'],
        where: { id: payload.userId },
      });

      return {
        accessToken: newAccessToken,
        user: {
          userId: user.id,
          nickname: user.nickname,
          level: user.level.level,
          profilePicture: user.profilePicture,
          createdAt: moment(user.createdAt).format('YYYY-MM-DD'),
        },
      };
    } catch (e) {
      throw new InternalServerErrorException('Invalid refresh token');
    }
  }

  async sendPasswordResetEmail(email: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      throw new NotFoundException('User with this email does not exist');
    }

    const code = generateRandomString(5);
    const resetPassword = this.resetPasswordRepository.create({ user, code });
    await this.resetPasswordRepository.save(resetPassword);

    const subject = '[BoysenBerry] 비밀번호 변경 인증 메일';
    const text = `비밀번호 변경 인증 코드 ${code}`;

    await this.mailService.sendMail(email, subject, text);
  }

  async verifyResetCode(email: string, code: string): Promise<boolean> {
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      throw new NotFoundException('User with this email does not exist');
    }

    const resetPassword = await this.resetPasswordRepository.findOne({
      where: { user, code },
      order: { createdAt: 'DESC' },
    });
    if (!resetPassword) {
      throw new BadRequestException('Invalid or expired reset code');
    }

    resetPassword.isVerified = true;
    await this.resetPasswordRepository.save(resetPassword);

    return true;
  }

  async resetPassword(
    email: string,
    code: string,
    newPassword: string,
  ): Promise<boolean> {
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      throw new NotFoundException('User with this email does not exist');
    }

    const resetPassword = await this.resetPasswordRepository.findOne({
      where: { user, code, isVerified: true, isPasswordChanged: false },
      order: { createdAt: 'DESC' },
    });

    if (!resetPassword) {
      throw new BadRequestException('Invalid or expired reset code');
    }

    const now = new Date();
    const createdAt = new Date(resetPassword.createdAt);
    const diffInHours =
      (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);

    if (diffInHours > 3) {
      throw new BadRequestException('Reset code has expired');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await this.userRepository.save(user);

    resetPassword.isPasswordChanged = true;
    await this.resetPasswordRepository.save(resetPassword);

    return true;
  }

  async googleLogin(user: any): Promise<{ accessToken: string }> {
    const existingUser = await this.userRepository.findOne({
      where: { email: user.email },
    });

    const nickname = user.email.split('@')[0];
    if (!existingUser) {
      const newUser = this.userRepository.create({
        email: user.email,
        nickname,
        socialLoginType: SocialLoginEnum.GOOGLE,
        password: '',
      });
      await this.userRepository.save(newUser);
    }

    const payload = {
      email: user.email,
      sub: existingUser?.id ?? user.email,
    };
    const accessToken = this.jwtService.sign(payload);
    return { accessToken };
  }

  async gitHubAuth(code: string) {
    const getTokenUrl: string = 'https://github.com/login/oauth/access_token';

    const request = {
      code,
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
    };

    const response: AxiosResponse = await axios.post(getTokenUrl, request, {
      headers: {
        accept: 'application/json',
      },
    });

    if (response.data.error) {
      throw new UnauthorizedException('fail github login');
    }

    const { access_token } = response.data;

    const getUserUrl: string = 'https://api.github.com/user';
    const { data } = await axios.get(getUserUrl, {
      headers: {
        Authorization: `token ${access_token}`,
      },
      timeout: 3000,
    });

    const where = data.email
      ? { email: data.email }
      : { socialLoginId: data.id };

    const existingUser = await this.userRepository.findOne({
      where,
    });

    let userId: number;
    if (!existingUser) {
      const nickname = data.email ? data.email.split('@')[0] : data.login;
      const newUser = this.userRepository.create({
        email: data.email || '',
        nickname,
        socialLoginType: SocialLoginEnum.GITHUB,
        socialLoginId: data.id,
        password: '',
      });
      const user = await this.userRepository.save(newUser);
      userId = user.id;
    }

    const payload = {
      sub: existingUser?.id ?? userId,
    };

    const accessToken = this.jwtService.sign(payload);
    return { accessToken };
  }

  async changePassword(
    userId: number,
    changePasswordDto: ChangePasswordDto,
  ): Promise<void> {
    const user = await this.userRepository.findOne({
      select: { id: true, password: true },
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`User with id ${userId} not found`);
    }

    const isMatch = await bcrypt.compare(
      changePasswordDto.currentPassword,
      user.password,
    );

    if (!isMatch) {
      throw new BadRequestException('Current password is incorrect');
    }

    user.password = await bcrypt.hash(changePasswordDto.newPassword, 10);
    await this.userRepository.save(user);
  }
}

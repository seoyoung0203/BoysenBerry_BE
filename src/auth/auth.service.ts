import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserBodyDto } from './dto/login-user.dto';
import { SocialLoginEnum, User } from '../database/entities';
import axios, { AxiosResponse } from 'axios';
import { UserProfileDto } from 'src/common/dto/user.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
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

  async login(loginUserDto: LoginUserBodyDto): Promise<{
    accessToken: string;
    refreshToken: string;
    user: UserProfileDto;
  }> {
    const { email, password } = loginUserDto;
    const user = await this.userRepository.findOne({ where: { email } });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { email: user.email, sub: user.userId };
    const accessToken = this.jwtService.sign(payload, { expiresIn: '1h' });
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: '7d',
    });

    return {
      accessToken,
      refreshToken,
      user: {
        userId: user.userId,
        userNickname: user.nickname,
        userLevel: user.level,
        userProfile: user.profilePicture,
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
        where: { userId: payload.userId },
      });

      return {
        accessToken: newAccessToken,
        user: {
          userId: user.userId,
          nickname: user.nickname,
          level: user.level,
          profilePicture: user.profilePicture,
        },
      };
    } catch (e) {
      throw new UnauthorizedException('Invalid refresh token');
    }
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
      sub: existingUser?.userId ?? user.email,
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
      userId = user.userId;
    }

    const payload = {
      sub: existingUser?.userId ?? userId,
    };

    const accessToken = this.jwtService.sign(payload);
    return { accessToken };
  }
}

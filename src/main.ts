import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());
  app.enableCors({
    origin: 'http://localhost:3000', // 프론트엔드 주소
    credentials: true, // 쿠키를 허용하기 위해 필요
  });
  await app.listen(3008);
}
bootstrap();

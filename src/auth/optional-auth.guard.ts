import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const authorization = request.headers.authorization;

    if (authorization) {
      return super.canActivate(context);
    }

    return true;
  }

  handleRequest(err, user, info, context) {
    if (err || !user) {
      return null;
    }
    return user;
  }
}

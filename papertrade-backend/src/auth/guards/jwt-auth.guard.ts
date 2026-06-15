import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RedisService } from '../../cache/redis.service';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private redisService: RedisService) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const result = await super.canActivate(context) as boolean;
    if (!result) return false;

    const request = context.switchToHttp().getRequest();
    const token = request.get('Authorization')?.replace('Bearer ', '').trim();
    if (token) {
        const blacklisted = await this.redisService.isTokenBlacklisted(token);
        if (blacklisted) throw new UnauthorizedException('Token is blacklisted');
    }

    return true;
  }
}
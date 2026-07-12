import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus} from '@nestjs/common';
import { RedisService } from '../cache/redis.service';

@Injectable()
export class RateLimitGuard implements CanActivate {
    constructor(private redisService: RedisService) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const userId = request.user?.sub;
        const ip = request.ip;

        if (userId) {
            const isLimited = await this.redisService.isRateLimited(userId);
            if (isLimited) {
                throw new HttpException('You can place max 10 order per minute. Please wait before placing another order', HttpStatus.TOO_MANY_REQUESTS);
            }
        }
        const ipKey = `ratelimit:ip:${ip}`;
        const ipCount = await this.redisService.incrWithExpiry(ipKey, 60);
        if (ipCount > 100) {
            throw new HttpException('Too many requests from this IP. Please wait before making another request', HttpStatus.TOO_MANY_REQUESTS);
        }

        return true;
    }
}
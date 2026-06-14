import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService {
  private client: Redis;

  constructor() {
    this.client = new Redis(process.env.REDIS_URL);
  }
  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }
  async setex(key: string, ttlSeconds: number, value:string) {
    return this.client.setex(key, ttlSeconds, value);
  }

  //P-1:Price cache
  async getCachedPrice(symbol: string): Promise<number | null> {
    const cached = await this.client.get(`price:${symbol}`);
    return cached ? parseFloat(cached) : null;
  }
  async setCachedPrice(symbol: string, price: number) {
    await this.client.setex(`price:${symbol}`, 60, price.toString());
  }
  //P-2 Rate limit
  async isRateLimited(userId: string): Promise<boolean> {
    const key = `ratelimit:orders:${userId}`;
    const count = await this.client.incr(key);
    if (count === 1) await this.client.expire(key, 60);
        return count > 10;
    }

  //P-3 JWT blacklist (logout)
  async blacklistToken(token: string, ttlMs: number = 900000){
    await this.client.setex(
        `blacklist:${token}`,
        Math.ceil(ttlMs / 1000),
        '1'
    );
  }

  async isTokenBlacklisted(token: string): Promise<boolean>{
    const result = await this.client.get(`blacklist:${token}`);
    return result !== null;
  }

  //P-4 Leaderboard with sorted set
  async updateLeaderboard(userId: string, portfolioValue: number) {
    await this.client.zadd('leaderboard', portfolioValue, userId);
  }

  async getLeaderboard(top: number = 10) {
    // zrevrange return the highest sc
    const results = await this.client.zrevrange('leaderboard', 0, top - 1, 'WITHSCORES');
  
  //parseing pair
  const parsed = [];
  for(let i =0; i < results.length; i += 2){
    parsed.push({ userId: results[i], portfolioValue: parseFloat(results[i + 1]), rank: Math.floor(i/2) + 1 });
    
  }
  return parsed;
 }

  //P-5 Cache hit rate tracking
  async trackCacheHit(type: 'hit' | 'miss') {
    await this.client.incr(`cache:${type}`);
  }
  async getCacheHitRate(): Promise<number> {
    const hits = parseInt(await this.client.get('cache:hit') || '0');
    const misses = parseInt(await this.client.get('cache:miss') || '0');
    const total = hits + misses;
    return total === 0 ? 0 : Math.round((hits / total) * 100);
  }
 
}
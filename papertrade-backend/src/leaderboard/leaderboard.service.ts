import { Injectable, NotFoundException } from '@nestjs/common';
import { RedisService } from '../cache/redis.service';
import { PortfolioService } from '../portfolio/portfolio.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class LeaderboardService {
    constructor(
        private redisService: RedisService,
        private portfolioService: PortfolioService,
        private userService: UsersService
    ) {}

    async updateUserRankings(userId: string) {
        const portfolio = await this.portfolioService.getPortfolioWithPnL(userId);
        const user = await this.userService.findById(userId);

        if (!user) {
            throw new NotFoundException('User not found');
        }
        
        const totalWealth = (user.balancePaise / 100) + portfolio.totalValue;
        await this.redisService.updateLeaderboard(userId, totalWealth);
    }

    async getTopTraders(limit: number = 10) {
        const entries = await this.redisService.getLeaderboard(limit);

        const enriched = await Promise.all(entries.map(async (entry, idx) => {
            const user = await this.userService.findById(entry.userId);
            return {
                rank: idx + 1,
                username: user?.email.split('@')[0],
                portfolioValue: entry.portfolioValue,
                profit: entry.portfolioValue - 1000000,
                profitPercent: ((entry.portfolioValue - 1000000) / 1000000 * 100).toFixed(2)
            }
        }));

        return enriched;
    }
}
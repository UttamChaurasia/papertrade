import { Module } from '@nestjs/common';
import { LeaderboardController } from './leaderboard.controller';
import { LeaderboardService } from './leaderboard.service';
import { CacheModule } from '../cache/cache.module';
import { PortfolioModule } from '../portfolio/portfolio.module';
import { UsersModule } from '../users/users.module';

@Module({
    imports: [CacheModule, PortfolioModule, UsersModule],
    controllers: [LeaderboardController],
    providers: [LeaderboardService],
    exports: [LeaderboardService]
})
export class LeaderboardModule {}
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CacheModule } from './cache/cache.module';
import { StocksModule } from './stocks/stocks.module';
import { OrdersModule } from './orders/orders.module'
import { PortfolioModule } from './portfolio/portfolio.module';
import { LeaderboardModule } from './leaderboard/leaderboard.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }
    ),
    MongooseModule.forRoot(process.env.MONGODB_URI as string),
    AuthModule,
    UsersModule,
    CacheModule,
    StocksModule,
    OrdersModule,
    PortfolioModule,
    LeaderboardModule,
  ],
})
export class AppModule {}

import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { LeaderboardService } from './leaderboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('leaderboard')
export class LeaderboardController {
    constructor(private leaderboardService: LeaderboardService) {}

    @Get()
    @UseGuards(JwtAuthGuard)
    getLeaderboard(@Query('limit') limit?: string) {
        return this.leaderboardService.getTopTraders(limit ? parseInt(limit) : 10);
    }
}
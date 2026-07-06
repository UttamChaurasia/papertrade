import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PortfolioService } from './portfolio.service';

@Controller('api/portfolio')
export class PortfolioController {
    constructor(private portfolioService: PortfolioService) {}

    @Get()
    @UseGuards(JwtAuthGuard)
    getMyPortfolio(@Request() req) {
        return this.portfolioService.getPortfolioWithPnL(req.user.sub);
    }
}
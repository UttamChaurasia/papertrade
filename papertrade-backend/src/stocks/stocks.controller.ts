import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { StocksService } from './stocks.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('api/stocks')
export class StocksController {
    constructor(private readonly stocksService: StocksService) {}

    @Get('price/:symbol')
    @UseGuards(JwtAuthGuard)
    getPrice(@Param('symbol') symbol: string) {
        return this.stocksService.getCurrentPrice(symbol.toUpperCase());

    }

    @Get('candles/:symbol')
    @UseGuards(JwtAuthGuard)
    getCandles(
        @Param('symbol') symbol: string,
        @Query('interval') interval: string = 'daily',
    ) {
        return this.stocksService.getCandleData(symbol.toUpperCase(), interval);
    }

    @Get('search')
    @UseGuards(JwtAuthGuard)
    search(@Query('q') query: string) {
        return this.stocksService.searchSymbols(query);
    }
}
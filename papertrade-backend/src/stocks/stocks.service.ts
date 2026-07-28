import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import axios from 'axios';
import { RedisService } from '../cache/redis.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import { StocksGateway } from './stocks.gateway';

@Injectable()

export class StocksService {
    private readonly AV_BASE = 'https://www.alphavantage.co/query';
    private readonly API_KEY = process.env.ALPHA_VANTAGE_KEY;
    private readonly FINNHUB_BASE = 'https://finnhub.io/api/v1';
    private readonly FINNHUB_KEY = process.env.FINNHUB_API_KEY;

    private readonly WATCHLIST = [/*'AAPL',*/'MSFT', 'GOOGL', 'AMZN'/*, 'TSLA', 'META', 'NVDA', 'BRK.B', 'JPM', 'JNJ'*/];
    constructor(private redisService: RedisService,
                private stocksGateway: StocksGateway
    ) {}

    async getCurrentPrice(symbol: string): Promise<number> {
        const cacheKey = `price:${symbol}`;

        const cached = await this.redisService.get(cacheKey);
        if (cached) {
            await this.redisService.trackCacheHit('hit');
            return parseFloat(cached);
        }

        await this.redisService.trackCacheHit('miss');
        const url = `${this.FINNHUB_BASE}/quote?symbol=${symbol}&token=${this.FINNHUB_KEY}`;

        const response = await axios.get(url);
        const price = response.data.c; // 'c' = current price

        if (!price || price === 0) {
            throw new NotFoundException(`No price data found for: ${symbol}`);
        }

        await this.redisService.setex(cacheKey, 14400, price.toString());
        return price;
    }

    async getCandleData(symbol: string, interval: string = 'daily') {
        const cacheKey = `candles:${symbol}:${interval}`;
        const cached = await this.redisService.get(cacheKey);
        if (cached) {
            await this.redisService.trackCacheHit('hit');
            return JSON.parse(cached);
        }
        await this.redisService.trackCacheHit('miss');
        let url: string;
        if(interval === 'daily'){
            url = `${this.AV_BASE}?function=TIME_SERIES_DAILY&symbol=${symbol}&outputsize=compact&apikey=${this.API_KEY}`;

        } else {
            url = `${this.AV_BASE}?function=TIME_SERIES_INTRADAY&symbol=${symbol}&interval=${interval}&outputsize=full&apikey=${this.API_KEY}`;
        }

        let response;
        try {
            response = await axios.get(url);
        } catch (error) {
            console.log(`Alpha Vantage API error for ${symbol}:${interval} ->`, error.code);
            throw new Error(`Alpha Vantage rate limit hit. Try again tomorrow or use daily interval.`);
        }
        const candles = this.parseCandles(response.data, interval);

        if (!candles.length) {
            console.log(`Alpha Vantage response:`, JSON.stringify(response.data));
            return [];
        }

        const ttl = interval === 'daily' ? 3600 : 300;
        await this.redisService.setex(cacheKey, ttl, JSON.stringify(candles));

        return candles;
    }

    async searchSymbols(query: string) {
        const cacheKey = `search:${query.toLowerCase()}`;

        const cached = await this.redisService.get(cacheKey);
        if (cached) return JSON.parse(cached);

        const url = `${this.FINNHUB_BASE}/search?q=${encodeURIComponent(query)}&token=${this.FINNHUB_KEY}`;
        const response = await axios.get(url);

        const results = response.data['result'] || [];

        const simplified = results.map((r: any) => ({
            symbol: r.symbol,
            name: r.description,
            type: r.type,
            region: 'US', // Finnhub's free tier only covers US-listed symbols
        }));

        await this.redisService.setex(cacheKey, 3600, JSON.stringify(simplified));

        return simplified;
    }

    private parseCandles(data: any, interval: string) {
    const key = interval === 'daily'
        ? 'Time Series (Daily)'
        : `Time Series (${interval})`;

    const series = data[key];
    if (!series) return [];

    return Object.entries(series)
    .map(([time, values]: [string, any]) => ({
        time: interval === 'daily'
            ? time
            : Math.floor(new Date(time).getTime() / 1000),
        open:   parseFloat(values['1. open']),
        high:   parseFloat(values['2. high']),
        low:    parseFloat(values['3. low']),
        close:  parseFloat(values['4. close']),
        volume: parseFloat(values['5. volume']),
    }))
    .reverse();
    }
    @Cron(CronExpression.EVERY_5_MINUTES)
    async pollAndBroadcastPrices() {
        for (const symbol of this.WATCHLIST) {
            try {
                const price = await this.getCurrentPrice(symbol);
                this.stocksGateway.broadcastPrice(symbol, price);
            } catch (error) {
                console.log(`Poll failed for ${symbol} ->`, error.message);
            }
        }
    }
}

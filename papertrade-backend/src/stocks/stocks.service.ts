import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import axios from 'axios';
import { RedisService } from '../cache/redis.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import { StocksGateway } from './stocks.gateway';

@Injectable()

export class StocksService {
    private readonly TWELVE_DATA_BASE = 'https://api.twelvedata.com';
    private readonly TWELVE_DATA_KEY = process.env.TWELVE_DATA_API_KEY;
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

        // Twelve Data calls the daily interval '1day', not 'daily' — everything else maps straight through
        const tdInterval = interval === 'daily' ? '1day' : interval;
        const outputsize = interval === 'daily' ? 100 : 5000;
        const url = `${this.TWELVE_DATA_BASE}/time_series?symbol=${symbol}&interval=${tdInterval}&outputsize=${outputsize}&apikey=${this.TWELVE_DATA_KEY}`;

        let response;
        try {
            response = await axios.get(url);
        } catch (error) {
            console.log(`Twelve Data API error for ${symbol}:${interval} ->`, error.code);
            throw new Error(`Twelve Data request failed. Try again shortly.`);
        }

        const candles = this.parseCandles(response.data, interval);

        if (!candles.length) {
            console.log(`Twelve Data response:`, JSON.stringify(response.data));
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
        const series = data.values;
        if (!series) return [];

        return series
            .map((v: any) => ({
                time: interval === 'daily'
                    ? v.datetime
                    : Math.floor(new Date(v.datetime).getTime() / 1000),
                open:   parseFloat(v.open),
                high:   parseFloat(v.high),
                low:    parseFloat(v.low),
                close:  parseFloat(v.close),
                volume: parseFloat(v.volume),
            }))
            .reverse(); // Twelve Data returns newest-first, same as Alpha Vantage did
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

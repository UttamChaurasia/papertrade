import { Injectable, NotFoundException } from '@nestjs/common';
import axios from 'axios';
import { RedisService } from '../cache/redis.service';

@Injectable()

export class StocksService {
    private readonly AV_BASE = 'https://www.alphavantage.co/query';
    private readonly API_KEY = process.env.ALPHA_VANTAGE_KEY;

    constructor(private redisService: RedisService) {}

    async getCurrentPrice(symbol: string): Promise<number> {
        const cacheKey = `price:${symbol}`;

        const cached = await this.redisService.get(cacheKey);
        if (cached) {
            console.log(`Cache HIT → ${symbol}`);
            return parseFloat(cached);
        }

        console.log(`Cache MISS -> calling API for ${symbol}`);
        const url = `${this.AV_BASE}?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${this.API_KEY}`;

        const response = await axios.get(url);
        const quote = response.data['Global Quote'];
        if (!quote || !quote['05. price']) {
            throw new NotFoundException(`No price data found for: ${symbol}`);
        }

        const price = parseFloat(quote['05. price']);
        await this.redisService.setex(cacheKey, 60, price.toString());
        return price;
    }

    async getCandleData(symbol: string, interval: string = 'daily') {
        const cacheKey = `candles:${symbol}:${interval}`;
        const cached = await this.redisService.get(cacheKey);
        if (cached) {
            console.log(`Candle cache HIT -> ${symbol}:${interval}`);
            return JSON.parse(cached);
        }

        let url: string;
        if(interval === 'daily'){
            url = `${this.AV_BASE}?function=TIME_SERIES_DAILY&symbol=${symbol}&outputsize=full&apikey=${this.API_KEY}`;

        } else {
            url = `${this.AV_BASE}?function=TIME_SERIES_INTRADAY&symbol=${symbol}&interval=${interval}&outputsize=full&apikey=${this.API_KEY}`;
        }

        const response = await axios.get(url);
        const candles = this.parseCandles(response.data, interval);

        if (!candles.length) {
            throw new NotFoundException(`No candle data for ${symbol}`);
        }

        const ttl = interval === 'daily' ? 3600 : 300;
        await this.redisService.setex(cacheKey, ttl, JSON.stringify(candles));

        return candles;
    }

    async searchSymbols(query: string){
        const cacheKey = `search:${query.toLowerCase()}`;

        const cached = await this.redisService.get(cacheKey);
        if (cached) return JSON.parse(cached);

        const url = `${this.AV_BASE}?function=SYMBOL_SEARCH&keywords=${query}&apikey=${this.API_KEY}`;
        const response = await axios.get(url);

        const results = response.data['bestMatches'] || [];

        const simplified = results.map((r: any) => ({
            symbol: r['1. symbol'],
            name: r['2. name'],
            type: r['3. type'],
            region: r['4. region'],
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
        time,
        open:   parseFloat(values['1. open']),
        high:   parseFloat(values['2. high']),
        low:    parseFloat(values['3. low']),
        close:  parseFloat(values['4. close']),
        volume: parseFloat(values['5. volume']),
      }))
      .reverse();
  }
}

import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Portfolio } from './portfolio.schema';
import { StocksService } from '../stocks/stocks.service';

@Injectable()
export class PortfolioService {
    constructor(
        @InjectModel(Portfolio.name) private portfolioModel: Model<Portfolio>,
        private stocksService: StocksService,
    ) {}

    async addShares(userId: string, symbol: string, qty: number, pricePaise: number) {
        const existing = await this.portfolioModel.findOne({ userId, symbol });

        if (!existing) {
            await this.portfolioModel.create({
                userId, symbol, quantity: qty,
                avgPricePaise: pricePaise,
                totalInvestedPaise: pricePaise * qty,
            });
        } else {
            const totalQty = existing.quantity + qty;
            const totalInvested = existing.totalInvestedPaise + (pricePaise * qty);
            const newAvg = Math.floor(totalInvested / totalQty);

            await this.portfolioModel.findByIdAndUpdate(existing._id, {
                quantity: totalQty,
                avgPricePaise: newAvg,
                totalInvestedPaise: totalInvested,
            });
        }
    }
    async removeShares(userId: string, symbol: string, qty: number) {
        const existing = await this.portfolioModel.findOne({ userId, symbol });

        if (!existing || existing.quantity < qty) {
            throw new BadRequestException(
                `Insufficient holdings: cannot sell ${qty} shares of ${symbol}`
            );
        }
        const newQty = existing.quantity - qty;

        const investedRemoved = existing.avgPricePaise * qty;
        const newTotalInvested = existing.totalInvestedPaise - investedRemoved;

        await this.portfolioModel.findByIdAndUpdate(existing._id, {
            quantity: newQty,
            totalInvestedPaise: newQty > 0 ? newTotalInvested : 0,
        });
    }

    async getPortfolioWithPnL(userId: string) {
        const holdings = await this.portfolioModel.find({ userId, quantity: { $gt: 0 } });

        const result = await Promise.all(holdings.map(async h => {
            const currentPrice = await this.stocksService.getCurrentPrice(h.symbol);
            const currentPricePaise = Math.round(currentPrice * 100);
            const currentValuePaise = currentPricePaise * h.quantity;
            const investedPaise = h.avgPricePaise * h.quantity;
            const unrealizedPnLPaise = currentValuePaise - investedPaise;
            const unrealizedPnLPercent = ((currentPricePaise - h.avgPricePaise) / h.avgPricePaise * 100).toFixed(2);

            return {
                symbol: h.symbol,
                quantity: h.quantity,
                avgPrice: h.avgPricePaise / 100,
                currentPrice,
                currentValue: currentValuePaise / 100,
                invested: investedPaise / 100,
                unrealizedPnL: unrealizedPnLPaise / 100,
                unrealizedPnLPercent: parseFloat(unrealizedPnLPercent),
                isProfit: unrealizedPnLPaise > 0,
            };
        }));

        const totalValue = result.reduce((s, h) => s + h.currentValue, 0);
        const totalInvested = result.reduce((s, h) => s + h.invested, 0);
        const totalPnL = totalValue - totalInvested;

        return { holdings: result, totalValue, totalInvested, totalPnL };
    }
}
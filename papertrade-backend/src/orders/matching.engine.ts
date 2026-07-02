// orders/matching.engine.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Order } from './orders.schema';
import { User } from '../users/users.schema';
import { Trade } from '../trades/trade.schema';

@Injectable()
export class MatchingEngine {
    private readonly logger = new Logger(MatchingEngine.name);

    constructor(
        @InjectModel(Order.name) private orderModel: Model<Order>,
        @InjectModel(User.name) private userModel: Model<User>,
        @InjectModel(Trade.name) private tradeModel: Model<Trade>,
    ) {}

    async submit(incomingOrder: Order) {
        const startTime = Date.now();

        if (incomingOrder.side === 'BUY') {
            await this.matchBuyOrder(incomingOrder);
        } else {
            await this.matchSellOrder(incomingOrder);
        }

        this.logger.log(
            `Order ${incomingOrder._id} processed in ${Date.now() - startTime}ms`,
        );
    }

    private async matchBuyOrder(buyOrder: Order) {
        while (buyOrder.filledQuantity < buyOrder.quantity) {
            const bestSell = await this.orderModel
                .findOne({
                symbol: buyOrder.symbol,
                side: 'SELL',
                status: { $in: ['PENDING', 'PARTIAL'] },
                pricePaise: { $lte: buyOrder.pricePaise },
                userId: { $ne: buyOrder.userId }, // no self-trading
            })
            .sort({ pricePaise: 1, createdAt: 1 });

            if (!bestSell) break;

            const tradeQty = Math.min(
                buyOrder.quantity - buyOrder.filledQuantity,
                bestSell.quantity - bestSell.filledQuantity,
            );

            await this.executeTrade(buyOrder, bestSell, tradeQty, bestSell.pricePaise);
        }
    }

    private async matchSellOrder(sellOrder: Order) {
        while (sellOrder.filledQuantity < sellOrder.quantity) {
            const bestBuy = await this.orderModel
            .findOne({
            symbol: sellOrder.symbol,
            side: 'BUY',
            status: { $in: ['PENDING', 'PARTIAL'] },
            pricePaise: { $gte: sellOrder.pricePaise },
            userId: { $ne: sellOrder.userId },
            })
            .sort({ pricePaise: -1, createdAt: 1 });

            if (!bestBuy) break;

            const tradeQty = Math.min(
                sellOrder.quantity - sellOrder.filledQuantity,
                bestBuy.quantity - bestBuy.filledQuantity,
            );

            await this.executeTrade(bestBuy, sellOrder, tradeQty, sellOrder.pricePaise);
        }
    }

    private async executeTrade(
        buyOrder: Order,
        sellOrder: Order,
        qty: number,
        tradePricePaise: number,
    ) {
        const tradeCostPaise = tradePricePaise * qty;

        buyOrder.filledQuantity += qty;
        buyOrder.status =
            buyOrder.filledQuantity >= buyOrder.quantity ? 'FILLED' : 'PARTIAL';
        await buyOrder.save();

        sellOrder.filledQuantity += qty;
        sellOrder.status =
            sellOrder.filledQuantity >= sellOrder.quantity ? 'FILLED' : 'PARTIAL';
        await sellOrder.save();

        await this.userModel.findByIdAndUpdate(buyOrder.userId, {
            $inc: { balancePaise: -tradeCostPaise },
        });
        await this.userModel.findByIdAndUpdate(sellOrder.userId, {
            $inc: { balancePaise: tradeCostPaise },
        });

        await this.tradeModel.create({
            buyOrderId: buyOrder._id,
            sellOrderId: sellOrder._id,
            buyerId: buyOrder.userId,
            sellerId: sellOrder.userId,
            symbol: buyOrder.symbol,
            pricePaise: tradePricePaise,
            quantity: qty,
        });
    }
}
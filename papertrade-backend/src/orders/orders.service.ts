import {
    Injectable,
    NotFoundException,
    BadRequestException,
} from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model, Types } from 'mongoose'
import { Order } from './orders.schema'
import { User } from '../users/users.schema'
import { RedisService } from '../cache/redis.service'
import { StocksService } from '../stocks/stocks.service'
import { CreateOrderDto } from './dto/create-order.dto'
import { PortfolioService } from 'src/portfolio/portfolio.service'
import { MatchingEngine } from './matching.engine'

@Injectable()
export class OrdersService {
    constructor(
        @InjectModel(Order.name) private orderModel: Model<Order>,
        @InjectModel(User.name) private userModel: Model<User>,
        private redisService: RedisService,
        private stocksService: StocksService,
        private portfolioService: PortfolioService,
        private matchingEngine: MatchingEngine
    ) {}

    async placeOrder(userId: string, dto: CreateOrderDto) {
        const isLimited = await this.redisService.isRateLimited(userId)
        if (isLimited) {
            throw new BadRequestException('Max 10 orders per minute allowed')
        }
        const user = await this.userModel.findById(userId)
        if (!user) throw new NotFoundException('User not found')

        const pricePaise = Math.round(dto.price * 100)
        const symbol = dto.symbol.toUpperCase()
        if(dto.side === 'BUY') {
            const totalCostPaise = pricePaise * dto.quantity
            if (user.balancePaise < totalCostPaise) {
                const balance = (user.balancePaise / 100).toLocaleString('en-IN')
                const cost = (totalCostPaise / 100).toLocaleString('en-IN')
                throw new BadRequestException(
                    `Insufficient balance. Need Rs.${cost}, have Rs.${balance}`
                )
            }
        } else if (dto.side === 'SELL') {
            const holdingQty = await this.portfolioService.getHoldingQuantity(userId, symbol)

            const reserved = await this.orderModel.aggregate([
                {
                    $match: {
                        userId: new Types.ObjectId(userId),
                        symbol,
                        side: 'SELL',
                        status: { $in: ['PENDING', 'PARTIAL'] },
                    },
                },
                {
                    $group: {
                        _id: null,
                        reservedQty: { $sum: { $subtract: ['$quantity', '$filledQuantity'] } },
                    },
                },
            ])
            const reservedQty = reserved[0]?.reservedQty ?? 0
            const availableQty = holdingQty - reservedQty

            if (dto.quantity > availableQty) {
                throw new BadRequestException(
                    `Insufficient shares. You hold ${holdingQty}, ${reservedQty} already committed to pending sell orders (${availableQty} available).`
                )
            }
        }
        const order = await this.orderModel.create({
            userId,
            symbol: dto.symbol.toUpperCase(),
            side: dto.side,
            type: dto.type,
            pricePaise,
            quantity: dto.quantity,
            filledQuantity: 0,
            status: 'PENDING',
        })

        await this.matchingEngine.submit(order)

        return order
    }

    async getMyOrders(userId: string) {
        return this.orderModel
            .find({ userId })
            .sort({ createdAt: -1 })
            .limit(50)
    }

    async cancelOrder(orderId: string, userId: string) {
        const order = await this.orderModel.findOne({
            _id: orderId,
            userId: new Types.ObjectId(userId),
        })
        if(!order) throw new NotFoundException('Order Not Found')

        if(order.status !== 'PENDING' && order.status !== 'PARTIAL') {
            throw new BadRequestException(
                `Cannot cancel order with status: ${order.status}`
            )
        }
        order.status = 'CANCELLED'
        await order.save()
        return { message: 'Order cancelled', order }
    }
    async reconcilePendingOrders() {
        const pendingOrders = await this.orderModel
            .find({ status: { $in: ['PENDING', 'PARTIAL'] } })
            .sort({ createdAt: 1 })

        let processed = 0
        for (const order of pendingOrders) {
            const fresh = await this.orderModel.findById(order._id)
            if (!fresh || fresh.status === 'FILLED' || fresh.status === 'CANCELLED') continue

            await this.matchingEngine.submit(fresh)
            processed++
        }

        return { message: `Reconciliation swept ${processed} orders`, processed }
    }
}
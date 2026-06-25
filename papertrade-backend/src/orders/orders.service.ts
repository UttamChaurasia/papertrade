import {
    Injectable,
    NotFoundException,
    BadRequestException,
} from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { Order } from './order.schema'
import { User } from '../users/users.schema'
import { RedisService } from '../cache/redis.service'
import { StocksService } from '../stocks/stocks.service'
import { CreateOrderDto } from './dto/create-order.dto'

@Injectable()
export class OrderService {
    constructor(
        @InjectModel(Order.name) private orderModel: Model<Order>,
        @InjectModel(User.name) private userModel: Model<User>,
        private redisService: RedisService,
        private stocksService: StocksService,
    ) {}

    async placeOrder(userId: string, dto: CreateOrderDto) {
        const isLimited = await this.redisService.isRateLimited(userId)
        if (isLimited) {
            throw new BadRequestException('Max 10 orders per minute allowed')
        }
        const user = await this.userModel.findById(userId)
        if (!user) throw new NotFoundException('User not found')

        const pricePaise = Math.round(dto.price * 100)
        if(dto.side === 'BUY') {
            const totalCostPaise = pricePaise * dto.quantity
            if (user.balancePaise < totalCostPaise) {
                const balance = (user.balancePaise / 100).toLocaleString('en-IN')
                const cost = (totalCostPaise / 100).toLocaleString('en-IN')
                throw new BadRequestException(
                    `Insufficient balance. Need Rs.${cost}, have Rs.${balance}`
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
        return order
    }

    async getMyOrders(userId: string) {
        return this.orderModel
            .find({ userId })
            .sort({ createAt: -1 })
            .limit(50)
    }

    async cancelOrder(orderId: string, userId: string) {
        const order = await this.orderModel.findOne({ _id: orderId, userId })
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
}
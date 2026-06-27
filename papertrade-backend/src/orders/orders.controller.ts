import {
    Controller,
    Post,
    Get,
    Delete,
    Body,
    Param,
    Request,
    UseGuards
} from '@nestjs/common'
import { OrdersService } from './orders.service'
import { CreateOrderDto } from './dto/create-order.dto'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'

@Controller('api/orders')
@UseGuards(JwtAuthGuard)
export class OrderController {
    constructor(private ordersService: OrdersService) {}

    @Post()
    placeOrder(@Body() dto: CreateOrderDto, @Request() req) {
        return this.ordersService.placeOrder(req.user.sub, dto)
    }
    @Get()
    getMyOrders(@Request() req) {
        return this.ordersService.getMyOrders(req.user.sub)
    }

    @Delete(':id')
    cancelOrder(@Param('id') orderId: string, @Request() req) {
        return this.ordersService.cancelOrder(orderId, req.user.sub)
    }
}
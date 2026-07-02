import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { OrderController } from './orders.controller'
import { OrdersService } from './orders.service'
import { Order, OrderSchema } from './orders.schema'
import { User, UserSchema } from '../users/users.schema'
import { Trade, TradeSchema } from '../trades/trade.schema'
import { MatchingEngine } from './matching.engine'
import { StocksModule } from '../stocks/stocks.module'
import { CacheModule } from '../cache/cache.module'

@Module({
    imports: [
        MongooseModule.forFeature([
            {name: Order.name, schema: OrderSchema },
            {name: User.name, schema: UserSchema },
            {name : Trade.name, schema: TradeSchema },
        ]),
        StocksModule,
        CacheModule,
    ],
    controllers: [OrderController],
    providers: [OrdersService, MatchingEngine],
    exports: [OrdersService, MatchingEngine],
})
export class OrdersModule {}
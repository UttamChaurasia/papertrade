import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { OrderController } from './orders.controller'
import { OrdersService } from './orders.service'
import { Order, OrderSchema } from './orders.schema'
import { User, UserSchema } from '../users/users.schema'
import { StocksModule } from '../stocks/stocks.module'
import { CacheModule } from '../cache/cache.module'

@Module({
    imports: [
        MongooseModule.forFeature([
            {name: Order.name, schema: OrderSchema },
            {name: User.name, schema: UserSchema },
        ]),
        StocksModule,
        CacheModule,
    ],
    controllers: [OrderController],
    providers: [OrdersService],
    exports: [OrdersService],
})
export class OrdersModule {}
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document, Types } from 'mongoose'

export type OrderSide = 'BUY' | 'SELL'
export type OrderType = 'LIMIT' | 'MARKET'
export type OrderStatus = 'PENDING' | 'PARTIAL' | 'FILLED' | 'CANCELLED'

@Schema({ timestamps: true })
export class Order extends Document {
    @Prop({ type: Types.ObjectId, ref: 'User', required: true})
    userId!: Types.ObjectId

    @Prop({ required: true, uppercase: true })
    symbol!: string

    @Prop({ required: true, enum: ['BUY', 'SELL'] })
    side!: OrderSide

    @Prop({ required: true, enum: ['LIMIT', 'MARKET'] })
    type!: OrderType

    @Prop({ required: true })
    pricePaise!: number

    @Prop({ required: true, min: 1, max: 10000 })
    quantity!: number

    @Prop({ default: 0 })
    filledQuantity!: number

    @Prop({
        default: 'PENDING',
        enum: ['PENDING', 'PARTIAL', 'FILLED', 'CANCELLED'],
    })
    status!: OrderStatus
}

export const OrderSchema = SchemaFactory.createForClass(Order)
OrderSchema.index({ userId: 1, status: 1 })
OrderSchema.index({ symbol: 1, side: 1, status: 1, pricePaise: 1})
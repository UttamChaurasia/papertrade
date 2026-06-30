import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Trade extends Document {
    @Prop({ type: Types.ObjectId, ref: 'Order', required: true })
    buyOrderId!: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'Order', required: true })
    sellOrderId!: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    buyerId!: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    sellerId!: Types.ObjectId;

    @Prop({ required: true, uppercase: true })
    symbol!: string;

    @Prop({ required: true })
    pricePaise!: number;

    @Prop({ required: true })
    quantity!: number;
}

export const TradeSchema = SchemaFactory.createForClass(Trade);
TradeSchema.index({ symbol: 1, createdAt: -1 });
TradeSchema.index({ buyerId: 1 });
TradeSchema.index({ sellerId: 1 });
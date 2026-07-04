import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document , Types } from 'mongoose';

@Schema({ timestamps: true })
export class Portfolio extends Document {
    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    userId!: Types.ObjectId;

    @Prop({ required: true, uppercase: true })
    symbol!: string;

    @Prop({ default: 0 })
    quantity!: number;

    @Prop({ default: 0 })
    avgPricePaise!: number;

    @Prop({ default: 0 })
    totalInvestedPaise!: number;
}

export const PortfolioSchema = SchemaFactory.createForClass(Portfolio);
PortfolioSchema.index({ userId: 1, symbol: 1 }, { unique: true });
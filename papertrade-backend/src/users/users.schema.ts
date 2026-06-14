import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class User extends Document {
@Prop({ required: true, unique: true })
email: string;

@Prop({ required: true })
passwordHash: string;

@Prop({ default: 'TRADER' })
role: string;

@Prop({ default: 100000000})
balancePaise: number;

@Prop({ default: 0 })
totalTrades: number;

@Prop()
refreshToken?: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
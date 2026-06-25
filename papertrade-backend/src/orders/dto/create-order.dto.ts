import { IsString, IsEnum, IsNumber, IsPositive, Max } from 'class-validator'

export class CreateOrderDto {

    @IsString()
    symbol!: string

    @IsEnum(['BUY', 'SELL'])
    side!: 'BUY' | 'SELL'

    @IsEnum(['LIMIT', 'MARKET'])
    type!: 'LIMIT' | 'MARKET'

    @IsNumber()
    @IsPositive()
    price!: number

    @IsNumber()
    @IsPositive()
    @Max(10000)
    quantity!: number
}
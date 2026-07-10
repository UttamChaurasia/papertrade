import { Module } from '@nestjs/common';
import { StocksService } from './stocks.service';
import { StocksController } from './stocks.controller';
import { StocksGateway } from './stocks.gateway';

@Module({
    controllers: [StocksController],
    providers: [StocksService, StocksGateway],
    exports: [StocksService, StocksGateway],
})
export class StocksModule {}
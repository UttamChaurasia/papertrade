import { WebSocketGateway, WebSocketServer,
    SubscribeMessage, MessageBody, ConnectedSocket 
} from '@nestjs/websockets';

import { Server, Socket } from 'socket.io';

@WebSocketGateway({ cors: { origin: '*' } })
export class StocksGateway {
    @WebSocketServer()
    server!: Server;

    @SubscribeMessage('subscribe')
        handleSubscribe(@MessageBody() symbol: string,
        @ConnectedSocket() client: Socket,
    ) {
        client.join(`price:${symbol.toUpperCase()}`);
        return { event: 'subscribed', data: symbol };
    }
    @SubscribeMessage('unsubscribe')
        handleUnsubscribe(@MessageBody() symbol: string,
        @ConnectedSocket() client: Socket,
    ) {
        client.leave(`price:${symbol.toUpperCase()}`);
    }

    broadcastPrice(symbol: string, price: number) {
        this.server.to(`price:${symbol}`).emit('priceUpdate', {
            symbol, price, timeStamp: Date.now() 

        });
    }

    notifyUser(userId: string, notification: any) {
        this.server.to(`user:${userId}`).emit('orderUpdate', notification);
    }

    @SubscribeMessage('join')
    handleJoin(
        @MessageBody() userId: string,
        @ConnectedSocket() client: Socket,
    ) {
        client.join(`user:${userId}`);
    }
}
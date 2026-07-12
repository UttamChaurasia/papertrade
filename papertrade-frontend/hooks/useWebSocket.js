import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { getToken } from '@/lib/api';

export function useStockPrice(symbol, userId) {
    const [price, setPrice] = useState(null)
    const [orderUpdate, setOrderUpdate] = useState(null)
    const socketRef = useRef(null)

    useEffect(() => {
        const socket = io(process.env.NEXT_PUBLIC_WS_URL, {
            auth: { token: getToken() }
        })
        socketRef.current = socket

        socket.on('connect', () => {
            console.log('WebSocket connected')
            socket.emit('join', userId)
            socket.emit('subscribe', symbol)
        })

        socket.on('priceUpdate', (data) => {
            if (data.symbol === symbol) setPrice(data.price)
        })
        socket.on('orderUpdate', (data) => {
            setOrderUpdate(data)
        })
        return () => {
            socket.emit('unsubscribe', symbol)
            socket.disconnect()
        }

    }, [symbol, userId])

    return { price, orderUpdate };
}
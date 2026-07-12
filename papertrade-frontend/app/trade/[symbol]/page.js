'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import CandlestickChart from '@/components/CandlestickChart'
import ChartReplay from '@/components/ChartReplay'
import IndicatorOverlay from '@/components/IndicatorOverlay'
import OrderPanel from '@/components/OrderPanel'
import { useStockPrice } from '@/hooks/useWebSocket'
import apiClient, { getUserId } from '@/lib/api'

const INTERVALS = [
    { label: '1D', value: 'daily' },
]
const INDICATOR_OPTIONS = ['SMA20', 'SMA50', 'EMA20', 'RSI', 'BB']

export default function TradePage() {
    const { symbol } = useParams()
    const [interval, setInterval] = useState('daily')
    const [activeTab, setActiveTab] = useState('chart')
    const [candles, setCandles] = useState([])
    const [loadingCandles, setLoadingCandles] = useState(false)
    const [activeIndicators, setActiveIndicators] = useState([])
    const { price } = useStockPrice(symbol, getUserId())

    useEffect(() => {
        if ((activeTab === 'replay' || activeTab === 'indicators') && candles.length === 0) {
            fetchCandles()
        }
    }, [activeTab])

    const fetchCandles =  async () => {
        setLoadingCandles(true)
        try{
            const res = await apiClient.get(
                `/api/stocks/candles/${symbol}?interval=daily`
            )
            setCandles(res.data)
        } finally {
            setLoadingCandles(false)
        }
    }
    const toggleIndicator = (name) => {
        setActiveIndicators(prev =>
            prev.includes(name)
            ? prev.filter(i => i !== name)
            : [...prev, name]
        )
    }

    return (
        <div className="min-h-screen bg-canvas text-ink p-6">
            <div className="flex items-center justify-between mb-4">
                <h1 className="text-2xl font-bold text-ink">
                    {symbol?.toUpperCase()}
                </h1>

                {activeTab === 'chart' && (
                    <div className="flex gap-2">
                    {INTERVALS.map(i => (
                        <button 
                            key={i.value} 
                            onClick={() => setInterval(i.value)}
                            className={`px-3 py-1 rounded text-sm font-medium ${interval === i.value ? 'bg-mint text-canvas' : 'bg-card text-muted hover:bg-border'}`}>
                                {i.label}
                        </button>
                    ))}
                </div>
                )}
            </div>

            <div className="flex gap-2 mb-4">
                <button
                    onClick={() => setActiveTab('chart')}
                    className={`px-4 py-2 rounded text-sm font-medium ${activeTab === 'chart' ? 'bg-mint text-canvas' : 'bg-card text-muted'}`}>
                    Live Chart
                </button>
                <button
                    onClick={() => setActiveTab('replay')}
                    className={`px-4 py-2 rounded text-sm font-medium ${activeTab === 'replay' ? 'bg-mint text-canvas' : 'bg-card text-muted'}`}>
                        Replay
                </button>
                <button
                    onClick={() => setActiveTab('indicators')}
                    className={`px-4 py-2 rounded text-sm font-medium ${activeTab === 'indicators' ? 'bg-mint text-canvas' : 'bg-card text-muted'}`}>
                    Indicators
                </button>
            </div>

            {activeTab === 'indicators' && (
                <div className='flex gap-2 mb-4 flex-wrap'>
                    {INDICATOR_OPTIONS.map(ind => (
                        <button
                            key={ind}
                            onClick={() => toggleIndicator(ind)}
                            className = {`px-3 py-1 rounded text-sm font-medium ${activeIndicators.includes(ind) ? 'bg-mint text-canvas' : 'bg-card text-muted hover:bg-border'}`}>
                                {ind}
                            </button>
                    ))}
                </div>
            )}

            <div className="bg-card rounded-lg p-4">
                {activeTab === 'chart' && (
                    <CandlestickChart
                        symbol={symbol?.toUpperCase()}
                        interval={interval}
                    />
                )}
                {activeTab === 'replay' && (
                    loadingCandles ? (
                        <div className="text-mint text-center py-20">
                            Loading candles...
                        </div>
                    ) : (
                        <ChartReplay
                            symbol={symbol?.toUpperCase()}
                            allCandles={candles}
                        />
                    )
                )}

                {activeTab === 'indicators' && (
                    loadingCandles ? (
                        <div className="text-mint text-center py-20">
                            Loading candles...
                        </div>
                    ) :  (
                        <IndicatorOverlay
                            candles={candles}
                            activeIndicators={activeIndicators}
                        />
                    )
                )}
            </div>
            <div className="mt-4">
                <OrderPanel
                    symbol={symbol?.toUpperCase()}
                    currentPrice={price}
                />
            </div>
        </div>
    )
}
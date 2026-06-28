'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import CandlestickChart from '@/components/CandlestickChart'
import ChartReplay from '@/components/ChartReplay'
import IndicatorOverlay from '@/components/IndicatorOverlay'
import apiClient from '@/lib/api'
import OrderPanel from '@/components/OrderPanel'

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

    useEffect(() => {
        if (activeTab === 'replay' && candles.length === 0) {
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
        <div className="min-h-screen bg-gray-950 text-white p-6">
            <div className="flex items-center justify-between mb-4">
                <h1 className="text-2xl font-bold text-white">
                    {symbol?.toUpperCase()}
                </h1>

                {activeTab === 'chart' && (
                    <div className="flex gap-2">
                    {INTERVALS.map(i => (
                        <button 
                            key={i.value} 
                            onClick={() => setInterval(i.value)}
                            className={`px-3 py-1 rounded text-sm font-medium ${interval === i.value ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>
                                {i.label}
                        </button>
                    ))}
                </div>
                )}
            </div>

            <div className="flex gap-2 mb-4">
                <button
                    onClick={() => setActiveTab('chart')}
                    className={`px-4 py-2 rounded text-sm font-medium ${activeTab === 'chart' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400'}`}>
                    Live Chart
                </button>
                <button
                    onClick={() => setActiveTab('replay')}
                    className={`px-4 py-2 rounded text-sm font-medium ${activeTab === 'replay' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400'}`}>
                        Replay
                </button>
                <button
                    onClick={() => setActiveTab('indicators')}
                    className={`px-4 py-2 rounded text-sm font-medium ${activeTab === 'indicators' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400'}`}>
                    Indicators
                </button>
            </div>

            {activeTab === 'indicators' && (
                <div className='flex gap-2 mb-4 flex-wrap'>
                    {INDICATOR_OPTIONS.map(ind => (
                        <button
                            key={ind}
                            onClick={() => toggleIndicator(ind)}
                            className = {`px-3 py-1 rounded text-sm font-medium ${activeIndicators.includes(ind) ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>
                                {ind}
                            </button>
                    ))}
                </div>
            )}

            <div className="bg-gray-900 rounded-lg p-4">
                {activeTab === 'chart' && (
                    <CandlestickChart
                        symbol={symbol?.toUpperCase()}
                        interval={interval}
                    />
                )}
                {activeTab === 'replay' && (
                    loadingCandles ? (
                        <div className="text-blue-400 text-center py-20">
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
                        <div className="text-blue-400 text-center py-20">
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
                    currentPrice={null}
                />
            </div>
        </div>
    )
}
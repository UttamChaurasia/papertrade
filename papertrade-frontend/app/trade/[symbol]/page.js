'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import CandlestickChart from '@/components/CandlestickChart'

const INTERVALS = [
    { label: '1D', value: 'daily' },
    { label: '60m', value: '60min' },
    { label: '30m', value: '30min' },
    { label: '5m', value: '5min' },
]
export default function TradePage() {
    const { symbol } = useParams()
    const [interval, setInterval] = useState('daily')

    return (
        <div className="min-h-screen bg-gray-950 text-white p-6">
            <div className="flex items-center justify-between mb-4">
                <h1 className="text-2xl font-bold text-white">
                    {symbol?.toUpperCase()}
                </h1>

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
            </div>

            <div className="bg-gray-900 rounded-lg p-4">
                <CandlestickChart symbol={symbol?.toUpperCase()} internal={interval}/>
            </div>

        </div>
    )
}
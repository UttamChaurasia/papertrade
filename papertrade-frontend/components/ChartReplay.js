'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createChart, CandlestickSeries } from 'lightweight-charts'

export default function ChartReplay({ symbol, allCandles }) {
    const chartRef = useRef(null)
    const seriesRef = useRef(null)
    const chartObj = useRef(null)
    const intervalRef = useRef(null)

    const [isPlaying, setIsPlaying] = useState(false)
    const [currentIndex, setCurrentIndex] = useState(0)
    const [speed, setSpeed] = useState(500)

    useEffect(() => {
        if (!chartRef.current || !allCandles?.length) return

        const chart = createChart(chartRef.current, {
            width: chartRef.current.clientWidth,
            height: 350,
            layout: { background: { color: '#0F0A1C' }, textColor: '#8E7FA6' },
            grid: {
                vertLines: { color: '#2A1F45' },
                horzLines: { color: '#2A1F45' },
            },
        })

        chartObj.current = chart
        const series = chart.addSeries(CandlestickSeries, {
            upColor: '#00F2B2', downColor: '#FF1F44',
            borderUpColor: '#00F2B2', borderDownColor: '#FF1F44',
            wickUpColor: '#00F2B2', wickDownColor: '#FF1F44',
        })

        seriesRef.current = series

        setCurrentIndex(50)
        series.setData(allCandles.slice(0, 50))

        return () => {
            chart.remove()
            clearInterval(intervalRef.current)
        }
    }, [allCandles])

    const play = useCallback(() => {
        if (currentIndex >= allCandles.length) return

        setIsPlaying(true)

        intervalRef.current = setInterval(() => {
            setCurrentIndex(prev => {
                const next = prev + 1

                if (next >= allCandles.length) {
                    clearInterval(intervalRef.current)
                    setIsPlaying(false)
                    return prev
                }

                seriesRef.current?.update(allCandles[next])
                return next
            })
        }, speed)
    }, [currentIndex, allCandles, speed])

    const pause = () => {
        clearInterval(intervalRef.current)
        setIsPlaying(false)
    }
    const seek = (index) => {
        pause()
        setCurrentIndex(index)
        seriesRef.current?.setData(allCandles.slice(0, index+1))
    }

    return (
        <div className='flex flex-col gap-3'>
            <div ref={chartRef} className='w-full' />

            <input
                type='range'
                min={50}
                max={allCandles?.length - 1}
                value={currentIndex}
                onChange={e => seek(Number(e.target.value))}
                className='w-full accent-mint'
            />

            <div className='flex items-center gap-3'>
                {isPlaying ? (
                    <button onClick={pause}
                        className='px-4 py-2 bg-crimson rounded'>Pause</button>
                )   :   (
                    <button onClick={play}
                        className='px-4 py-2 bg-mint rounded'>Play</button>
                )}

                <span className='text-muted text-sm'>Speed</span>

                {[1000, 500, 200, 100].map(s => (
                    <button key={s} onClick={() => setSpeed(s)}
                        className={`px-3 py-1 rounded text-sm ${
                            speed === s ? 'bg-mint' : 'bg-card'
                        }`}>
                            {s === 1000 ? '1x' : s === 500 ? '2x' : s === 200 ? '5x' : '10x'}
                        </button>
                ))}

                <span className='text-muted text-sm ml-auto'>
                    Candle {currentIndex} / {allCandles?.length}
                </span>
            </div>
        </div>
    )
}
'use client'

import { useEffect, useRef, useState } from 'react'
import { createChart, CandlestickSeries } from 'lightweight-charts'
import { useStockPrice } from '@/hooks/useWebSocket'
import { getUserId } from '@/lib/api'

const getToken = () => localStorage.getItem('accessToken')

export default function CandlestickChart({ symbol, interval = 'daily' }) {
    const chartRef = useRef(null)
    const chartInstance = useRef(null)
    const candleSeriesRef = useRef(null)
    const lastCandleRef = useRef(null)
    const [loading, setLoading] = useState(true)
    const { price } = useStockPrice(symbol, getUserId())

  useEffect(() => {
    if (!chartRef.current) return

    const chart = createChart(chartRef.current, {
      width: chartRef.current.clientWidth,
      height: 400,
      layout: {
        background: { color: '#0F0A1C' },
        textColor: '#8E7FA6',
      },
      grid: {
        vertLines: { color: '#2A1F45' },
        horzLines: { color: '#2A1F45' },
      },
      crosshair: { mode: 1 },
      rightPriceScale: { borderColor: '#2A1F45' },
      timeScale: { borderColor: '#2A1F45' },
    })

    chartInstance.current = chart

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#00F2B2',
      downColor: '#FF1F44',
      borderUpColor: '#00F2B2',
      borderDownColor: '#FF1F44',
      wickUpColor: '#00F2B2',
      wickDownColor: '#FF1F44',
    })

    candleSeriesRef.current = candleSeries
    fetchCandles()
    const handleResize = () => {
      chart.applyOptions({ width: chartRef.current.clientWidth })
    }
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      chart.remove()
    }
  }, [symbol, interval])

  const fetchCandles = async () => {
  setLoading(true)
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/stocks/candles/${symbol}?interval=${interval}`,
      { headers: { Authorization: `Bearer ${getToken()}` } }
    )
    const candles = await response.json()

    if (Array.isArray(candles) && candles.length > 0) {
        candleSeriesRef.current?.setData(candles)
        chartInstance.current?.timeScale().fitContent()
        lastCandleRef.current = candles[candles.length - 1]
    }
  } finally {
    setLoading(false)
  }
}

  // Push live WebSocket price into the last candle whenever the cron broadcasts one
  useEffect(() => {
    if (!price || !lastCandleRef.current || !candleSeriesRef.current) return

    const updated = {
      ...lastCandleRef.current,
      close: price,
      high: Math.max(lastCandleRef.current.high, price),
      low: Math.min(lastCandleRef.current.low, price),
    }

    candleSeriesRef.current.update(updated)
    lastCandleRef.current = updated
  }, [price])

  return (
    <div className="relative w-full">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-card bg-opacity-80 z-10">
          <div className="text-mint">Loading chart...</div>
        </div>
      )}
      <div ref={chartRef} className="w-full" />
    </div>
  )
}
'use client'

import { useEffect, useRef, useState } from 'react'
import { createChart, CandlestickSeries } from 'lightweight-charts'

const getToken = () => localStorage.getItem('accessToken')
export default function CandlestickChart({ symbol, interval = 'daily' }) {
    const chartRef = useRef(null)
    const chartInstance = useRef(null)
    const candleSeriesRef = useRef(null)
    const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!chartRef.current) return

    const chart = createChart(chartRef.current, {
      width: chartRef.current.clientWidth,
      height: 400,
      layout: {
        background: { color: '#0D1117' },
        textColor: '#C9D1D9',
      },
      grid: {
        vertLines: { color: '#30363D' },
        horzLines: { color: '#30363D' },
      },
      crosshair: { mode: 1 },
      rightPriceScale: { borderColor: '#30363D' },
      timeScale: { borderColor: '#30363D' },
    })

    chartInstance.current = chart

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#3FB950',
      downColor: '#F78166',
      borderUpColor: '#3FB950',
      borderDownColor: '#F78166',
      wickUpColor: '#3FB950',
      wickDownColor: '#F78166',
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
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/stocks/candles/${symbol}?interval=${interval}`,
      { headers: { Authorization: `Bearer ${getToken()}` } }
    )
    const candles = await res.json()

    if (Array.isArray(candles) && candles.length>0){
        candleSeriesRef.current?.setData(candles)
        chartInstance.current?.timeScale().fitContent()
    }
  } finally {
    setLoading(false)
  }
}
  return (
    <div className="relative w-full">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-80 z-10">
          <div className="text-blue-400">Loading chart...</div>
        </div>
      )}
      <div ref={chartRef} className="w-full" />
    </div>
  )
}
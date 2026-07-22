'use client'
import { useEffect, useRef } from 'react'
import { createChart, CandlestickSeries, LineSeries } from 'lightweight-charts'
import {
    calculateSMA,
    calculateEMA,
    calculateRSI,
    calculateBollingerBands,
} from '../lib/indicators'

export default function IndicatorOverlay({ candles, activeIndicators }) {
    const mainChartRef = useRef(null)
    const rsiChartRef = useRef(null)
    const mainChart = useRef(null)
    const rsiChart = useRef(null)

    useEffect(() => {
        if (!mainChartRef.current || !candles?.length) return

        const chart = createChart(mainChartRef.current, {
            height: 380,
            layout: {
                background: { color: '#0F0A1C' },
                textColor: '#8E7FA6',
            },
            grid: {
                vertLines: { color: '#2A1F45' },
                horzLines: { color: '#2A1F45' },
            },
        })
        mainChart.current = chart

        const candleSeries = chart.addSeries(CandlestickSeries, {
            upColor: '#00F2B2',
            downColor: '#FF1F44',
            borderUpColor: '#00F2B2',
            borderDownColor: '#FF1F44',
            wickUpColor: '#00F2B2',
            wickDownColor: '#FF1F44',
        })
        candleSeries.setData(candles)

        if (activeIndicators.includes('SMA20')) {
            const sma20 = chart.addSeries(LineSeries, { color: '#58A6FF', lineWidth: 1 })
            sma20.setData(calculateSMA(candles, 20))
        }

        if (activeIndicators.includes('SMA50')) {
            const sma50 = chart.addSeries(LineSeries, { color: '#E3B341', lineWidth: 1 })
            sma50.setData(calculateSMA(candles, 50))
        }

        if (activeIndicators.includes('EMA20')) {
            const ema = chart.addSeries(LineSeries, { color: '#BC8CFF', lineWidth: 1 })
            ema.setData(calculateEMA(candles, 20))
        }

        if (activeIndicators.includes('BB')) {
            const bb = calculateBollingerBands(candles)
            const upper = chart.addSeries(LineSeries, { color: '#F78166', lineWidth: 1 })
            const mid   = chart.addSeries(LineSeries, { color: '#8B949E', lineWidth: 1 })
            const lower = chart.addSeries(LineSeries, { color: '#F78166', lineWidth: 1 })
            upper.setData(bb.upper)
            mid.setData(bb.middle)
            lower.setData(bb.lower)
        }

        chart.timeScale().fitContent()

        // RSI sub-chart
        if (activeIndicators.includes('RSI') && rsiChartRef.current) {
            const rsiC = createChart(rsiChartRef.current, {
                height: 120,
                layout: {
                    background: { color: '#0F0A1C' },
                    textColor: '#8E7FA6',
                },
                grid: {
                    vertLines: { color: '#2A1F45' },
                    horzLines: { color: '#2A1F45' },
                },
                rightPriceScale: {
                    scaleMargins: { top: 0.1, bottom: 0.1 },
                },
            })
            rsiChart.current = rsiC

            const rsiSeries = rsiC.addSeries(LineSeries, { color: '#BC8CFF', lineWidth: 1 })
            rsiSeries.setData(calculateRSI(candles))

            const ob = rsiC.addSeries(LineSeries, { color: '#FF1F44', lineWidth: 1 })
            ob.setData(candles.map(c => ({ time: c.time, value: 70 })))

            const os = rsiC.addSeries(LineSeries, { color: '#00F2B2', lineWidth: 1 })
            os.setData(candles.map(c => ({ time: c.time, value: 30 })))
        }

        return () => {
            chart.remove()
            mainChart.current = null

            if (rsiChart.current) {
                rsiChart.current.remove()
                rsiChart.current = null
            }
        }
    }, [candles, activeIndicators])

    return (
        <div className="flex flex-col">
            <div ref={mainChartRef} className="w-full" />

            <div
                ref={rsiChartRef}
                className="w-full mt-1"
                style={{ display: activeIndicators.includes('RSI') ? 'block' : 'none' }}
            />
        </div>
    )
}
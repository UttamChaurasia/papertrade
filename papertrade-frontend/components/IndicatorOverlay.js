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
                background: { color: '#0D1117' },
                textColor: '#C9D1D9',
            },
            grid: {
                vertLines: { color: '#30363D' },
                horzLines: { color: '#30363D' },
            },
        })
        mainChart.current = chart

        const candleSeries = chart.addSeries(CandlestickSeries, {
            upColor: '#3FB950',
            downColor: '#F78166',
            borderUpColor: '#3FB950',
            borderDownColor: '#F78166',
            wickUpColor: '#3FB950',
            wickDownColor: '#F78166',
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
                    background: { color: '#0D1117' },
                    textColor: '#C9D1D9',
                },
                grid: {
                    vertLines: { color: '#30363D' },
                    horzLines: { color: '#30363D' },
                },
                rightPriceScale: {
                    scaleMargins: { top: 0.1, bottom: 0.1 },
                },
            })
            rsiChart.current = rsiC

            const rsiSeries = rsiC.addSeries(LineSeries, { color: '#BC8CFF', lineWidth: 1 })
            rsiSeries.setData(calculateRSI(candles))

            const ob = rsiC.addSeries(LineSeries, { color: '#F78166', lineWidth: 1 })
            ob.setData(candles.map(c => ({ time: c.time, value: 70 })))

            const os = rsiC.addSeries(LineSeries, { color: '#3FB950', lineWidth: 1 })
            os.setData(candles.map(c => ({ time: c.time, value: 30 })))
        }

        return () => {
            chart.remove()
            rsiChart.current?.remove()
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
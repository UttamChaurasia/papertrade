'use client'
import { useEffect, useRef } from 'react'
import { createChart } from 'lightweight-charts'
import { 
    calculateSMA,
    calculateEMA,
    calculateRSI,
    calculateBollingerBands,
} from '../utils/indicators'

export default function IndicatorOverlay({ candles, activeIndicators }) {
    const mainChartRef = useRef(null)
    const rsiChartRef = useRef(null)
    const mainChart = useRef(null)
    const rsiChart = useRef(null)

    useEffect(() => {
        if (!mainChartRef.current || !candles?.length) return

        //create chart
        const chart = createChart(mainChartRef.current, {
            height: 380,
            layout: {
                background: { bottomColor: '#0D1117'},
                textColor: '#C9D1D9',
            },
            grid: {
                vertLines: { color: '#30363D'},
                horzLines: { color: '#30363D'},
            },
        })
        mainChart.current = chart

        //candlestick base series
        const candleSeries = chart.addCandlestickSeries({
            upColor: '#3FB950',
            downColor: '#F78166',
            borderUpColor: '#3FB950',
            borderDownColor: '#F78166',
            wickUpColor: '#3FB950',
            wickDownColor: '#F78166',
        })
        candleSeries.setData(candles)

        //SMA 20 overlay
        if (activeIndicators.includes('SMA20')) {
            const sma20Series = chart.addLineSeries({
                color: '#58A6FF'
                lineWidth: 1,
            })
            sma20Series.setDtata(calculateSMA(candles, 20))
        }

        //SMA 50 overlay
        if (activeIndicators.includes('SMA50')) {
            const sma50Series = chart.addLineSeries({
                color: '#E3B341',
                lineWidth: 1,
            })
            sma50Series.setData(calculateSMA(candles, 50))
        }

        //EMA 20 overlay
        if (activeIndicators.includes('EMA20')) {
            const emaSeries = chart.addLineSeries({
                color: '#BC8CFF',
                lineWidth: 1,
            })
            emaSeries.setData(calculateEMA(candles, 20))
        }

        //Bollinger Bands overlay
        if (activeIndicators.includes('BB')) {
            const bb = calculateBollingerBands(candles)

            const upperSeries = chart.addLineSeries({ color: '#F78166', lineWidth: 1})
            const midSeries = chart.addLineSeries({ color: '#8B949E', lineWidth: 1})
            const lowerSeries = chart.addLineSeries({ color: '#F78166', lineWidth: 1})

            upperSeries.setData(bb.upper)
            midSeries.setData(bb.middle)
            lowerSeries.setData(bb.lower)
        }

        chart.timeScale().fitContent()

        //RSI sub-chart
        if (activeIndicators.includes('RSI') && rsiChartRef.current) {
            const rsiC = ccreateChart(rsiChartRef.current, {
                height: 120,
                layout: {
                    background: { color: '#0D1117' },
                    textColor: '#C9D1D9',
                },
                grid: {
                    vertLines: { color: '#30363D' },
                    horzLines: { color: '#30363D'},
                },
                rightPriceScale: {
                    scaleMargins: { top: 0.1, bottom: 0.1 },
                },
            })
            rsiChart.current = rsiC

            //rsi line
            const rsiSeries = rsiC.addLineSeries({ color: '#BC8CFF', lineWidth: 1 })
            rsiSeries.setData(calculateRSI(candles))

            // Overbought line at 70 (red)
            const ob = rsiC.addLineSeries({ color: '#F78166', lineWidth: 1 })
            ob.setData(candles.map(c => ({ time: c.time, value: 70 })))

            // Oversold line at 30 (green)
            const os = rsiC.addLineSeries({ color: '#3FB950', lineWidth: 1 })
            os.setData(candles.map(c => ({ time: c.time, value: 30 })))
        }

        //Cleanup
        return () => {
            chart.remove()
            rsiChart.current?.remove()
        }
    }, [candles, activeIndicators])

    return (
        <div className="flex flex-col">
            <div ref={mainChartRef} className="w-full"/>

            {activeIndicators.includes('RSI') && (
                <div ref={rsiChartRef} className="w-full mt-1"/>
            )}
        </div>
    )
}
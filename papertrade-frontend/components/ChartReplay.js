import { useState, useEffect, useRef, UseCallback } from 'react'
import { createChart } from 'lightweight-charts'

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
            layout: { background: { color: '#0D1117' }, textColor: '#C9D1D9' },
            grid: {
                vertLines: { color: '#30363D'},
                horzLines: { color: '#30363D'},
            },
        })

        chartObj.current = chart
        const series = chart.addCandlestickSeries({
            upColor: '#3FB950', downColor: '#F78166',
            borderUpColor: '#3FB950', borderDownColor: 'F78166',
            wickUpColor: '#3FB950', wickDownColor: 'F78166',
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

            {/* chart renders*/}
            <div ref={chartRef} className='w-full' />

            {/* timeline scrubber*/}
            <input
                type='range'
                min={50}
                max={allCandles?.length - 1}
                value={currentIndex}
                onChange={e => seek(Number(e.target.value))}
                className='w-full accent-blue-400'
            />

            {/* controls */}
            <div className='flex items-center gap-3'>
                {isPlaying ? (
                    <button onClick={pause}
                        className='px-4 py-2 bg-yellow-600 rounded'>Pause</button>
                )   :   (
                    <button onClick={play}
                        className='px-4 py-2 bg-green-600 rounded'>Play</button>
                )}

                <span className='text-gray-400 text-sm'>Speed</span>

                {[1000, 500, 200, 100].map(s => (
                    <button key={s} onClick={() => setSpeed(s)}
                        className={`px-3 py-1 rounded text-sm ${
                            speed === s ? 'bg-blue-600' : 'bg-gray-700'
                        }`}>
                            {s === 1000 ? '1x' : s === 500 ? '2x' : s === 200 ? '5x' : '10x'}
                        </button>
                ))}

                <span className='text-gray-400 text-sm ml-auto'>
                    Candle {currentIndex} / {allCandles?.length}
                </span>
            </div>
        </div>
    )
}
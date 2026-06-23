// EMA - exponential moving average
export function calculateEMA(candles, period) {
    const result = []
    const k = 2 / (period + 1)
    const firstSlice = candles.slice(0, period)
    let ema = firstSlice.reduce((s, c) => s + c.close, 0) / period
    result.push({ time: candles[period - 1].time, value: ema })
    for (let i = period; i < candles.length; i++) {
        ema = candles[i].close * k + ema * (1 - k)
        result.push({ time: candles[i].time, value: ema })
    }
    return result
}
// SMA-simple moving average
export function calculateSMA(candles, period) {
    const result = []
    for
    (let i=period-1; i<candles.length; i++){
        const slice = candles.slice(i-period+1, i+1)
        const sum = slice.reduce((acc, c) => acc + c.close, 0)
        result.push({ time: candles[i].time, value: sum/period })
    }
    return result
}

//EMA-exponential moving average
export function calculateRSI(candles, period = 14) {
    const result = []
    const gains = []
    const losses = []

    for (let i = 1; i<candles.length; i++){
        const change = candles[i].close - candles[i-1].close
        gains.push(change>0 ? change : 0)
        losses.push(change<0 ? Math.abs(change) : 0)
    }
    let avgGain = gains.slice(0, period).reduce((a, b) => a+b) / period
    let avgLoss = losses.slice(0, period).reduce((a, b) => a+b) / period

    const rsi = (ag, al) => 100 - (100 / (1 + ag / (al || 0.0001)))
    result.push({ time: candles[period].time, value: rsi(avgGain, avgLoss) })

    for( let i=period; i< gains.length; i++){
        avgGain = (avgGain * (period-1) + gains[i]) /period
        avgLoss = (avgLoss * (period-1) + losses[i]) /period
        result.push({ time: candles[i+1].time, value: rsi(avgGain, avgLoss) })
    }
    return result
}

//bollinger bands
export function calculateBollingerBands(candles, period = 20, multiplier = 2) {
    const upper = []
    const middle = []
    const lower = []
    for (let i=period-1; i<candles.length; i++){
        const slice = candles.slice(i-period+1, i+1)
        const closes = slice.map(c => c.close)

        const sma = closes.reduce((a, b) => a + b) / period
        const variance = closes.reduce((s, c) => s + Math.pow(c - sma, 2), 0) / period
        const stdDev = Math.sqrt(variance)
        const t = candles[i].time
        upper.push({ time: t, value: sma + multiplier * stdDev })
        middle.push({ time: t, value: sma })
        lower.push({ time: t, value: sma - multiplier * stdDev })

    }
    return { upper, middle, lower }
}
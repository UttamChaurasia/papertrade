'use client'

import { useState, useEffect } from 'react'
import apiclient from '@/lib/api'

export default function OrderPanel({ symbol, currentPrice }) {
    const  [side, setSide] = useState('BUY')
    const [type, setType] = useState('LIMIT')
    const [price, setPrice] = useState(currentPrice || '')
    const [quantity, setQuantity] = useState('')
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState(null)

    useEffect(() => {
        if (currentPrice) setPrice(currentPrice)
    }, [currentPrice])

    const totalCost = price && quantity
        ? (parseFloat(price) * parseInt(quantity)).toLocaleString('en-IN')
        : '0'
    
    const handleSubmit = async () => {
        if (!price || !quantity) {
            setMessage({ text: 'Please fill in price and quantity', success: false })
            return
        }
        setLoading(true)
        setMessage(null)

        try{
            await apiclient.post('/api/orders', {
                symbol: symbol.toUpperCase(),
                side,
                type,
                price: parseFloat(price),
                quantity: parseInt(quantity),
            })
            setMessage({ text: `${side} order placed successfully!`, success: true })
            setQuantity('')
        } catch (err) {
            const errMsg = err.response?.data?.message || 'Failed to place order'
            setMessage({ text: errMsg, success: false })
        } finally {
            setLoading(false)
        }
    }
    return (
        <div className="bg-card rounded-lg p-4 w-full max-w-sm">
            <div className="flex mb-4">
                <button
                    onClick={() => setSide('BUY')}
                    className={`flex-1 py-2 rounded-l font-medium text-sm ${
                        side === 'BUY' ? 'bg-mint text-canvas' : 'bg-canvas text-muted'
                    }`}>
                    BUY
                </button>
                <button
                    onClick={() => setSide('SELL')}
                    className={`flex-1 py-2 rounded-r font-medium text-sm ${
                        side === 'SELL' ? 'bg-crimson text-ink' : 'bg-canvas text-muted'
                    }`}>
                    SELL
                </button>
            </div>
            <div className="flex gap-2 mb-4">
                {['LIMIT', 'MARKET'].map(t => (
                    <button
                        key={t}
                        onClick={() => setType(t)}
                        className={`flex-1 py-1 rounded text-xs font-medium ${
                            type === t ? 'bg-mint text-canvas' : 'bg-canvas text-muted'
                    }`}>
                        {t}
                    </button>
                ))}
            </div>
            <div className="mb-3">
                <label className="text-muted text-xs mb-1 block">
                    Price (Rs.)
                </label>
                <input
                    type="number"
                    value={price}
                    onChange={e => setPrice(e.target.value)}
                    disabled={type === 'MARKET'}
                    placeholder={type === 'MARKET' ? 'At market price' : 'Enter price'}
                    className="w-full bg-canvas text-ink px-3 py-2 rounded text-sm
                                border border-border focus:border-mint outline-none
                                disabled:opacity-50"
                />
            </div>
            <div className="mb-3">
                <label className="text-muted text-xs mb-1 block">Quantity</label>
                <input
                    type="number"
                    value={quantity}
                    onChange={e => setQuantity(e.target.value)}
                    placeholder="Number of shares"
                    className="w-full bg-canvas text-ink px-3 py-2 rounded text-sm
                                border border-border focus:border-mint outline-none"
                />
            </div>
            <div className="flex justify-between text-xs text-muted mb-4">
                <span>Estimated total</span>
                <span className="text-ink font-mono">Rs.{totalCost}</span>
            </div>

            {message && (
                <div className={`text-xs px-3 py-2 rounded mb-3 ${
                    message.success ? 'bg-mint/15 text-mint' : 'bg-crimson/15 text-crimson'
                }`}>
                    {message.text}
                </div>
            )}
            <button
                onClick={handleSubmit}
                disabled={loading}
                className={`w-full py-2 rounded font-medium text-sm ${
                side === 'BUY'
                ? 'bg-mint hover:bg-mint/80 text-canvas'
                : 'bg-crimson hover:bg-crimson/80 text-ink'
                } disabled:opacity-50`}>
                {loading ? 'Placing...' : `Place ${side} Order`}
            </button>
        </div>
    )
}
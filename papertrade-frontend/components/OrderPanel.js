'use client'

import { usestate } from 'react'
import apiclient from '@/lib/api'

export default function OrderPanel({ symbol, currentPrice }) {
    const  [side, setSide] = useState('BUY')
    const [type, setType] = useState('LIMIT')
    const [price, setPrice] = useState(currentPrice || '')
    const [quantity, setQuantity] = useState('')
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState(null)

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
        <div clsaaName="bg-gray-900 rounded-lg p-4 w-full max-w-sm">
            <div className="flex mb-4">
                <button
                    onClick={() => setSide('BUY')}
                    className={`flex-1 py-2 rounded-1 font-medium text-sm ${
                        side === 'BUY' ? 'bg-green-600 text-white' : 'bg-gray-800 text-gray-400'
                    }`}>
                    BUY
                </button>
                <button
                    onClick={() => setSide('SELL')}
                    className={`flex-1 py-2 rounded-r font-medium text-sm ${
                        side === 'SELL' ? 'bg-red-600 text-white' : 'bg-gray-800 text-gray-400'
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
                            type === t ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400'
                    }`}>
                        {t}
                    </button>
                ))}
            </div>
            <div className="mb-3">
                <label className="text-gray-400 text-xs mb-1 block">
                    Price (Rs.)
                </label>
                <input
                    type="number"
                    value={price}
                    onChange={e => setPrice(e.target.value)}
                    disabled={type === 'MARKET'}
                    placeholder={type === 'MARKET' ? 'At market price' : 'Enter price'}
                    className="w-full bg-gray-800 text-white px-3 py-2 rounded text-sm
                                border border-gray-700 focus:border-blue-500 outline-none
                                disabled:opacity-50"
                />
            </div>
            <div className="mb-3">
                <label className="text-gray-400 text-xs mb-1 block">Quantity</label>
                <input
                    type="number"
                    value={quantity}
                    onChange={e => setQuantity(e.target.value)}
                    placeholder="Number of shares"
                    className="w-full bg-gray-800 text-white px-3 py-2 rounded text-sm
                                border border-gray-700 focus:border-blue-500 outline-none"
                />
            </div>
            <div className="flex justify-between text-xs text-gray-400 mb-4">
                <span>Estimated total</span>
                <span className="text-white font-mono">Rs.{totalCost}</span>
            </div>

            {message && (
                <div className={`text-xs px-3 py-2 rounded mb-3 ${
                    message.success ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'
                }`}>
                    {message.text}
                </div>
            )}
            <button
                onClick={handleSubmit}
                disabled={loading}
                className={`w-full py-2 rounded font-medium text-sm ${
                side === 'BUY'
                ? 'bg-green-600 hover:bg-green-500'
                : 'bg-red-600 hover:bg-red-500'
                } text-white disabled:opacity-50`}>
                {loading ? 'Placing...' : `Place ${side} Order`}
            </button>
        </div>
    )
}
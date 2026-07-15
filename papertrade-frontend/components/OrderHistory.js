'use client'

export default function OrderHistory({ orders, loading }) {
    if (loading) {
        return (
            <div className="bg-card rounded-lg p-4">
                <div className="text-muted text-sm">Loading orders...</div>
            </div>
        )
    }

    return (
        <div className="bg-card rounded-lg p-4">
            <h2 className="text-ink font-bold text-lg mb-4">Order History</h2>

            {!orders?.length ? (
                <div className="text-muted text-sm">No orders placed yet.</div>
            ) : (
                <table className="w-full text-sm">
                    <thead>
                        <tr className="text-muted text-left border-b border-border">
                            <th className="pb-2">Symbol</th>
                            <th className="pb-2">Side</th>
                            <th className="pb-2">Price</th>
                            <th className="pb-2">Qty</th>
                            <th className="pb-2">Status</th>
                            <th className="pb-2">Placed</th>
                        </tr>
                    </thead>
                    <tbody>
                        {orders.map(o => (
                            <tr key={o._id} className="border-b border-border">
                                <td className="py-2 text-ink font-medium">{o.symbol}</td>
                                <td className={`py-2 font-medium ${o.side === 'BUY' ? 'text-mint' : 'text-crimson'}`}>
                                    {o.side}
                                </td>
                                <td className="py-2 text-ink font-mono">
                                    Rs.{(o.pricePaise / 100).toFixed(2)}
                                </td>
                                <td className="py-2 text-ink">
                                    {o.filledQuantity}/{o.quantity}
                                </td>
                                <td className={`py-2 ${
                                    o.status === 'FILLED' ? 'text-mint' :
                                    o.status === 'CANCELLED' ? 'text-muted' : 'text-ink'
                                }`}>
                                    {o.status}
                                </td>
                                <td className="py-2 text-muted">
                                    {new Date(o.createdAt).toLocaleString('en-IN', {
                                        day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                                    })}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    )
}
'use client'

export default function PortfolioSummary({ portfolio, loading }) {
    if (loading) {
        return (
            <div className="bg-card rounded-lg p-4">
                <div className="text-muted text-sm">Loading portfolio...</div>
            </div>
        )
    }

    if (!portfolio || !portfolio.holdings?.length) {
        return (
            <div className="bg-card rounded-lg p-4">
                <h2 className="text-ink font-bold text-lg mb-2">Portfolio</h2>
                <div className="text-muted text-sm">No holdings yet — place your first order to get started.</div>
            </div>
        )
    }

    const { holdings, totalValue, totalInvested, totalPnL } = portfolio
    const isProfit = totalPnL >= 0

    return (
        <div className="bg-card rounded-lg p-4">
            <h2 className="text-ink font-bold text-lg mb-4">Portfolio</h2>

            <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="bg-canvas rounded p-3">
                    <div className="text-muted text-xs">Total Value</div>
                    <div className="text-ink font-mono text-lg">Rs.{totalValue.toLocaleString('en-IN')}</div>
                </div>
                <div className="bg-canvas rounded p-3">
                    <div className="text-muted text-xs">Invested</div>
                    <div className="text-ink font-mono text-lg">Rs.{totalInvested.toLocaleString('en-IN')}</div>
                </div>
                <div className="bg-canvas rounded p-3">
                    <div className="text-muted text-xs">Total P&L</div>
                    <div className={`font-mono text-lg ${isProfit ? 'text-mint' : 'text-crimson'}`}>
                        {isProfit ? '+' : ''}Rs.{totalPnL.toLocaleString('en-IN')}
                    </div>
                </div>
            </div>

            <table className="w-full text-sm">
                <thead>
                    <tr className="text-muted text-left border-b border-border">
                        <th className="pb-2">Symbol</th>
                        <th className="pb-2">Qty</th>
                        <th className="pb-2">Avg Price</th>
                        <th className="pb-2">Current</th>
                        <th className="pb-2">P&L</th>
                    </tr>
                </thead>
                <tbody>
                    {holdings.map(h => (
                        <tr key={h.symbol} className="border-b border-border">
                            <td className="py-2 text-ink font-medium">{h.symbol}</td>
                            <td className="py-2 text-ink">{h.quantity}</td>
                            <td className="py-2 text-muted font-mono">Rs.{h.avgPrice.toFixed(2)}</td>
                            <td className="py-2 text-ink font-mono">Rs.{h.currentPrice.toFixed(2)}</td>
                            <td className={`py-2 font-mono ${h.isProfit ? 'text-mint' : 'text-crimson'}`}>
                                {h.isProfit ? '+' : ''}Rs.{h.unrealizedPnL.toFixed(2)} ({h.unrealizedPnLPercent}%)
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}
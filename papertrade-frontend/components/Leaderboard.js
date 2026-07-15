'use client'

export default function Leaderboard({ traders, loading }) {
    if (loading) {
        return (
            <div className="bg-card rounded-lg p-4">
                <div className="text-muted text-sm">Loading leaderboard...</div>
            </div>
        )
    }

    return (
        <div className="bg-card rounded-lg p-4">
            <h2 className="text-mint font-bold text-lg mb-4">Top Traders</h2>

            {!traders?.length ? (
                <div className="text-muted text-sm">No rankings yet.</div>
            ) : (
                traders.map(t => (
                    <div key={t.rank}
                        className="flex items-center justify-between py-2 border-b border-border">
                        <div className="flex items-center gap-3">
                            <span className={`text-lg font-bold ${
                                t.rank === 1 ? 'text-yellow-400' :
                                t.rank === 2 ? 'text-muted' :
                                t.rank === 3 ? 'text-yellow-700' : 'text-muted'
                            }`}>#{t.rank}</span>
                            <span className="text-ink">{t.username}</span>
                        </div>
                        <div className="text-right">
                            <div className="text-ink font-mono">
                                Rs.{t.portfolioValue.toLocaleString('en-IN')}
                            </div>
                            <div className={`text-sm ${t.profit >= 0 ? 'text-mint' : 'text-crimson'}`}>
                                {t.profit >= 0 ? '+' : ''}{t.profitPercent}%
                            </div>
                        </div>
                    </div>
                ))
            )}
        </div>
    )
}
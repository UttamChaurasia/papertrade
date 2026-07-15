'use client'

import { useState, useEffect, useCallback } from 'react'
import apiClient from '@/lib/api'
import StockSearch from '@/components/StockSearch'
import PortfolioSummary from '@/components/PortfolioSummary'
import Leaderboard from '@/components/Leaderboard'
import OrderHistory from '@/components/OrderHistory'

export default function DashboardPage() {
    const [portfolio, setPortfolio] = useState(null)
    const [traders, setTraders] = useState([])
    const [orders, setOrders] = useState([])
    const [loading, setLoading] = useState(true)

    const fetchAll = useCallback(async () => {
        try {
            const [portfolioRes, leaderboardRes, ordersRes] = await Promise.all([
                apiClient.get('/api/portfolio'),
                apiClient.get('/api/leaderboard'),
                apiClient.get('/api/orders'),
            ])
            setPortfolio(portfolioRes.data)
            setTraders(leaderboardRes.data)
            setOrders(ordersRes.data)
        } catch (err) {
            console.log('Dashboard fetch failed ->', err.message)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchAll()
        const interval = setInterval(fetchAll, 30000)
        return () => clearInterval(interval)
    }, [fetchAll])

    return (
        <div className="min-h-screen bg-canvas text-ink p-6">
            <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
            <StockSearch />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 flex flex-col gap-6">
                    <PortfolioSummary portfolio={portfolio} loading={loading} />
                    <OrderHistory orders={orders} loading={loading} />
                </div>
                <Leaderboard traders={traders} loading={loading} />
            </div>
        </div>
    )
}
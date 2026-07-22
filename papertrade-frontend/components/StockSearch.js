'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import apiClient from '@/lib/api'

const RECENT_KEY = 'papertrade_recent_searches'
const MAX_RECENT = 8

export default function StockSearch() {
    const [query, setQuery] = useState('')
    const [results, setResults] = useState([])
    const [recent, setRecent] = useState([])
    const [showDropdown, setShowDropdown] = useState(false)
    const [searching, setSearching] = useState(false)
    const debounceRef = useRef(null)
    const wrapperRef = useRef(null)
    const router = useRouter()

    useEffect(() => {
        const stored = localStorage.getItem(RECENT_KEY)
        if (stored) setRecent(JSON.parse(stored))
    }, [])

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
                setShowDropdown(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current)

        if (!query.trim()) {
            setResults([])
            return
        }

        debounceRef.current = setTimeout(async () => {
            setSearching(true)
            try {
                const res = await apiClient.get(`/api/stocks/search?q=${encodeURIComponent(query)}`)
                setResults(res.data || [])
            } catch (err) {
                console.log('Search failed ->', err.message)
                setResults([])
            } finally {
                setSearching(false)
            }
        }, 400)

        return () => clearTimeout(debounceRef.current)
    }, [query])

    const goToStock = (symbol, name) => {
        const entry = { symbol, name }
        const updated = [entry, ...recent.filter(r => r.symbol !== symbol)].slice(0, MAX_RECENT)
        setRecent(updated)
        localStorage.setItem(RECENT_KEY, JSON.stringify(updated))

        setQuery('')
        setResults([])
        setShowDropdown(false)
        router.push(`/trade/${symbol}`)
    }

    const clearRecent = () => {
        setRecent([])
        localStorage.removeItem(RECENT_KEY)
    }

    return (
        <div ref={wrapperRef} className="relative w-full max-w-lg mb-6">
            <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onFocus={() => setShowDropdown(true)}
                placeholder="Search stocks (e.g. AAPL, MSFT)..."
                className="w-full bg-card border border-border rounded-lg px-4 py-2.5 text-ink
                            placeholder-muted focus:outline-none focus:border-mint"
            />

            {showDropdown && (
                <div className="absolute z-20 mt-2 w-full bg-card border border-border rounded-lg
                                shadow-lg max-h-80 overflow-y-auto">
                    {query.trim() ? (
                        searching ? (
                            <div className="p-3 text-muted text-sm">Searching...</div>
                        ) : results.length ? (
                            results.map((r, idx) => (
                                <button
                                    key={`${r.symbol}-${r.region}-${idx}`}
                                    onClick={() => goToStock(r.symbol, r.name)}
                                    className="w-full text-left px-4 py-2.5 hover:bg-canvas
                                                border-b border-border last:border-b-0"
                                >
                                    <div className="text-ink font-medium">{r.symbol}</div>
                                    <div className="text-muted text-xs">{r.name} · {r.region}</div>
                                </button>
                            ))
                        ) : (
                            <div className="p-3 text-muted text-sm">No matches found.</div>
                        )
                    ) : recent.length ? (
                        <>
                            <div className="flex items-center justify-between px-4 py-2 border-b border-border">
                                <span className="text-muted text-xs">Recent searches</span>
                                <button onClick={clearRecent} className="text-muted text-xs hover:text-crimson">
                                    Clear
                                </button>
                            </div>
                            {recent.map(r => (
                                <button
                                    key={r.symbol}
                                    onClick={() => goToStock(r.symbol, r.name)}
                                    className="w-full text-left px-4 py-2.5 hover:bg-canvas
                                                border-b border-border last:border-b-0"
                                >
                                    <div className="text-ink font-medium">{r.symbol}</div>
                                    <div className="text-muted text-xs">{r.name}</div>
                                </button>
                            ))}
                        </>
                    ) : (
                        <div className="p-3 text-muted text-sm">Start typing to search stocks.</div>
                    )}
                </div>
            )}
        </div>
    )
}
'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Tag, Search as SearchIcon, Clock, Flame, ChevronDown, RefreshCw } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { DealCard } from '@/components/DealCard'
import { SearchBar } from '@/components/SearchBar'
import { CategoryChips } from '@/components/CategoryChips'
import { StoreFilter } from '@/components/StoreFilter'
import { EmptyState } from '@/components/EmptyState'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { usePreferences } from '@/hooks/usePreferences'
import { PRIORITY_STORES } from '@/lib/constants'
import type { DealWithStore } from '@/types/database'

type SortOption = 'price-low' | 'price-high' | 'expiring' | 'name'

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' },
  { value: 'expiring', label: 'Expiring Soon' },
  { value: 'name', label: 'Name A-Z' },
]

const ITEMS_PER_PAGE = 24

export default function DealsPage() {
  const { selectedStores, watchList, zipCode } = usePreferences()

  const [allDeals, setAllDeals] = useState<DealWithStore[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSearching, setIsSearching] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [category, setCategory] = useState('')
  const [storeFilter, setStoreFilter] = useState('')
  const [sortBy, setSortBy] = useState<SortOption>('price-low')
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE)
  const [syncing, setSyncing] = useState(false)
  const [syncMessage, setSyncMessage] = useState<string | null>(null)

  const supabase = createClient()

  const fetchDeals = useCallback(async () => {
    setIsLoading(true)

    const { data: stores } = await supabase
      .from('gg_stores')
      .select('id, slug')
      .in('slug', selectedStores)

    const storeData = stores as { id: string; slug: string }[] | null

    if (!storeData || storeData.length === 0) {
      setAllDeals([])
      setIsLoading(false)
      return
    }

    const storeIds = storeData.map((s) => s.id)

    const { data, error } = await supabase
      .from('gg_deals')
      .select('*, gg_stores(*)')
      .in('store_id', storeIds)
      .gte('valid_to', new Date().toISOString().split('T')[0])
      .limit(500)

    if (error) {
      console.error('Error fetching deals:', error)
      setAllDeals([])
    } else {
      setAllDeals(data as DealWithStore[])
    }

    setIsLoading(false)
  }, [supabase, selectedStores])

  useEffect(() => {
    if (selectedStores.length > 0) {
      fetchDeals()
    } else {
      setIsLoading(false)
    }
  }, [selectedStores, fetchDeals])

  // Reset visible count when filters change
  useEffect(() => {
    setVisibleCount(ITEMS_PER_PAGE)
  }, [searchQuery, category, storeFilter, sortBy])

  // Filter and sort deals
  const filteredDeals = useMemo(() => {
    let filtered = allDeals

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter((d) => d.item_name.toLowerCase().includes(query))
    }

    if (category) {
      filtered = filtered.filter((d) => d.category === category)
    }

    if (storeFilter) {
      filtered = filtered.filter((d) => d.gg_stores?.slug === storeFilter)
    }

    // Sort
    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'price-low':
          return (a.price_numeric ?? 999) - (b.price_numeric ?? 999)
        case 'price-high':
          return (b.price_numeric ?? 0) - (a.price_numeric ?? 0)
        case 'expiring':
          return new Date(a.valid_to || '').getTime() - new Date(b.valid_to || '').getTime()
        case 'name':
          return a.item_name.localeCompare(b.item_name)
        default:
          return 0
      }
    })

    return filtered
  }, [allDeals, searchQuery, category, storeFilter, sortBy])

  // Featured sections
  const topDeals = useMemo(() => {
    return allDeals
      .filter((d) => d.price_numeric && d.price_numeric > 0 && d.price_numeric <= 5)
      .sort((a, b) => (a.price_numeric ?? 999) - (b.price_numeric ?? 999))
      .slice(0, 6)
  }, [allDeals])

  const expiringSoon = useMemo(() => {
    const twoDaysFromNow = new Date()
    twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2)
    return allDeals
      .filter((d) => d.valid_to && new Date(d.valid_to) <= twoDaysFromNow)
      .sort((a, b) => new Date(a.valid_to || '').getTime() - new Date(b.valid_to || '').getTime())
      .slice(0, 6)
  }, [allDeals])

  const visibleDeals = filteredDeals.slice(0, visibleCount)
  const hasMore = visibleCount < filteredDeals.length

  const handleAiSearch = async (query: string) => {
    setIsSearching(true)
    try {
      const response = await fetch('/api/ai-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, stores: selectedStores }),
      })

      if (response.ok) {
        const data = await response.json()
        if (data.searchTerms) setSearchQuery(data.searchTerms.join(' '))
        if (data.category) setCategory(data.category)
      }
    } catch (error) {
      console.error('AI search error:', error)
    }
    setIsSearching(false)
  }

  const isOnWatchList = (itemName: string) => {
    const itemLower = itemName.toLowerCase()
    return watchList.some((item) => itemLower.includes(item.keyword.toLowerCase()))
  }

  const getStoreNameFromSlug = (slug: string) => {
    return PRIORITY_STORES.find((s) => s.slug === slug)?.name || slug
  }

  const showFeaturedSections = !searchQuery && !category && !storeFilter

  const handleSync = async () => {
    setSyncing(true)
    setSyncMessage(null)
    try {
      const response = await fetch(`/api/scraper?zip=${zipCode}`)
      const data = await response.json()
      if (response.ok) {
        setSyncMessage(`Synced ${data.count} deals`)
        fetchDeals() // Refresh the deals list
      } else {
        setSyncMessage(data.error || 'Sync failed')
      }
    } catch {
      setSyncMessage('Failed to connect')
    } finally {
      setSyncing(false)
      // Clear message after 3 seconds
      setTimeout(() => setSyncMessage(null), 3000)
    }
  }

  if (selectedStores.length === 0) {
    return (
      <EmptyState
        icon={Tag}
        title="No stores selected"
        description="Please select at least one store to see deals."
        action={{
          label: 'Go to Settings',
          onClick: () => (window.location.href = '/settings'),
        }}
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
            This Week&apos;s Deals
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400">
            {allDeals.length} deals from {selectedStores.length} store{selectedStores.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <button
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing...' : 'Sync Deals'}
          </button>
          {syncMessage && (
            <p className="text-xs text-neutral-500 dark:text-neutral-400">{syncMessage}</p>
          )}
        </div>
      </div>

      {/* Search */}
      <SearchBar
        value={searchQuery}
        onChange={setSearchQuery}
        onAiSearch={handleAiSearch}
        placeholder="Search deals or try 'best deal on chicken'..."
        isLoading={isSearching}
      />

      {/* Filters */}
      <div className="space-y-4">
        <StoreFilter
          selectedStores={selectedStores}
          activeFilter={storeFilter}
          onFilterChange={setStoreFilter}
        />
        <div className="flex flex-wrap items-center justify-between gap-4">
          <CategoryChips selected={category} onSelect={setCategory} />

          {/* Sort Dropdown */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="appearance-none rounded-lg border border-neutral-200 bg-white py-2 pl-3 pr-10 text-sm font-medium text-neutral-700 transition-colors hover:border-neutral-300 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
          </div>
        </div>
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : allDeals.length === 0 ? (
        <EmptyState
          icon={SearchIcon}
          title="No deals found"
          description="Check back soon for new deals!"
        />
      ) : (
        <>
          {/* Featured Sections */}
          {showFeaturedSections && (
            <>
              {/* Top Deals Under $5 */}
              {topDeals.length > 0 && (
                <section>
                  <div className="mb-4 flex items-center gap-2">
                    <div className="rounded-lg bg-orange-100 p-1.5 dark:bg-orange-900/30">
                      <Flame className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                    </div>
                    <h2 className="font-semibold text-neutral-900 dark:text-white">
                      Hot Deals Under $5
                    </h2>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {topDeals.map((deal) => (
                      <DealCard
                        key={deal.id}
                        deal={deal}
                        isOnWatchList={isOnWatchList(deal.item_name)}
                      />
                    ))}
                  </div>
                </section>
              )}

              {/* Expiring Soon */}
              {expiringSoon.length > 0 && (
                <section>
                  <div className="mb-4 flex items-center gap-2">
                    <div className="rounded-lg bg-red-100 p-1.5 dark:bg-red-900/30">
                      <Clock className="h-4 w-4 text-red-600 dark:text-red-400" />
                    </div>
                    <h2 className="font-semibold text-neutral-900 dark:text-white">
                      Expiring Soon
                    </h2>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {expiringSoon.map((deal) => (
                      <DealCard
                        key={deal.id}
                        deal={deal}
                        isOnWatchList={isOnWatchList(deal.item_name)}
                      />
                    ))}
                  </div>
                </section>
              )}

              {/* Divider */}
              {(topDeals.length > 0 || expiringSoon.length > 0) && (
                <div className="flex items-center gap-4">
                  <div className="h-px flex-1 bg-neutral-200 dark:bg-neutral-800" />
                  <span className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
                    All Deals
                  </span>
                  <div className="h-px flex-1 bg-neutral-200 dark:bg-neutral-800" />
                </div>
              )}
            </>
          )}

          {/* All/Filtered Deals */}
          {filteredDeals.length === 0 ? (
            <EmptyState
              icon={SearchIcon}
              title="No matching deals"
              description="Try adjusting your search or filters."
              action={{
                label: 'Clear filters',
                onClick: () => {
                  setSearchQuery('')
                  setCategory('')
                  setStoreFilter('')
                },
              }}
            />
          ) : (
            <>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                Showing {visibleDeals.length} of {filteredDeals.length} deals
              </p>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {visibleDeals.map((deal) => (
                  <DealCard
                    key={deal.id}
                    deal={deal}
                    isOnWatchList={isOnWatchList(deal.item_name)}
                  />
                ))}
              </div>

              {/* Load More */}
              {hasMore && (
                <div className="flex justify-center pt-4">
                  <button
                    onClick={() => setVisibleCount((c) => c + ITEMS_PER_PAGE)}
                    className="rounded-lg border border-neutral-200 bg-white px-6 py-2.5 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700"
                  >
                    Load More ({filteredDeals.length - visibleCount} remaining)
                  </button>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  )
}

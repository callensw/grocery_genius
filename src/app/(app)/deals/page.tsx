'use client'

import { useState, useEffect, useCallback } from 'react'
import { Tag, Search as SearchIcon } from 'lucide-react'
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

export default function DealsPage() {
  const { selectedStores, watchList } = usePreferences()

  const [deals, setDeals] = useState<DealWithStore[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSearching, setIsSearching] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [category, setCategory] = useState('')
  const [storeFilter, setStoreFilter] = useState('')

  const supabase = createClient()

  const fetchDeals = useCallback(async () => {
    setIsLoading(true)

    // Get store UUIDs for selected stores
    const { data: stores } = await supabase
      .from('stores')
      .select('id, slug')
      .in('slug', selectedStores)

    const storeData = stores as { id: string; slug: string }[] | null

    if (!storeData || storeData.length === 0) {
      setDeals([])
      setIsLoading(false)
      return
    }

    const storeIds = storeData.map((s) => s.id)
    const storeIdMap = Object.fromEntries(storeData.map((s) => [s.slug, s.id]))

    let query = supabase
      .from('deals')
      .select('*, stores(*)')
      .in('store_id', storeIds)
      .gte('valid_to', new Date().toISOString().split('T')[0])
      .order('price_numeric', { ascending: true, nullsFirst: false })
      .limit(100)

    if (searchQuery) {
      query = query.ilike('item_name', `%${searchQuery}%`)
    }

    if (category) {
      query = query.eq('category', category)
    }

    if (storeFilter && storeIdMap[storeFilter]) {
      query = query.eq('store_id', storeIdMap[storeFilter])
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching deals:', error)
      setDeals([])
    } else {
      setDeals(data as DealWithStore[])
    }

    setIsLoading(false)
  }, [supabase, selectedStores, searchQuery, category, storeFilter])

  useEffect(() => {
    if (selectedStores.length > 0) {
      fetchDeals()
    } else {
      setIsLoading(false)
    }
  }, [selectedStores, fetchDeals])

  const handleAiSearch = async (query: string) => {
    setIsSearching(true)
    try {
      const response = await fetch('/api/ai-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          stores: selectedStores,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        if (data.searchTerms) {
          setSearchQuery(data.searchTerms.join(' '))
        }
        if (data.category) {
          setCategory(data.category)
        }
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
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
          This Week&apos;s Deals
        </h1>
        <p className="text-neutral-500 dark:text-neutral-400">
          Browse deals from {selectedStores.map(getStoreNameFromSlug).join(', ')}
        </p>
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
        <CategoryChips selected={category} onSelect={setCategory} />
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : deals.length === 0 ? (
        <EmptyState
          icon={SearchIcon}
          title="No deals found"
          description={
            searchQuery || category
              ? 'Try adjusting your search or filters.'
              : 'Check back soon for new deals!'
          }
          action={
            searchQuery || category
              ? {
                  label: 'Clear filters',
                  onClick: () => {
                    setSearchQuery('')
                    setCategory('')
                    setStoreFilter('')
                  },
                }
              : undefined
          }
        />
      ) : (
        <>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Showing {deals.length} deals
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {deals.map((deal) => (
              <DealCard
                key={deal.id}
                deal={deal}
                isOnWatchList={isOnWatchList(deal.item_name)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

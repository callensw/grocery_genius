'use client'

import { useState, useEffect, useCallback } from 'react'
import { Eye, Plus, Trash2, Tag, Bell } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { DealCard } from '@/components/DealCard'
import { EmptyState } from '@/components/EmptyState'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { usePreferences } from '@/hooks/usePreferences'
import { CATEGORIES } from '@/lib/constants'
import type { DealWithStore } from '@/types/database'

export default function WatchlistPage() {
  const { selectedStores, watchList, addToWatchList, removeFromWatchList } = usePreferences()

  const [matchingDeals, setMatchingDeals] = useState<Record<string, DealWithStore[]>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newKeyword, setNewKeyword] = useState('')
  const [newCategory, setNewCategory] = useState('')

  const supabase = createClient()

  const fetchMatchingDeals = useCallback(async () => {
    if (watchList.length === 0) {
      setMatchingDeals({})
      setIsLoading(false)
      return
    }

    setIsLoading(true)

    // Get store UUIDs for selected stores
    const { data: stores } = await supabase
      .from('gg_stores')
      .select('id, slug')
      .in('slug', selectedStores)

    const storeData = stores as { id: string; slug: string }[] | null

    if (!storeData || storeData.length === 0) {
      setMatchingDeals({})
      setIsLoading(false)
      return
    }

    const storeIds = storeData.map((s) => s.id)
    const matches: Record<string, DealWithStore[]> = {}

    // Fetch deals for each watchlist item
    for (const item of watchList) {
      let query = supabase
        .from('gg_deals')
        .select('*, gg_stores(*)')
        .in('store_id', storeIds)
        .gte('valid_to', new Date().toISOString().split('T')[0])
        .ilike('item_name', `%${item.keyword}%`)
        .order('price_numeric', { ascending: true, nullsFirst: false })
        .limit(10)

      if (item.category) {
        query = query.eq('category', item.category)
      }

      const { data } = await query

      if (data && data.length > 0) {
        matches[item.id] = data as DealWithStore[]
      }
    }

    setMatchingDeals(matches)
    setIsLoading(false)
  }, [supabase, selectedStores, watchList])

  useEffect(() => {
    if (selectedStores.length > 0) {
      fetchMatchingDeals()
    } else {
      setIsLoading(false)
    }
  }, [selectedStores, fetchMatchingDeals])

  const handleAddItem = () => {
    if (!newKeyword.trim()) return

    addToWatchList(newKeyword.trim(), newCategory || undefined)
    setNewKeyword('')
    setNewCategory('')
    setShowAddForm(false)
  }

  const onSaleCount = Object.keys(matchingDeals).length
  const totalMatchingDeals = Object.values(matchingDeals).flat().length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
            Watch List
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400">
            Track items you regularly buy and get notified when they go on sale
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700"
        >
          <Plus className="h-4 w-4" />
          Add Item
        </button>
      </div>

      {/* Summary */}
      {watchList.length > 0 && (
        <div className="flex gap-4">
          <div className="flex items-center gap-2 rounded-lg bg-green-100 px-4 py-2 dark:bg-green-900/30">
            <Bell className="h-4 w-4 text-green-600 dark:text-green-400" />
            <span className="text-sm font-medium text-green-700 dark:text-green-400">
              {onSaleCount} of {watchList.length} items on sale
            </span>
          </div>
          {totalMatchingDeals > 0 && (
            <div className="flex items-center gap-2 rounded-lg bg-neutral-100 px-4 py-2 dark:bg-neutral-800">
              <Tag className="h-4 w-4 text-neutral-600 dark:text-neutral-400" />
              <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                {totalMatchingDeals} matching deals
              </span>
            </div>
          )}
        </div>
      )}

      {/* Add Item Form */}
      {showAddForm && (
        <div className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
          <h3 className="mb-4 font-medium text-neutral-900 dark:text-white">
            Add to Watch List
          </h3>
          <div className="flex flex-col gap-4 sm:flex-row">
            <input
              type="text"
              value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
              placeholder="Item name (e.g., chicken breast, avocados)"
              className="flex-1 rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm outline-none transition-colors focus:border-green-500 focus:ring-2 focus:ring-green-500/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
              onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
            />
            <select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              className="rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm outline-none transition-colors focus:border-green-500 focus:ring-2 focus:ring-green-500/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
            >
              <option value="">Any category</option>
              {CATEGORIES.filter((c) => c.value).map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
            <div className="flex gap-2">
              <button
                onClick={handleAddItem}
                disabled={!newKeyword.trim()}
                className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-50"
              >
                Add
              </button>
              <button
                onClick={() => {
                  setShowAddForm(false)
                  setNewKeyword('')
                  setNewCategory('')
                }}
                className="rounded-lg border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Watch List Items */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : watchList.length === 0 ? (
        <EmptyState
          icon={Eye}
          title="Your watch list is empty"
          description="Add items you want to track and we'll alert you when they go on sale."
          action={{
            label: 'Add First Item',
            onClick: () => setShowAddForm(true),
          }}
        />
      ) : (
        <div className="space-y-6">
          {watchList.map((item) => {
            const deals = matchingDeals[item.id] || []
            const isOnSale = deals.length > 0

            return (
              <div
                key={item.id}
                className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900"
              >
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <h3 className="font-medium text-neutral-900 dark:text-white">
                      {item.keyword}
                    </h3>
                    {item.category && (
                      <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
                        {item.category}
                      </span>
                    )}
                    {isOnSale && (
                      <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                        On Sale!
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => removeFromWatchList(item.id)}
                    className="rounded-lg p-2 text-neutral-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
                    title="Remove from watch list"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                {isOnSale ? (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {deals.map((deal) => (
                      <DealCard key={deal.id} deal={deal} isOnWatchList />
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">
                    No matching deals this week. We&apos;ll keep watching!
                  </p>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

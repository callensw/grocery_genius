'use client'

import { useState } from 'react'
import { Check, Search } from 'lucide-react'
import { PRIORITY_STORES } from '@/lib/constants'

interface StoreSelectorProps {
  selectedStores: string[]
  onToggle: (slug: string) => void
}

export function StoreSelector({ selectedStores, onToggle }: StoreSelectorProps) {
  const [search, setSearch] = useState('')

  const filteredStores = PRIORITY_STORES.filter((store) =>
    store.name.toLowerCase().includes(search.toLowerCase())
  )

  const selectedCount = selectedStores.length

  const handleSelectAll = () => {
    if (selectedCount === PRIORITY_STORES.length) {
      // Deselect all
      selectedStores.forEach((slug) => onToggle(slug))
    } else {
      // Select all filtered
      filteredStores.forEach((store) => {
        if (!selectedStores.includes(store.slug)) {
          onToggle(store.slug)
        }
      })
    }
  }

  return (
    <div className="space-y-3">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search stores..."
          className="w-full rounded-lg border border-neutral-200 bg-neutral-50 py-2 pl-10 pr-4 text-sm outline-none transition-colors placeholder:text-neutral-400 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white dark:placeholder:text-neutral-500"
        />
      </div>

      {/* Select all / count */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-neutral-500 dark:text-neutral-400">
          {selectedCount} store{selectedCount !== 1 ? 's' : ''} selected
        </span>
        <button
          onClick={handleSelectAll}
          className="font-medium text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
        >
          {selectedCount === PRIORITY_STORES.length ? 'Deselect All' : 'Select All'}
        </button>
      </div>

      {/* Store Grid - Scrollable */}
      <div className="max-h-64 overflow-y-auto rounded-lg border border-neutral-200 dark:border-neutral-700">
        <div className="grid grid-cols-2 gap-2 p-2">
          {filteredStores.map((store) => {
            const isSelected = selectedStores.includes(store.slug)
            return (
              <button
                key={store.slug}
                onClick={() => onToggle(store.slug)}
                className={`relative flex items-center justify-center rounded-lg border px-3 py-2.5 text-center text-sm font-medium transition-all ${
                  isSelected
                    ? 'border-green-500 bg-green-50 text-green-700 dark:border-green-400 dark:bg-green-900/20 dark:text-green-400'
                    : 'border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:border-neutral-600'
                }`}
              >
                {isSelected && (
                  <Check className="absolute right-1.5 top-1.5 h-3.5 w-3.5 text-green-500 dark:text-green-400" />
                )}
                <span className="truncate">{store.name}</span>
              </button>
            )
          })}
        </div>
      </div>

      {filteredStores.length === 0 && (
        <p className="py-4 text-center text-sm text-neutral-500 dark:text-neutral-400">
          No stores found matching "{search}"
        </p>
      )}
    </div>
  )
}

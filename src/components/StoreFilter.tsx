'use client'

import { PRIORITY_STORES } from '@/lib/constants'

interface StoreFilterProps {
  selectedStores: string[]
  activeFilter: string
  onFilterChange: (storeSlug: string) => void
}

export function StoreFilter({
  selectedStores,
  activeFilter,
  onFilterChange,
}: StoreFilterProps) {
  const availableStores = PRIORITY_STORES.filter((store) =>
    selectedStores.includes(store.slug)
  )

  if (availableStores.length <= 1) {
    return null
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => onFilterChange('')}
        className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
          activeFilter === ''
            ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
            : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700'
        }`}
      >
        All Stores
      </button>
      {availableStores.map((store) => (
        <button
          key={store.slug}
          onClick={() => onFilterChange(store.slug)}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
            activeFilter === store.slug
              ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
              : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700'
          }`}
        >
          {store.name}
        </button>
      ))}
    </div>
  )
}

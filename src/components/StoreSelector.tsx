'use client'

import { Check } from 'lucide-react'
import { PRIORITY_STORES } from '@/lib/constants'

interface StoreSelectorProps {
  selectedStores: string[]
  onToggle: (slug: string) => void
}

export function StoreSelector({ selectedStores, onToggle }: StoreSelectorProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {PRIORITY_STORES.map((store) => {
        const isSelected = selectedStores.includes(store.slug)
        return (
          <button
            key={store.slug}
            onClick={() => onToggle(store.slug)}
            className={`relative flex items-center justify-center rounded-xl border-2 p-4 text-center font-medium transition-all ${
              isSelected
                ? 'border-green-500 bg-green-50 text-green-700 dark:border-green-400 dark:bg-green-900/20 dark:text-green-400'
                : 'border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:border-neutral-600'
            }`}
          >
            {isSelected && (
              <span className="absolute right-2 top-2">
                <Check className="h-4 w-4 text-green-500 dark:text-green-400" />
              </span>
            )}
            <span>{store.name}</span>
          </button>
        )
      })}
    </div>
  )
}

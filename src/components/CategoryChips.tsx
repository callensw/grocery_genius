'use client'

import { CATEGORIES } from '@/lib/constants'

interface CategoryChipsProps {
  selected: string
  onSelect: (category: string) => void
}

export function CategoryChips({ selected, onSelect }: CategoryChipsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {CATEGORIES.map((category) => {
        const isSelected = selected === category.value
        return (
          <button
            key={category.value}
            onClick={() => onSelect(category.value)}
            className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
              isSelected
                ? 'bg-green-600 text-white'
                : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700'
            }`}
          >
            {category.label}
          </button>
        )
      })}
    </div>
  )
}

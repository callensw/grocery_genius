'use client'

import { Search, Sparkles, X } from 'lucide-react'
import { useState, useEffect } from 'react'

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  onAiSearch?: (query: string) => void
  placeholder?: string
  isLoading?: boolean
}

export function SearchBar({
  value,
  onChange,
  onAiSearch,
  placeholder = 'Search deals...',
  isLoading,
}: SearchBarProps) {
  const [localValue, setLocalValue] = useState(value)

  // Debounce the search input
  useEffect(() => {
    const timer = setTimeout(() => {
      onChange(localValue)
    }, 300)

    return () => clearTimeout(timer)
  }, [localValue, onChange])

  // Sync external value changes
  useEffect(() => {
    setLocalValue(value)
  }, [value])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && onAiSearch && localValue.trim()) {
      onAiSearch(localValue.trim())
    }
  }

  return (
    <div className="relative flex gap-2">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
        <input
          type="text"
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full rounded-lg border border-neutral-200 bg-white py-2.5 pl-10 pr-10 text-sm outline-none transition-colors placeholder:text-neutral-400 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white dark:placeholder:text-neutral-500 dark:focus:border-green-400"
        />
        {localValue && (
          <button
            onClick={() => setLocalValue('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {onAiSearch && (
        <button
          onClick={() => localValue.trim() && onAiSearch(localValue.trim())}
          disabled={!localValue.trim() || isLoading}
          className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          <Sparkles className="h-4 w-4" />
          <span className="hidden sm:inline">AI Search</span>
        </button>
      )}
    </div>
  )
}

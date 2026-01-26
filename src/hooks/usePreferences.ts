'use client'

import { useLocalStorage } from './useLocalStorage'
import { STORAGE_KEYS } from '@/lib/constants'

export interface WatchListItem {
  id: string
  keyword: string
  category?: string
  createdAt: string
}

export function usePreferences() {
  const [zipCode, setZipCode, zipLoaded] = useLocalStorage<string>(
    STORAGE_KEYS.ZIP_CODE,
    ''
  )

  const [selectedStores, setSelectedStores, storesLoaded] = useLocalStorage<string[]>(
    STORAGE_KEYS.SELECTED_STORES,
    []
  )

  const [watchList, setWatchList, watchListLoaded] = useLocalStorage<WatchListItem[]>(
    STORAGE_KEYS.WATCH_LIST,
    []
  )

  const [onboardingComplete, setOnboardingComplete, onboardingLoaded] = useLocalStorage<boolean>(
    STORAGE_KEYS.ONBOARDING_COMPLETE,
    false
  )

  const isLoaded = zipLoaded && storesLoaded && watchListLoaded && onboardingLoaded

  const addToWatchList = (keyword: string, category?: string) => {
    const newItem: WatchListItem = {
      id: crypto.randomUUID(),
      keyword,
      category,
      createdAt: new Date().toISOString(),
    }
    setWatchList((prev) => [...prev, newItem])
  }

  const removeFromWatchList = (id: string) => {
    setWatchList((prev) => prev.filter((item) => item.id !== id))
  }

  const toggleStore = (storeSlug: string) => {
    setSelectedStores((prev) =>
      prev.includes(storeSlug)
        ? prev.filter((s) => s !== storeSlug)
        : [...prev, storeSlug]
    )
  }

  const completeOnboarding = (zip: string, stores: string[]) => {
    setZipCode(zip)
    setSelectedStores(stores)
    setOnboardingComplete(true)
  }

  return {
    zipCode,
    setZipCode,
    selectedStores,
    setSelectedStores,
    toggleStore,
    watchList,
    addToWatchList,
    removeFromWatchList,
    onboardingComplete,
    setOnboardingComplete,
    completeOnboarding,
    isLoaded,
  }
}

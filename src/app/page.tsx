'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ShoppingCart, ArrowRight, MapPin } from 'lucide-react'
import { StoreSelector } from '@/components/StoreSelector'
import { usePreferences } from '@/hooks/usePreferences'

export default function HomePage() {
  const router = useRouter()
  const { onboardingComplete, completeOnboarding, isLoaded } = usePreferences()

  const [step, setStep] = useState(1)
  const [zipCode, setZipCode] = useState('')
  const [selectedStores, setSelectedStores] = useState<string[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    if (isLoaded && onboardingComplete) {
      router.replace('/deals')
    }
  }, [isLoaded, onboardingComplete, router])

  const handleToggleStore = (slug: string) => {
    setSelectedStores((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    )
  }

  const handleZipSubmit = () => {
    if (!zipCode.match(/^\d{5}$/)) {
      setError('Please enter a valid 5-digit zip code')
      return
    }
    setError('')
    setStep(2)
  }

  const handleComplete = () => {
    if (selectedStores.length === 0) {
      setError('Please select at least one store')
      return
    }
    completeOnboarding(zipCode, selectedStores)
    router.push('/deals')
  }

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-200 border-t-green-600" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-green-50 to-white p-4 dark:from-neutral-900 dark:to-neutral-950">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex items-center justify-center rounded-2xl bg-green-100 p-4 dark:bg-green-900/30">
            <ShoppingCart className="h-12 w-12 text-green-600 dark:text-green-400" />
          </div>
          <h1 className="mb-2 text-3xl font-bold text-neutral-900 dark:text-white">
            GroceryGenius
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400">
            Find the best grocery deals in your area
          </p>
        </div>

        {/* Step Indicator */}
        <div className="mb-8 flex justify-center gap-2">
          <div
            className={`h-2 w-16 rounded-full transition-colors ${
              step >= 1 ? 'bg-green-500' : 'bg-neutral-200 dark:bg-neutral-700'
            }`}
          />
          <div
            className={`h-2 w-16 rounded-full transition-colors ${
              step >= 2 ? 'bg-green-500' : 'bg-neutral-200 dark:bg-neutral-700'
            }`}
          />
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-lg dark:border-neutral-800 dark:bg-neutral-900">
          {step === 1 ? (
            <>
              <div className="mb-6 text-center">
                <MapPin className="mx-auto mb-3 h-8 w-8 text-green-600 dark:text-green-400" />
                <h2 className="mb-1 text-xl font-semibold text-neutral-900 dark:text-white">
                  Enter your zip code
                </h2>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  We&apos;ll find deals at stores near you
                </p>
              </div>

              <input
                type="text"
                value={zipCode}
                onChange={(e) => setZipCode(e.target.value.replace(/\D/g, '').slice(0, 5))}
                placeholder="12345"
                className="mb-4 w-full rounded-lg border border-neutral-200 bg-neutral-50 p-4 text-center text-2xl font-medium tracking-widest outline-none transition-colors placeholder:text-neutral-300 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white dark:placeholder:text-neutral-600"
                maxLength={5}
                onKeyDown={(e) => e.key === 'Enter' && handleZipSubmit()}
              />

              {error && (
                <p className="mb-4 text-center text-sm text-red-500">{error}</p>
              )}

              <button
                onClick={handleZipSubmit}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-green-600 py-3 font-medium text-white transition-colors hover:bg-green-700"
              >
                Continue
                <ArrowRight className="h-4 w-4" />
              </button>
            </>
          ) : (
            <>
              <div className="mb-6 text-center">
                <h2 className="mb-1 text-xl font-semibold text-neutral-900 dark:text-white">
                  Select your stores
                </h2>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  Choose the stores you shop at
                </p>
              </div>

              <div className="mb-6">
                <StoreSelector
                  selectedStores={selectedStores}
                  onToggle={handleToggleStore}
                />
              </div>

              {error && (
                <p className="mb-4 text-center text-sm text-red-500">{error}</p>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 rounded-lg border border-neutral-200 py-3 font-medium text-neutral-700 transition-colors hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
                >
                  Back
                </button>
                <button
                  onClick={handleComplete}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-green-600 py-3 font-medium text-white transition-colors hover:bg-green-700"
                >
                  Get Started
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </>
          )}
        </div>

        <p className="mt-6 text-center text-sm text-neutral-500 dark:text-neutral-400">
          Your preferences are stored locally on your device
        </p>
      </div>
    </div>
  )
}

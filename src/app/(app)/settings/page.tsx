'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MapPin, Store, Trash2, Check, RefreshCw } from 'lucide-react'
import { StoreSelector } from '@/components/StoreSelector'
import { usePreferences } from '@/hooks/usePreferences'

export default function SettingsPage() {
  const router = useRouter()
  const {
    zipCode,
    setZipCode,
    selectedStores,
    toggleStore,
    setOnboardingComplete,
  } = usePreferences()

  const [editingZip, setEditingZip] = useState(false)
  const [tempZip, setTempZip] = useState(zipCode)
  const [zipError, setZipError] = useState('')
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState<{ success: boolean; message: string } | null>(null)

  const handleSaveZip = () => {
    if (!tempZip.match(/^\d{5}$/)) {
      setZipError('Please enter a valid 5-digit zip code')
      return
    }
    setZipCode(tempZip)
    setEditingZip(false)
    setZipError('')
  }

  const handleReset = () => {
    localStorage.clear()
    setOnboardingComplete(false)
    router.push('/')
  }

  const handleSync = async () => {
    setSyncing(true)
    setSyncResult(null)
    try {
      const response = await fetch(`/api/scraper?zip=${zipCode}`)
      const data = await response.json()
      if (response.ok) {
        setSyncResult({ success: true, message: `Synced ${data.count} deals for zip code ${zipCode}` })
      } else {
        setSyncResult({ success: false, message: data.error || 'Failed to sync deals' })
      }
    } catch {
      setSyncResult({ success: false, message: 'Failed to connect to server' })
    } finally {
      setSyncing(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
          Settings
        </h1>
        <p className="text-neutral-500 dark:text-neutral-400">
          Manage your preferences and store selections
        </p>
      </div>

      {/* Zip Code */}
      <section className="rounded-xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
        <div className="mb-4 flex items-center gap-3">
          <div className="rounded-lg bg-green-100 p-2 dark:bg-green-900/30">
            <MapPin className="h-5 w-5 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h2 className="font-semibold text-neutral-900 dark:text-white">
              Location
            </h2>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              Your zip code for finding local deals
            </p>
          </div>
        </div>

        {editingZip ? (
          <div className="flex gap-3">
            <input
              type="text"
              value={tempZip}
              onChange={(e) => setTempZip(e.target.value.replace(/\D/g, '').slice(0, 5))}
              placeholder="12345"
              maxLength={5}
              className="w-32 rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-2 text-center font-medium tracking-widest outline-none transition-colors focus:border-green-500 focus:ring-2 focus:ring-green-500/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
              onKeyDown={(e) => e.key === 'Enter' && handleSaveZip()}
            />
            <button
              onClick={handleSaveZip}
              className="flex items-center gap-1.5 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700"
            >
              <Check className="h-4 w-4" />
              Save
            </button>
            <button
              onClick={() => {
                setEditingZip(false)
                setTempZip(zipCode)
                setZipError('')
              }}
              className="rounded-lg border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
            >
              Cancel
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <span className="rounded-lg bg-neutral-100 px-4 py-2 font-mono text-lg font-medium text-neutral-900 dark:bg-neutral-800 dark:text-white">
              {zipCode}
            </span>
            <button
              onClick={() => {
                setTempZip(zipCode)
                setEditingZip(true)
              }}
              className="text-sm font-medium text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
            >
              Change
            </button>
          </div>
        )}

        {zipError && (
          <p className="mt-2 text-sm text-red-500">{zipError}</p>
        )}

        <div className="mt-4 border-t border-neutral-200 pt-4 dark:border-neutral-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-900 dark:text-white">
                Sync Deals
              </p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Fetch latest deals for your zip code
              </p>
            </div>
            <button
              onClick={handleSync}
              disabled={syncing}
              className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Syncing...' : 'Sync Now'}
            </button>
          </div>
          {syncResult && (
            <p className={`mt-2 text-sm ${syncResult.success ? 'text-green-600 dark:text-green-400' : 'text-red-500'}`}>
              {syncResult.message}
            </p>
          )}
        </div>
      </section>

      {/* Store Selection */}
      <section className="rounded-xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
        <div className="mb-4 flex items-center gap-3">
          <div className="rounded-lg bg-green-100 p-2 dark:bg-green-900/30">
            <Store className="h-5 w-5 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h2 className="font-semibold text-neutral-900 dark:text-white">
              My Stores
            </h2>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              Select the stores you shop at ({selectedStores.length} selected)
            </p>
          </div>
        </div>

        <StoreSelector selectedStores={selectedStores} onToggle={toggleStore} />

        {selectedStores.length === 0 && (
          <p className="mt-4 text-sm text-amber-600 dark:text-amber-400">
            Please select at least one store to see deals
          </p>
        )}
      </section>

      {/* Reset */}
      <section className="rounded-xl border border-red-200 bg-red-50 p-6 dark:border-red-900/50 dark:bg-red-900/10">
        <div className="mb-4 flex items-center gap-3">
          <div className="rounded-lg bg-red-100 p-2 dark:bg-red-900/30">
            <Trash2 className="h-5 w-5 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <h2 className="font-semibold text-red-900 dark:text-red-100">
              Reset All Data
            </h2>
            <p className="text-sm text-red-700 dark:text-red-300">
              Clear all your preferences and start fresh
            </p>
          </div>
        </div>

        {showResetConfirm ? (
          <div className="flex gap-3">
            <button
              onClick={handleReset}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
            >
              Yes, Reset Everything
            </button>
            <button
              onClick={() => setShowResetConfirm(false)}
              className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-100 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-900/30"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowResetConfirm(true)}
            className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-100 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-900/30"
          >
            Reset All Data
          </button>
        )}
      </section>
    </div>
  )
}

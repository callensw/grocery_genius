'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Store, ExternalLink } from 'lucide-react'
import type { DealWithStore } from '@/types/database'

interface DealCardProps {
  deal: DealWithStore
  isOnWatchList?: boolean
}

interface RawData {
  image_url?: string
  description?: string
  flyer_id?: number
  item_id?: number
  merchant?: string
  original_price?: string | number
  sale_story?: string
  savings?: string | number
  percent_off?: string | number
}

export function DealCard({ deal, isOnWatchList }: DealCardProps) {
  const [imgError, setImgError] = useState(false)

  const validTo = deal.valid_to ? new Date(deal.valid_to) : null
  const daysLeft = validTo
    ? Math.ceil((validTo.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null

  const rawData = deal.raw_data as RawData | null
  const imageUrl = rawData?.image_url
  const description = rawData?.description
  const flyerId = rawData?.flyer_id
  const itemId = rawData?.item_id
  const originalPrice = rawData?.original_price
  const saleStory = rawData?.sale_story
  const savings = rawData?.savings
  const percentOff = rawData?.percent_off

  // Link to Flipp to view the actual deal
  const dealUrl = itemId
    ? `https://flipp.com/item/${itemId}`
    : flyerId
      ? `https://flipp.com/flyer/${flyerId}`
      : deal.gg_stores?.website

  // Format savings display
  const savingsDisplay = percentOff
    ? `${percentOff}% off`
    : savings
      ? typeof savings === 'number'
        ? `Save $${savings.toFixed(2)}`
        : `Save ${savings}`
      : saleStory || null

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm transition-shadow hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900">
      {isOnWatchList && (
        <span className="absolute right-2 top-2 z-10 rounded-full bg-green-500 px-2 py-0.5 text-xs font-medium text-white shadow">
          On Sale!
        </span>
      )}

      {/* Image */}
      <div className="relative h-40 w-full bg-neutral-100 dark:bg-neutral-800">
        {imageUrl && !imgError ? (
          <Image
            src={imageUrl}
            alt={deal.item_name}
            fill
            className="object-contain p-2"
            onError={() => setImgError(true)}
            unoptimized
          />
        ) : (
          <div className="flex h-full items-center justify-center text-neutral-400">
            <Store className="h-12 w-12" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-4">
        <div className="mb-2 flex items-start justify-between gap-2">
          <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
            {deal.gg_stores?.name || 'Unknown Store'}
          </span>
          {deal.category && deal.category !== 'other' && (
            <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
              {deal.category}
            </span>
          )}
        </div>

        <h3 className="mb-1 line-clamp-2 flex-1 text-sm font-medium text-neutral-900 dark:text-neutral-100">
          {deal.item_name}
        </h3>

        {description && (
          <p className="mb-2 line-clamp-1 text-xs text-neutral-500 dark:text-neutral-400">
            {description}
          </p>
        )}

        <div className="mt-auto flex items-end justify-between pt-2">
          <div>
            <div className="flex items-baseline gap-2">
              {deal.price ? (
                <p className="text-lg font-bold text-green-600 dark:text-green-400">
                  {deal.price}
                </p>
              ) : deal.price_numeric ? (
                <p className="text-lg font-bold text-green-600 dark:text-green-400">
                  ${deal.price_numeric.toFixed(2)}
                </p>
              ) : null}
              {originalPrice && (
                <p className="text-sm text-neutral-400 line-through dark:text-neutral-500">
                  ${typeof originalPrice === 'number' ? originalPrice.toFixed(2) : originalPrice}
                </p>
              )}
            </div>
            {savingsDisplay && (
              <p className="text-xs font-medium text-orange-600 dark:text-orange-400">
                {savingsDisplay}
              </p>
            )}
            {deal.unit_price && (
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                {deal.unit_price}
              </p>
            )}
          </div>

          {daysLeft !== null && (
            <p
              className={`text-xs ${
                daysLeft <= 2
                  ? 'font-medium text-red-500'
                  : 'text-neutral-500 dark:text-neutral-400'
              }`}
            >
              {daysLeft <= 0
                ? 'Ends today'
                : daysLeft === 1
                  ? '1 day left'
                  : `${daysLeft} days left`}
            </p>
          )}
        </div>

        {dealUrl && (
          <a
            href={dealUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 flex items-center justify-center gap-1.5 rounded-lg border border-neutral-200 py-2 text-xs font-medium text-neutral-700 transition-colors hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            View Deal
          </a>
        )}
      </div>
    </div>
  )
}

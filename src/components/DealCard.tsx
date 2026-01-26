import { Store, Tag } from 'lucide-react'
import type { DealWithStore } from '@/types/database'

interface DealCardProps {
  deal: DealWithStore
  isOnWatchList?: boolean
}

export function DealCard({ deal, isOnWatchList }: DealCardProps) {
  const validTo = deal.valid_to ? new Date(deal.valid_to) : null
  const daysLeft = validTo
    ? Math.ceil((validTo.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null

  return (
    <div className="group relative flex flex-col rounded-xl border border-neutral-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900">
      {isOnWatchList && (
        <span className="absolute -right-2 -top-2 rounded-full bg-green-500 px-2 py-0.5 text-xs font-medium text-white">
          On Sale!
        </span>
      )}

      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400">
          <Store className="h-4 w-4" />
          <span>{deal.stores?.name || 'Unknown Store'}</span>
        </div>
        {deal.category && (
          <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
            {deal.category}
          </span>
        )}
      </div>

      <h3 className="mb-2 flex-1 font-medium text-neutral-900 dark:text-neutral-100">
        {deal.item_name}
      </h3>

      <div className="flex items-end justify-between">
        <div>
          {deal.price && (
            <p className="text-xl font-bold text-green-600 dark:text-green-400">
              {deal.price}
            </p>
          )}
          {deal.unit_price && (
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              {deal.unit_price}
            </p>
          )}
        </div>

        {daysLeft !== null && (
          <p
            className={`text-sm ${
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
    </div>
  )
}

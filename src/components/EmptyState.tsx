import { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
  }
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 rounded-full bg-neutral-100 p-4 dark:bg-neutral-800">
        <Icon className="h-8 w-8 text-neutral-400" />
      </div>
      <h3 className="mb-2 text-lg font-medium text-neutral-900 dark:text-neutral-100">
        {title}
      </h3>
      <p className="mb-6 max-w-sm text-neutral-500 dark:text-neutral-400">
        {description}
      </p>
      {action && (
        <button
          onClick={action.onClick}
          className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}

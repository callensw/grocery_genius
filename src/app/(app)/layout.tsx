'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/Header'
import { usePreferences } from '@/hooks/usePreferences'

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const { onboardingComplete, isLoaded } = usePreferences()

  useEffect(() => {
    if (isLoaded && !onboardingComplete) {
      router.replace('/')
    }
  }, [isLoaded, onboardingComplete, router])

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-200 border-t-green-600" />
      </div>
    )
  }

  if (!onboardingComplete) {
    return null
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <Header />
      <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
    </div>
  )
}

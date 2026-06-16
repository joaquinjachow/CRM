'use client'

import type { ReactNode } from 'react'
import { Sidebar } from '@/components/sidebar'

interface PageShellProps {
  children?: ReactNode
}

export function PageShell({ children }: PageShellProps) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="lg:pl-64">
        <div className="p-4 pt-16 lg:p-8 lg:pt-8">{children}</div>
      </main>
    </div>
  )
}

import Image from 'next/image'
import type { ReactNode } from 'react'

interface AuthPageProps {
  title: string
  description: string
  children: ReactNode
}

export function AuthPage({ title, description, children }: AuthPageProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
      <section className="w-full max-w-md rounded-2xl border border-border/70 bg-card p-6 shadow-xl sm:p-8">
        <div className="mb-7 flex flex-col items-center text-center">
          <div className="rounded-xl bg-sidebar px-5 py-3 shadow-sm">
            <Image src="/logo.png" alt="Tajamar Molduras" width={180} height={52} className="h-12 w-auto" priority />
          </div>
          <h1 className="mt-6 text-2xl font-bold text-foreground">{title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        </div>
        {children}
      </section>
    </main>
  )
}

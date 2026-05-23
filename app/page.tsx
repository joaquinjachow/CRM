import { Sidebar } from '@/components/sidebar'
import { StatsCards } from '@/components/stats-cards'
import { RecentActivity } from '@/components/recent-activity'
import { TopClients } from '@/components/top-clients'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      
      <main className="lg:pl-64">
        <div className="p-4 pt-16 lg:p-8 lg:pt-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-foreground lg:text-3xl">
              Bienvenido, Cliente
            </h1>
            <p className="mt-1 text-muted-foreground">
              Este es tu panel de control. Aquí puedes ver el resumen de tu actividad.
            </p>
          </div>

          {/* Stats */}
          <div className="mb-8">
            <StatsCards />
          </div>

          {/* Two columns */}
          <div className="grid gap-6 lg:grid-cols-2">
            <TopClients />
            <RecentActivity />
          </div>
        </div>
      </main>
    </div>
  )
}

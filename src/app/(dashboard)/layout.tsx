import { Sidebar } from '@/components/layout/Sidebar'
import { Topbar } from '@/components/layout/Topbar'
import { ErrorBoundary } from '@/components/ui/error-boundary'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-6">
          <ErrorBoundary fallbackTitle="Erro no carregamento">
            {children}
          </ErrorBoundary>
        </main>
      </div>
    </div>
  )
}

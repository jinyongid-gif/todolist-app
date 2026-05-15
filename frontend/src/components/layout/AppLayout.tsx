import Header from './Header'

interface AppLayoutProps {
  children: React.ReactNode
}

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-neutral-900">
      <Header />
      <main className="pt-6 pb-10 px-4 md:px-6">
        {children}
      </main>
    </div>
  )
}

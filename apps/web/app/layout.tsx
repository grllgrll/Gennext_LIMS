import React from 'react'
import '../styles/globals.css'
import { Header } from '@/components/header'
import { ToastProvider } from '@/components/ui'
import { ErrorBoundary } from '@/components/error-boundary'
import { SettingsProvider } from '@/contexts/settings-context'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full bg-slate-50 dark:bg-slate-950">
        <ErrorBoundary>
          <SettingsProvider>
            <ToastProvider>
              <div className="min-h-full">
                <Header />
                <main 
                  id="main-content" 
                  className="py-6"
                  role="main"
                  aria-label="Main content area"
                >
                  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {children}
                  </div>
                </main>
              </div>
            </ToastProvider>
          </SettingsProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}

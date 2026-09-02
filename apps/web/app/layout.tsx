import { Toaster } from '@workspace/ui/components/toast'
import { cn } from '@workspace/ui/lib/utils'
import type { Metadata } from 'next'
import { Geist_Mono, Inter } from 'next/font/google'
import '@workspace/ui/globals.css'

import { AppShell } from '@/components/app-shell'
import { QueryProvider } from '@/components/query-provider'
import { ThemeProvider } from '@/components/theme-provider'

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' })

const fontMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
})

export const metadata: Metadata = {
  title: {
    default: 'Exchange',
    template: '%s · Exchange',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn('font-sans antialiased', fontMono.variable, inter.variable)}
    >
      <body>
        <ThemeProvider>
          <Toaster>
            <QueryProvider>
              <AppShell>{children}</AppShell>
            </QueryProvider>
          </Toaster>
        </ThemeProvider>
      </body>
    </html>
  )
}

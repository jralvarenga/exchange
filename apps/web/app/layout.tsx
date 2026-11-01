import { Toaster } from '@workspace/ui/components/toast'
import { cn } from '@workspace/ui/lib/utils'
import type { Metadata } from 'next'
import { Geist_Mono, Inter, Geist } from 'next/font/google'
import '@workspace/ui/globals.css'

import { QueryProvider } from '@/components/query-provider'
import { ThemeProvider } from '@/components/theme-provider'

const geist = Geist({subsets:['latin'],variable:'--font-sans'})

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
      className={cn('font-sans antialiased', fontMono.variable, "font-sans", geist.variable)}
    >
      <body>
        <ThemeProvider>
          <Toaster>
            <QueryProvider>{children}</QueryProvider>
          </Toaster>
        </ThemeProvider>
      </body>
    </html>
  )
}

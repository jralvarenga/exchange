import { Toaster } from '@workspace/ui/components/toast'
import { cn } from '@workspace/ui/lib/utils'
import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import '@workspace/ui/globals.css'

import { QueryProvider } from '@/components/query-provider'
import { ThemeProvider } from '@/components/theme-provider'
import { getAppUrl, siteMeta } from '@/lib/site'

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' })

const fontMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
})

// Icons, the manifest and the Open Graph and Twitter images come from the
// file conventions in this folder: icon.svg, apple-icon.png, favicon.ico,
// manifest.ts, opengraph-image.png and twitter-image.png.
export const metadata: Metadata = {
  appleWebApp: {
    statusBarStyle: 'black-translucent',
    title: siteMeta.name,
  },
  applicationName: siteMeta.name,
  description: siteMeta.description,
  formatDetection: {
    address: false,
    email: false,
    telephone: false,
  },
  metadataBase: getAppUrl(),
  openGraph: {
    description: siteMeta.description,
    locale: 'en_US',
    siteName: siteMeta.name,
    title: siteMeta.name,
    type: 'website',
  },
  // The app sits behind sign-in. Only the login and sign-up pages opt back in.
  robots: {
    follow: false,
    index: false,
  },
  title: {
    default: siteMeta.name,
    template: `%s · ${siteMeta.name}`,
  },
  twitter: {
    card: 'summary_large_image',
    description: siteMeta.description,
    title: siteMeta.name,
  },
}

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: [
    {
      color: siteMeta.themeColor.light,
      media: '(prefers-color-scheme: light)',
    },
    { color: siteMeta.themeColor.dark, media: '(prefers-color-scheme: dark)' },
  ],
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
      className={cn(
        // Focused fields scroll clear of the mobile tab bar. Account sections
        // keep their own scroll-mt so hash jumps do not stack with this.
        'scroll-pb-32 font-sans antialiased md:scroll-pb-8',
        fontMono.variable,
        'font-sans',
        geist.variable
      )}
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

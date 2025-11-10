import type React from "react"
import type { Metadata } from "next"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"
import { ThemeProvider } from "@/components/theme-provider"
import { WarningAcknowledgmentDialog } from "@/components/warning-acknowledgment-dialog"

import { Inter, Geist_Mono as V0_Font_Geist_Mono } from 'next/font/google'

// Initialize fonts
const _geistMono = V0_Font_Geist_Mono({ subsets: ['latin'], weight: ["100","200","300","400","500","600","700","800","900"] })

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
})

export const metadata: Metadata = {
  title: {
    default: "Peeak - Social",
    template: "%s | Peeak",
  },
  description: "Share the Peeak moments of life",
  keywords: ["social media", "social network", "connect", "share", "community", "beta", "founder badge"],
  authors: [{ name: "Peeak" }],
  creator: "Peeak",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://peeak.com",
    title: "Peeak - Social",
    description: "Share the Peeak moments of life",
    siteName: "Peeak",
    images: [
      {
        url: "/placeholder.svg?height=630&width=1200",
        width: 1200,
        height: 630,
        alt: "Peeak Social Media Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Peeak - Social",
    description: "Share the Peeak moments of life",
    images: ["/placeholder.svg?height=630&width=1200"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      {
        url: "/favicon-light.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/favicon-dark.png",
        media: "(prefers-color-scheme: dark)",
      },
    ],
    apple: "/apple-icon.png",
  },
  manifest: "/site.webmanifest",
    generator: 'v0.app'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
          <Toaster />
          <WarningAcknowledgmentDialog />
        </ThemeProvider>
      </body>
    </html>
  )
}

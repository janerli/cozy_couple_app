import type { Metadata, Viewport } from "next"
import { Nunito, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { ThemeProvider } from "@/components/theme-provider"
import { AppProvider } from "@/lib/app-context"
import { Header } from "@/components/header"
import { TogetherWidget } from "@/components/together-widget"  // 🔥 ИМПОРТ
import "./globals.css"

const nunito = Nunito({ 
  subsets: ["latin", "cyrillic"],
  variable: "--font-sans",
})

const geistMono = Geist_Mono({ 
  subsets: ["latin"],
  variable: "--font-mono",
})

export const metadata: Metadata = {
  title: "Бувик и котенок",
  description: "Отслеживайте фильмы, сериалы и желания вместе с любимым человеком",
  generator: "v0.app",
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fce7f3" },
    { media: "(prefers-color-scheme: dark)", color: "#3b0764" },
  ],
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ru" className="bg-background" suppressHydrationWarning>
      <body className={`${nunito.variable} ${geistMono.variable} font-sans antialiased min-h-screen`}>
        <ThemeProvider defaultTheme="cozy" storageKey="cozy-theme">
          <AppProvider>
            <Header />
            

            <main className="container mx-auto px-4 py-6">
              {children}
            </main>
          </AppProvider>
        </ThemeProvider>
        {process.env.NODE_ENV === "production" && <Analytics />}
      </body>
    </html>
  )
}
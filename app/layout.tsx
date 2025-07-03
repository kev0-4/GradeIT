import type React from "react"
import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "next-themes"
import { AuthProvider } from "./contexts/auth-context"
import { Toaster } from "sonner"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "GradeIT - Academic Progress Tracker",
  description: "Track your academic progress with attendance and marks management",
  keywords: ["academic", "attendance", "marks", "GPA", "student", "education", "tracker"],
  authors: [{ name: "Kevin Tandon" }],
  creator: "Kevin Tandon",
  publisher: "Kevin Tandon",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icon-192.png", sizes: "192x192", type: "image/png" }],
    shortcut: "/icon-192.png",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "GradeIT",
  },
  openGraph: {
    type: "website",
    siteName: "GradeIT",
    title: "GradeIT - Academic Progress Tracker",
    description: "Track your academic progress with attendance and marks management",
    images: [
      {
        url: "/icon-512.png",
        width: 512,
        height: 512,
        alt: "GradeIT Logo",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "GradeIT - Academic Progress Tracker",
    description: "Track your academic progress with attendance and marks management",
    images: ["/icon-512.png"],
  },
    generator: 'v0.dev'
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#0284c7" },
    { media: "(prefers-color-scheme: dark)", color: "#8000FF" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
          rel="stylesheet"
        />
        {/* PWA Meta Tags */}
        <meta name="application-name" content="GradeIT" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="GradeIT" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        <meta name="msapplication-TileColor" content="#8000FF" />
        <meta name="msapplication-tap-highlight" content="no" />

        {/* Apple Touch Icons */}
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icon-192.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icon-192.png" />
        <link rel="apple-touch-icon" sizes="167x167" href="/icon-192.png" />

        {/* Splash Screens for iOS */}
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link
          rel="apple-touch-startup-image"
          href="/icon-512.png"
          media="(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"
        />

        {/* Microsoft Tiles */}
        <meta name="msapplication-TileImage" content="/icon-192.png" />
        <meta name="msapplication-TileColor" content="#8000FF" />

        {/* Preload critical resources */}
        <link rel="preload" href="/icon-192.png" as="image" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
          themes={["light", "dark", "amoled"]}
        >
          <AuthProvider>
            {children}
            <Toaster
              position="bottom-center"
              toastOptions={{
                className: "amoled:bg-black amoled:border-gray-800 amoled:text-neon-blue",
              }}
            />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}

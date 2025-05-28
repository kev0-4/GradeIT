import "./globals.css"
import { Inter } from "next/font/google"
import { ThemeProvider } from "next-themes"
import type React from "react"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "GradeIT",
  description: "Track your academic progress",
    generator: 'v0.dev'
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
      </head>
      <body className="min-h-screen transition-colors">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <main className="flex justify-center">{children}</main>
        </ThemeProvider>
      </body>
    </html>
  )
}

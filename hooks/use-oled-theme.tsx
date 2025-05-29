"use client"

import { useTheme } from "next-themes"
import { useEffect } from "react"

export function useOledTheme() {
  const { theme } = useTheme()

  useEffect(() => {
    const body = document.body

    // Remove all theme classes first
    body.classList.remove("light", "dark", "oled")

    // Add the current theme class
    if (theme === "oled") {
      body.classList.add("oled")
    } else if (theme === "dark") {
      body.classList.add("dark")
    } else if (theme === "light") {
      body.classList.add("light")
    }
  }, [theme])

  return { theme }
}

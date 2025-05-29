"use client"

import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Sun, Moon, Monitor, Smartphone } from "lucide-react"

export default function ThemeSelector() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div className="flex items-center bg-white dark:bg-gray-800 rounded-full p-1 shadow-sm w-10 h-10" />
  }

  const getThemeIcon = () => {
    switch (theme) {
      case "light":
        return <Sun className="h-4 w-4 text-yellow-500" />
      case "dark":
        return <Moon className="h-4 w-4 text-indigo-400" />
      case "oled":
        return <Smartphone className="h-4 w-4 text-purple-400" />
      default:
        return <Monitor className="h-4 w-4 text-gray-500" />
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="w-10 h-10 rounded-full bg-white dark:bg-gray-800 oled:bg-gray-950 border-gray-200 dark:border-gray-700 oled:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 oled:hover:bg-gray-900 transition-colors"
        >
          {getThemeIcon()}
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="bg-white dark:bg-gray-800 oled:bg-gray-950 border-gray-200 dark:border-gray-700 oled:border-gray-800"
      >
        <DropdownMenuItem
          onClick={() => setTheme("light")}
          className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 oled:hover:bg-gray-900"
        >
          <Sun className="mr-2 h-4 w-4 text-yellow-500" />
          <span>Light</span>
          {theme === "light" && <span className="ml-auto text-xs text-primary">✓</span>}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme("dark")}
          className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 oled:hover:bg-gray-900"
        >
          <Moon className="mr-2 h-4 w-4 text-indigo-400" />
          <span>Dark</span>
          {theme === "dark" && <span className="ml-auto text-xs text-primary">✓</span>}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme("oled")}
          className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 oled:hover:bg-gray-900"
        >
          <Smartphone className="mr-2 h-4 w-4 text-purple-400" />
          <span>OLED Dark</span>
          {theme === "oled" && <span className="ml-auto text-xs text-primary">✓</span>}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme("system")}
          className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 oled:hover:bg-gray-900"
        >
          <Monitor className="mr-2 h-4 w-4 text-gray-500" />
          <span>System</span>
          {theme === "system" && <span className="ml-auto text-xs text-primary">✓</span>}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

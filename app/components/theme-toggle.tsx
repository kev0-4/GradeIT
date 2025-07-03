"use client"
import { Moon, Sun, Smartphone } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

export default function ThemeToggle() {
  const { setTheme, theme } = useTheme()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="amoled:btn-secondary bg-transparent">
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 amoled:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 amoled:scale-0" />
          <Smartphone className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all amoled:rotate-0 amoled:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="amoled:bg-black amoled:border-gray-800">
        <DropdownMenuItem
          onClick={() => setTheme("light")}
          className="amoled:text-neon-purple amoled:hover:bg-gray-900"
        >
          <Sun className="mr-2 h-4 w-4" />
          Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")} className="amoled:text-neon-purple amoled:hover:bg-gray-900">
          <Moon className="mr-2 h-4 w-4" />
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme("amoled")}
          className="amoled:text-neon-purple amoled:hover:bg-gray-900"
        >
          <Smartphone className="mr-2 h-4 w-4" />
          AMOLED
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

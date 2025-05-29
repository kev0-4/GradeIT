"use client"

import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useTheme } from "@/app/contexts/theme-context"
import { Sun, Moon, Smartphone, Check } from "lucide-react"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  const themes = [
    {
      value: "light" as const,
      label: "Light",
      icon: Sun,
      description: "Light mode for bright environments",
    },
    {
      value: "dark" as const,
      label: "Dark",
      icon: Moon,
      description: "Dark mode for low-light environments",
    },
    {
      value: "amoled" as const,
      label: "AMOLED",
      icon: Smartphone,
      description: "Pure black for AMOLED displays",
    },
  ]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="w-full justify-start">
          {theme === "light" && <Sun className="h-4 w-4 mr-2" />}
          {theme === "dark" && <Moon className="h-4 w-4 mr-2" />}
          {theme === "amoled" && <Smartphone className="h-4 w-4 mr-2" />}
          {themes.find((t) => t.value === theme)?.label} Mode
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {themes.map((themeOption) => {
          const Icon = themeOption.icon
          return (
            <DropdownMenuItem
              key={themeOption.value}
              onClick={() => setTheme(themeOption.value)}
              className="flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center">
                <Icon className="h-4 w-4 mr-2" />
                <div>
                  <div className="font-medium">{themeOption.label}</div>
                  <div className="text-xs text-muted-foreground">{themeOption.description}</div>
                </div>
              </div>
              {theme === themeOption.value && <Check className="h-4 w-4 text-primary" />}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

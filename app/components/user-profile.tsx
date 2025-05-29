"use client"

import { ThemeToggle } from "@/app/components/theme-toggle"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { useEffect, useState } from "react"

interface User {
  id: string
  name: string
  email: string
  image: string
  createdAt: Date
  updatedAt: Date
  accounts: any[]
  sessions: any[]
}

export function UserProfile() {
  const { data: session, status } = useSession()
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    if (session?.user) {
      setUser(session.user as User)
    }
  }, [session])

  if (status === "loading") {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-12 w-12 rounded-full" />
        <Skeleton className="h-4 w-[250px]" />
        <Skeleton className="h-4 w-[200px]" />
      </div>
    )
  }

  if (!session?.user) {
    return (
      <div>
        <p>Not signed in</p>
      </div>
    )
  }

  return (
    <div className="grid gap-6">
      <div className="flex flex-col space-y-1">
        <div className="flex items-center gap-4">
          <Avatar className="h-12 w-12">
            <AvatarImage src={(user?.image as string) || "/placeholder.svg"} alt={user?.name} />
            <AvatarFallback>{user?.name?.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <h2 className="text-lg font-semibold">{user?.name}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">{user?.email}</p>
          </div>
        </div>
      </div>
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
          <span className="material-symbols-outlined text-sm">verified_user</span>
          Profile
        </h3>
        <div className="grid gap-2">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Make changes to your profile{" "}
            <Link href="/settings/profile" className="underline">
              here
            </Link>
            .
          </p>
        </div>
      </div>
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
          <span className="material-symbols-outlined text-sm">lock</span>
          Password
        </h3>
        <div className="grid gap-2">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Change your password{" "}
            <Link href="/settings/password" className="underline">
              here
            </Link>
            .
          </p>
        </div>
      </div>

      {/* Theme Settings */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
          <span className="material-symbols-outlined text-sm">palette</span>
          Theme
        </h3>
        <ThemeToggle />
      </div>

      <Button asChild>
        <Link href="/about">About GradeIT</Link>
      </Button>
    </div>
  )
}

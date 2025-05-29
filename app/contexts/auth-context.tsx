"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"

interface AuthContextType {
  user: any | null
  loading: boolean
  signInWithGoogle: () => Promise<void>
  signInAsDemo: (userId: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Only check for demo users - no Firebase initialization
    if (typeof window !== "undefined") {
      const demoUser = localStorage.getItem("demoUser")
      if (demoUser) {
        try {
          const parsedUser = JSON.parse(demoUser)
          setUser(parsedUser)
        } catch (error) {
          localStorage.removeItem("demoUser")
        }
      }
    }
    setLoading(false)
  }, [])

  const signInWithGoogle = async () => {
    // For now, redirect to demo instead of attempting Firebase
    throw new Error("Google Sign-In is currently unavailable. Please use the demo instead.")
  }

  const signInAsDemo = async (userId: string) => {
    try {
      const mockUser = {
        uid: userId,
        displayName: userId === "user1_btech_student_pop_v4" ? "Demo B.Tech Student" : "Demo MBA Student",
        email: userId === "user1_btech_student_pop_v4" ? "demo.btech@example.com" : "demo.mba@example.com",
        photoURL: null,
        emailVerified: true,
        isAnonymous: false,
        metadata: {
          creationTime: new Date().toISOString(),
          lastSignInTime: new Date().toISOString(),
        },
        providerData: [],
        refreshToken: "",
        tenantId: null,
      }

      localStorage.setItem("demoUser", JSON.stringify(mockUser))
      setUser(mockUser)
    } catch (error) {
      console.error("Demo login failed:", error)
      throw error
    }
  }

  const signOut = async () => {
    try {
      localStorage.removeItem("demoUser")
      setUser(null)
    } catch (error) {
      console.error("Sign out error:", error)
      throw error
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, signInAsDemo, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

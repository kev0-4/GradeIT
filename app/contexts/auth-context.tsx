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
  const [firebaseReady, setFirebaseReady] = useState(false)

  useEffect(() => {
    // Only run in browser environment
    if (typeof window === "undefined") {
      setLoading(false)
      return
    }

    // Check for demo user first (no Firebase needed)
    const demoUser = localStorage.getItem("demoUser")
    if (demoUser) {
      try {
        const parsedUser = JSON.parse(demoUser)
        setUser(parsedUser)
        setLoading(false)
        return
      } catch (error) {
        localStorage.removeItem("demoUser")
      }
    }

    // Initialize Firebase only if needed and in browser
    const initFirebase = async () => {
      try {
        // Dynamic import with error handling
        const firebaseModule = await import("../firebase").catch(() => null)

        if (!firebaseModule?.auth) {
          console.log("Firebase not available, using demo mode only")
          setLoading(false)
          return
        }

        const { auth, googleProvider } = firebaseModule
        setFirebaseReady(true)

        // Dynamic import of Firebase Auth functions
        const authFunctions = await import("firebase/auth").catch(() => null)
        if (!authFunctions) {
          setLoading(false)
          return
        }

        const { getRedirectResult, onAuthStateChanged } = authFunctions

        // Check for redirect result
        const result = await getRedirectResult(auth).catch(() => null)
        if (result?.user) {
          setUser(result.user)
          setLoading(false)
          return
        }

        // Set up auth state listener
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
          if (!localStorage.getItem("demoUser")) {
            setUser(currentUser)
          }
          setLoading(false)
        })

        return unsubscribe
      } catch (error) {
        console.log("Firebase initialization skipped:", error.message)
        setLoading(false)
      }
    }

    let unsubscribe: any
    initFirebase().then((unsub) => {
      unsubscribe = unsub
    })

    return () => {
      if (unsubscribe && typeof unsubscribe === "function") {
        unsubscribe()
      }
    }
  }, [])

  const signInWithGoogle = async () => {
    if (typeof window === "undefined") {
      throw new Error("Not in browser environment")
    }

    try {
      // Dynamic imports
      const firebaseModule = await import("../firebase")
      const authFunctions = await import("firebase/auth")

      const { auth, googleProvider } = firebaseModule
      const { signInWithRedirect } = authFunctions

      if (!auth || !googleProvider) {
        throw new Error("Firebase not initialized")
      }

      localStorage.removeItem("demoUser")
      await signInWithRedirect(auth, googleProvider)
    } catch (error) {
      console.error("Google sign-in error:", error)
      throw error
    }
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
      const demoUser = localStorage.getItem("demoUser")
      if (demoUser) {
        localStorage.removeItem("demoUser")
        setUser(null)
        return
      }

      if (firebaseReady && typeof window !== "undefined") {
        const firebaseModule = await import("../firebase")
        const authFunctions = await import("firebase/auth")

        const { auth } = firebaseModule
        const { signOut: firebaseSignOut } = authFunctions

        if (auth) {
          await firebaseSignOut(auth)
        }
      }
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

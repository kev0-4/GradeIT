// FILE: app/login/page.tsx
// Concern: Will this work with our new Capacitor configuration? (Answer: Yes, with minor tweaks for consistency and UX)

"use client"
import { useRouter } from "next/navigation"
import { useAuth } from "../contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useTheme } from "next-themes"
import { useToast } from "@/components/ui/use-toast" // Assuming you have a toast component

export default function LoginPage() {
  const { signInWithGoogle, loading } = useAuth()
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const { toast } = useToast() // For user-facing error messages

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle()
      router.push("/")
    } catch (error: any) {
      console.error("Login failed:", error)
      toast({
        title: "Sign-In Failed",
        description: error.message || "An error occurred during sign-in. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 amoled:bg-black flex items-center justify-center p-4 transition-colors duration-300">
      {/* Theme Toggle */}
      <div className="absolute top-4 right-4">
        <div className="flex items-center bg-white dark:bg-gray-800 amoled:bg-black amoled:border amoled:border-gray-800 rounded-full p-1 shadow-sm">
          <button
            className={`w-8 h-8 rounded-full flex items-center justify-center ${
              theme === "light" ? "bg-primary-100" : ""
            }`}
            onClick={() => setTheme("light")}
          >
            <span className="material-symbols-outlined text-yellow-500">light_mode</span>
          </button>
          <button
            className={`w-8 h-8 rounded-full flex items-center justify-center ${
              theme === "dark" ? "bg-primary-100" : ""
            }`}
            onClick={() => setTheme("dark")}
          >
            <span className="material-symbols-outlined text-indigo-400">dark_mode</span>
          </button>
          <button
            className={`w-8 h-8 rounded-full flex items-center justify-center ${
              theme === "amoled" ? "bg-gray-800 amoled:neon-glow" : ""
            }`}
            onClick={() => setTheme("amoled")}
          >
            <span className="material-symbols-outlined text-cyan-400 amoled:neon-text">smartphone</span>
          </button>
        </div>
      </div>

      <div className="w-full max-w-md">
        {/* Logo and Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-primary-500 to-primary-600 rounded-full mb-4">
            <span className="material-symbols-outlined text-2xl text-white">school</span>
          </div>
          <h1 className="text-3xl font-bold text-primary-600 dark:text-primary-400 amoled:text-neon-blue amoled:neon-text tracking-tight">
            GradeIT
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">Your Academic Progress Tracker</p>
        </div>

        <Card className="shadow-lg border-0 bg-white/80 dark:bg-gray-800/80 amoled:bg-black/90 amoled:border amoled:border-gray-800 amoled:neon-glow backdrop-blur-sm">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl font-semibold">Welcome Back</CardTitle>
            <CardDescription>Sign in to access your academic dashboard and track your progress</CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <Button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full h-12 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 transition-all duration-200 shadow-sm"
              variant="outline"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600 mr-2"></div>
                  Signing in...
                </div>
              ) : (
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Continue with Google
                </div>
              )}
            </Button>

            <div className="text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                By signing in, you agree to our Terms of Service and Privacy Policy
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Features Preview */}
        <div className="mt-8 grid grid-cols-2 gap-4 text-center">
          <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-3 backdrop-blur-sm">
            <span className="material-symbols-outlined text-primary-500 mb-1">event_available</span>
            <p className="text-xs font-medium">Track Attendance</p>
          </div>
          <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-3 backdrop-blur-sm">
            <span className="material-symbols-outlined text-primary-500 mb-1">grade</span>
            <p className="text-xs font-medium">Monitor Grades</p>
          </div>
        </div>
      </div>
    </div>
  )
}

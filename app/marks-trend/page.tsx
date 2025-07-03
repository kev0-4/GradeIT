"use client"

import { useState, useEffect } from "react"
import { useTheme } from "next-themes"
import Link from "next/link"

// Add imports for authentication
import ProtectedRoute from "../components/protected-route"
import UserProfile from "../components/user-profile"
import { useAuth } from "../contexts/auth-context"
import { getUserDocuments } from "../utils/user-data"
import MarksTrendChart from "../components/marks-trend-chart"

const MarksTrendPage = () => {
  const [subjectsMarks, setSubjectsMarks] = useState([])
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme } = useTheme()
  const { user } = useAuth()

  // Fetch subjects marks data
  const fetchSubjectsMarks = async () => {
    if (!user) return

    try {
      const marksData = await getUserDocuments(user, "marks")
      setSubjectsMarks(marksData)
    } catch (error) {
      console.error("Error fetching marks:", error)
    }
  }

  useEffect(() => {
    if (user) {
      fetchSubjectsMarks()
    }
    setMounted(true)
  }, [user])

  // Fallback if data isn't loaded yet
  if (!mounted) return <div className="flex items-center justify-center h-screen">Loading...</div>

  return (
    <ProtectedRoute>
      <div className="w-[400px] md:w-[768px] lg:w-[1024px] p-4 md:p-6 lg:p-8 mobile-content-spacing md:pb-8 bg-gray-50 dark:bg-gray-900 min-h-screen transition-colors duration-300">
        {/* Header */}
        <header className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <Link href="/">
              <button className="relative inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-300 hover:bg-primary-200 dark:hover:bg-primary-800 transition-colors duration-200 shadow-sm mr-3">
                <span className="material-symbols-outlined">arrow_back</span>
              </button>
            </Link>
            <h1 className="text-2xl font-bold text-primary-600 dark:text-primary-400 tracking-tight">
              GradeIT
              <span className="ml-1 text-sm font-normal text-gray-500 dark:text-gray-400">Marks Trend</span>
            </h1>
          </div>

          <div className="flex items-center space-x-3">
            <div className="flex items-center bg-white dark:bg-gray-800 rounded-full p-1 shadow-sm">
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
            </div>

            <UserProfile />
          </div>
        </header>

        {/* Main Content */}
        <main className="space-y-6">
          {/* Marks Trend Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 transition-all duration-300 hover:shadow-lg">
            <MarksTrendChart subjects={subjectsMarks} />
          </div>

          {/* Subject Performance Table */}
          {subjectsMarks.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
              <h3 className="text-xl font-bold mb-4">Current Subject Performance</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-4 font-semibold">Subject</th>
                      <th className="text-right py-3 px-4 font-semibold">Credits</th>
                      <th className="text-right py-3 px-4 font-semibold">Current Score</th>
                      <th className="text-right py-3 px-4 font-semibold">Grade Point</th>
                      <th className="text-right py-3 px-4 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subjectsMarks
                      .sort((a, b) => b.gradePoint - a.gradePoint)
                      .map((subject) => (
                        <tr
                          key={subject.id}
                          className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                          <td className="py-3 px-4">
                            <div>
                              <div className="font-medium">{subject.subjectName}</div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {subject.exams.length}/{subject.maxExams} exams completed
                              </div>
                            </div>
                          </td>
                          <td className="text-right py-3 px-4 font-medium">{subject.credits}</td>
                          <td className="text-right py-3 px-4">
                            <div className="font-bold">{subject.percentage.toFixed(1)}%</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {subject.totalScoredMarks}/{subject.totalMaxMarks}
                            </div>
                          </td>
                          <td className="text-right py-3 px-4">
                            <span
                              className={`font-bold ${
                                subject.gradePoint >= 8
                                  ? "text-green-600 dark:text-green-400"
                                  : subject.gradePoint >= 7
                                    ? "text-yellow-600 dark:text-yellow-400"
                                    : "text-red-600 dark:text-red-400"
                              }`}
                            >
                              {subject.gradePoint.toFixed(1)}
                            </span>
                          </td>
                          <td className="text-right py-3 px-4">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-medium ${
                                subject.gradePoint >= 8
                                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                  : subject.gradePoint >= 7
                                    ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                                    : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                              }`}
                            >
                              {subject.gradePoint >= 8
                                ? "Excellent"
                                : subject.gradePoint >= 7
                                  ? "Good"
                                  : "Needs Improvement"}
                            </span>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* No Data State */}
          {subjectsMarks.length === 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center">
              <span className="material-symbols-outlined text-4xl text-primary-500 mb-4">trending_up</span>
              <h2 className="text-xl font-medium mb-2">No Marks Data Available</h2>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                Add subjects and marks data to view trends and analytics.
              </p>
              <Link href="/marks">
                <button className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium">
                  Go to Marks Section
                </button>
              </Link>
            </div>
          )}
        </main>

        {/* Bottom Navigation */}
        <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 py-2 px-6 border-t border-gray-200 dark:border-gray-700 md:hidden z-10 bottom-nav-safe">
          <div className="flex justify-between items-center">
            <Link href="/">
              <div className="flex flex-col items-center text-gray-600 dark:text-gray-400">
                <span className="material-symbols-outlined">home</span>
                <span className="text-xs mt-1">Home</span>
              </div>
            </Link>

            <Link href="/marks">
              <div className="flex flex-col items-center text-gray-600 dark:text-gray-400">
                <span className="material-symbols-outlined">grade</span>
                <span className="text-xs mt-1">Marks</span>
              </div>
            </Link>

            <div className="flex flex-col items-center text-primary-600 dark:text-primary-400">
              <span className="material-symbols-outlined">trending_up</span>
              <span className="text-xs mt-1">Trends</span>
            </div>

            <Link href="/marks">
              <div className="flex flex-col items-center text-gray-600 dark:text-gray-400">
                <span className="material-symbols-outlined">insights</span>
                <span className="text-xs mt-1">Analytics</span>
              </div>
            </Link>
          </div>
        </nav>
      </div>
    </ProtectedRoute>
  )
}

export default MarksTrendPage

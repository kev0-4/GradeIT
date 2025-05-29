"use client"

import { useState, useEffect } from "react"
import { useTheme } from "next-themes"
import Link from "next/link"

import ProtectedRoute from "../components/protected-route"
import UserProfile from "../components/user-profile"
import { useAuth } from "../contexts/auth-context"
import { getUserDocuments } from "../utils/user-data"
import AttendanceTrendChart from "../components/attendance-trend-chart"
import MarksTrendChart from "../components/marks-trend-chart"

const TrendsPage = () => {
  const [subjects, setSubjects] = useState([])
  const [subjectsMarks, setSubjectsMarks] = useState([])
  const [mounted, setMounted] = useState(false)
  const [activeTab, setActiveTab] = useState<"attendance" | "marks">("attendance")
  const { theme, setTheme } = useTheme()
  const { user } = useAuth()

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return

      try {
        const [attendanceData, marksData] = await Promise.all([
          getUserDocuments(user, "subjects"),
          getUserDocuments(user, "marks"),
        ])
        setSubjects(attendanceData)
        setSubjectsMarks(marksData)
      } catch (error) {
        console.error("Error fetching data:", error)
      }
    }

    if (user) {
      fetchData()
    }
    setMounted(true)
  }, [user])

  if (!mounted) return <div className="flex items-center justify-center h-screen">Loading...</div>

  return (
    <ProtectedRoute>
      <div className="w-[400px] md:w-[768px] lg:w-[1024px] p-4 md:p-6 lg:p-8 pb-20 md:pb-8 bg-gray-50 dark:bg-gray-900 min-h-screen transition-colors duration-300">
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
              <span className="ml-1 text-sm font-normal text-gray-500 dark:text-gray-400">Trends & Analytics</span>
            </h1>
          </div>

          <div className="flex items-center space-x-3">
            <div className="flex items-center bg-white dark:bg-gray-800 rounded-full p-1 shadow-sm">
              <button
                className={`w-8 h-8 rounded-full flex items-center justify-center ${theme === "light" ? "bg-primary-100" : ""}`}
                onClick={() => setTheme("light")}
              >
                <span className="material-symbols-outlined text-yellow-500">light_mode</span>
              </button>
              <button
                className={`w-8 h-8 rounded-full flex items-center justify-center ${theme === "dark" ? "bg-primary-100" : ""}`}
                onClick={() => setTheme("dark")}
              >
                <span className="material-symbols-outlined text-indigo-400">dark_mode</span>
              </button>
            </div>

            <UserProfile />
          </div>
        </header>

        {/* Tab Navigation */}
        <div className="flex bg-white dark:bg-gray-800 rounded-lg p-1 mb-6 shadow-sm">
          <button
            onClick={() => setActiveTab("attendance")}
            className={`flex-1 flex items-center justify-center py-3 px-4 rounded-md transition-all duration-200 ${
              activeTab === "attendance"
                ? "bg-primary-600 text-white shadow-sm"
                : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            }`}
          >
            <span className="material-symbols-outlined mr-2">event_available</span>
            Attendance Trends
          </button>
          <button
            onClick={() => setActiveTab("marks")}
            className={`flex-1 flex items-center justify-center py-3 px-4 rounded-md transition-all duration-200 ${
              activeTab === "marks"
                ? "bg-primary-600 text-white shadow-sm"
                : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            }`}
          >
            <span className="material-symbols-outlined mr-2">grade</span>
            Marks Trends
          </button>
        </div>

        {/* Main Content */}
        <main className="space-y-6">
          {activeTab === "attendance" && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 transition-all duration-300 hover:shadow-lg">
              <AttendanceTrendChart subjects={subjects} />
            </div>
          )}

          {activeTab === "marks" && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 transition-all duration-300 hover:shadow-lg">
              <MarksTrendChart subjects={subjectsMarks} />
            </div>
          )}

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <span className="material-symbols-outlined mr-2 text-primary-600">event_available</span>
                Attendance Overview
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Total Subjects</span>
                  <span className="font-semibold">{subjects.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Overall Attendance</span>
                  <span className="font-semibold">
                    {subjects.length > 0
                      ? (
                          (subjects.reduce((sum, s) => sum + s.attended, 0) /
                            subjects.reduce((sum, s) => sum + s.happened, 0)) *
                          100
                        ).toFixed(1)
                      : "0"}
                    %
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Above 75%</span>
                  <span className="font-semibold text-green-600">
                    {subjects.filter((s) => (s.attended / s.happened) * 100 >= 75).length}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <span className="material-symbols-outlined mr-2 text-primary-600">grade</span>
                Marks Overview
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Total Subjects</span>
                  <span className="font-semibold">{subjectsMarks.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Average GPA</span>
                  <span className="font-semibold">
                    {subjectsMarks.length > 0
                      ? (
                          subjectsMarks.reduce((sum, s) => sum + s.gradePoint * s.credits, 0) /
                          subjectsMarks.reduce((sum, s) => sum + s.credits, 0)
                        ).toFixed(2)
                      : "0.00"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Above 8.0 GPA</span>
                  <span className="font-semibold text-green-600">
                    {subjectsMarks.filter((s) => s.gradePoint >= 8).length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Bottom Navigation */}
        <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 py-2 px-6 border-t border-gray-200 dark:border-gray-700 md:hidden z-10">
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

export default TrendsPage

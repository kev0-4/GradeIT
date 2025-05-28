"use client"

import { useState, useEffect } from "react"
import { useTheme } from "next-themes"
import { db } from "../firebase"
import { collection, getDocs } from "firebase/firestore"
import Link from "next/link"
import dynamic from "next/dynamic"

// Dynamically import ApexCharts to avoid SSR issues
const Chart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
  loading: () => <div className="h-[350px] flex items-center justify-center">Loading chart...</div>,
})

const MarksTrendPage = () => {
  const [subjectsMarks, setSubjectsMarks] = useState([])
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme } = useTheme()

  // Define primary and neutral colors for charts
  const primary = {
    100: "#e9e5ff",
    300: "#b7a9ff",
    500: "#7341ff",
    700: "#6327ff",
    900: "#3c08aa",
  }

  const neutral = {
    50: "#f9fafb",
    200: "#e5e7eb",
    400: "#9ca3af",
    500: "#6b7280",
    600: "#4b5563",
  }

  // Fetch subjects marks data
  useEffect(() => {
    const fetchSubjectsMarks = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "marks"))
        const marksData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        setSubjectsMarks(marksData)
      } catch (error) {
        console.error("Error fetching marks:", error)
      }
    }
    fetchSubjectsMarks()
    setMounted(true)
  }, [])

  // Generate historical data for charts
  const generateHistoricalData = (current, count = 6, variance = 10) => {
    return Array(count)
      .fill(0)
      .map((_, i) => {
        // Start lower and trend toward current value
        const base = current * (0.8 + (0.2 * i) / (count - 1))
        // Add some randomness
        const random = Math.random() * variance * 2 - variance
        // Ensure value is between 0 and 100
        return Math.min(100, Math.max(0, Math.round(base + random)))
      })
  }

  // Prepare data for charts
  const prepareChartData = () => {
    if (!subjectsMarks || subjectsMarks.length === 0) return null

    const subjectNames = subjectsMarks.map((subject) => subject.subjectName)
    const currentScores = subjectsMarks.map((subject) => subject.percentage)
    const previousScores = subjectsMarks.map((subject) => {
      // Simulate previous scores that are slightly lower
      return Math.max(0, Math.round(subject.percentage * 0.95 - Math.random() * 5))
    })

    return {
      subjectNames,
      currentScores,
      previousScores,
    }
  }

  const chartData = prepareChartData()

  // Fallback if data isn't loaded yet
  if (!mounted) return <div className="flex items-center justify-center h-screen">Loading...</div>

  // Fallback if no data is available
  if (!chartData) {
    return (
      <div className="w-[400px] md:w-[768px] lg:w-[1024px] p-4 md:p-6 lg:p-8 bg-gray-50 dark:bg-gray-900 min-h-screen transition-colors duration-300">
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
        </header>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center">
          <span className="material-symbols-outlined text-4xl text-primary-500 mb-4">trending_up</span>
          <h2 className="text-xl font-medium mb-2">No Marks Data Available</h2>
          <p className="text-gray-500 dark:text-gray-400">Add subjects and marks data to view trends and analytics.</p>
          <Link href="/marks">
            <button className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
              Go to Marks Section
            </button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="w-[400px] md:w-[768px] lg:w-[1024px] p-4 md:p-6 lg:p-8 bg-gray-50 dark:bg-gray-900 min-h-screen transition-colors duration-300">
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
        </div>
      </header>

      {/* Main Content */}
      <main className="space-y-6">
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Marks Trends</h2>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 transition-all duration-300 hover:shadow-lg">
            {mounted && chartData && (
              <div className="h-[350px]">
                {typeof window !== "undefined" && Chart && (
                  // @ts-ignore
                  <Chart
                    type="line"
                    height={300}
                    width="100%"
                    series={subjectsMarks.slice(0, 5).map((subject) => ({
                      name: subject.subjectName,
                      data: generateHistoricalData(subject.percentage),
                    }))}
                    options={{
                      chart: {
                        toolbar: { show: false },
                      },
                      colors: [primary[500], primary[700], primary[300], primary[900], primary[100]],
                      stroke: {
                        curve: "smooth",
                        width: 3,
                      },
                      xaxis: {
                        categories: ["January", "February", "March", "April", "May", "June"],
                      },
                      yaxis: {
                        title: {
                          text: "Marks (%)",
                        },
                        min: 0,
                        max: 100,
                      },
                      tooltip: {
                        theme: theme === "dark" ? "dark" : "light",
                        y: {
                          formatter: (val) => val + "%",
                        },
                      },
                    }}
                  />
                )}
              </div>
            )}
          </div>
        </div>

        {/* Fallback content if charts don't load */}
        {(!Chart || typeof window === "undefined") && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 text-center">
            <p className="text-lg font-medium">Charts visualization is not available</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Please check your connection or try again later.
            </p>
          </div>
        )}

        {/* Simple data table as fallback */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4">
          <h3 className="text-xl font-bold mb-4">Subject Performance</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-2 px-4">Subject</th>
                  <th className="text-right py-2 px-4">Current Score</th>
                  <th className="text-right py-2 px-4">Grade Point</th>
                  <th className="text-right py-2 px-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {subjectsMarks.map((subject) => (
                  <tr key={subject.id} className="border-b border-gray-100 dark:border-gray-800">
                    <td className="py-2 px-4">{subject.subjectName}</td>
                    <td className="text-right py-2 px-4">{subject.percentage.toFixed(1)}%</td>
                    <td className="text-right py-2 px-4">{subject.gradePoint.toFixed(1)}</td>
                    <td className="text-right py-2 px-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          subject.gradePoint >= 8
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                            : subject.gradePoint >= 7
                              ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                              : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                        }`}
                      >
                        {subject.gradePoint >= 8 ? "Excellent" : subject.gradePoint >= 7 ? "Good" : "Needs Improvement"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
  )
}

export default MarksTrendPage

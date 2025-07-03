"use client"

import { useState, useEffect, useMemo } from "react"
import { useTheme } from "next-themes"
import dynamic from "next/dynamic"
import { getAttendanceHistory } from "../utils/user-data"
import { groupAttendanceByPeriod, getSubjectWiseAttendance } from "../utils/dateUtils"
import { useAuth } from "../contexts/auth-context"

// Default colors for both light and dark themes
const DEFAULT_COLORS = {
  light: {
    primary: "#2563EB",
    text: "#111827",
    background: "#F9FAFB",
    grid: "#E5E7EB",
    warning: "#D97706",
    subjects: ["#059669", "#D97706", "#2563EB", "#EA580C", "#7C3AED", "#DB2777", "#0D9488", "#475569"],
  },
  dark: {
    primary: "#3B82F6",
    text: "#E5E7EB",
    background: "#1F2937",
    grid: "#374151",
    warning: "#F59E0B",
    subjects: ["#10B981", "#F59E0B", "#3B82F6", "#F97316", "#8B5CF6", "#EC4899", "#14B8A6", "#64748B"],
  },
  amoled: {
    primary: "#00FFFF",
    text: "#00FFFF",
    background: "#000000",
    grid: "#333333",
    warning: "#FF6F00",
    subjects: ["#00FF00", "#FF00FF", "#00FFFF", "#FF6F00", "#8000FF", "#FF0033", "#00FFCC", "#FFFF00"],
  },
}

const Chart = dynamic(
  () =>
    import("react-apexcharts").catch(() => ({
      default: () => <div className="h-[350px] flex items-center justify-center">Chart failed to load</div>,
    })),
  {
    ssr: false,
    loading: () => <div className="h-[350px] flex items-center justify-center">Loading chart...</div>,
  },
)

interface AttendanceTrendProps {
  subjects: any[]
  refreshTrigger?: number
}

export default function AttendanceTrendChart({ subjects, refreshTrigger }: AttendanceTrendProps) {
  const [mounted, setMounted] = useState(false)
  const [attendanceHistory, setAttendanceHistory] = useState([])
  const [chartPeriod, setChartPeriod] = useState<"daily" | "weekly" | "monthly">("monthly")
  const [chartType, setChartType] = useState<"overall" | "subject-wise">("overall")
  const [loading, setLoading] = useState(true)

  const { theme, systemTheme } = useTheme()
  const { user } = useAuth()

  // Safely get current theme with defaults
  const currentTheme = theme === "system" ? systemTheme || "light" : theme || "light"

  // Always return colors - use defaults if anything fails
  const colors = useMemo(() => {
    try {
      if (currentTheme === "amoled") {
        return DEFAULT_COLORS.amoled
      }
      return currentTheme === "dark" ? DEFAULT_COLORS.dark : DEFAULT_COLORS.light
    } catch (error) {
      console.error("Error getting theme colors, using light theme", error)
      return DEFAULT_COLORS.light
    }
  }, [currentTheme])

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const fetchAttendanceHistory = async () => {
      if (!user) return

      setLoading(true)
      try {
        const history = await getAttendanceHistory(user)
        console.log("Fetched attendance records:", history.length, history)

        // Verify data quality
        const withMissingAttended = history.filter((e) => e.attended === undefined).length
        const withMissingHappened = history.filter((e) => e.happened === undefined).length
        console.log(`Data quality: ${withMissingAttended} missing attended, ${withMissingHappened} missing happened`)

        setAttendanceHistory(history)
      } catch (error) {
        console.error("Error fetching attendance history:", error)
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      fetchAttendanceHistory()
    }
  }, [user, refreshTrigger])

  // Memoize all chart data calculations
  // Memoize all chart data calculations
  const { groupedData, currentAttendance, chartData, series } = useMemo(() => {
    const grouped = groupAttendanceByPeriod(attendanceHistory, chartPeriod)
    const current = getSubjectWiseAttendance(subjects)

    // console.log("Raw grouped data:", grouped); // Debug log

    let data: any = []
    let ser: any = []

    if (chartType === "overall") {
      data = grouped.slice(-12).map((item) => {
        // Debug log to check the values
        // console.log(`Period ${item.period}:`, {
        //   attended: item.attendedClasses,
        //   total: item.totalClasses,
        //   originalPercentage: item.percentage,
        // });

        // Calculate percentage manually to verify
        const calculatedPercentage = item.totalClasses > 0 ? (item.attendedClasses / item.totalClasses) * 100 : 0

        return {
          x: item.period,
          y: Math.round(calculatedPercentage * 100) / 100,
          totalClasses: item.totalClasses,
          attendedClasses: item.attendedClasses,
          subjectCount: item.subjectCount,
        }
      })

      ser = [
        {
          name: "Overall Attendance %",
          data: data,
          color: colors.primary,
        },
      ]
    } else {
      const subjectNames = [...new Set(attendanceHistory.map((entry) => entry.subjectName))].filter(Boolean)
      const periods = grouped.slice(-12).map((item) => item.period)

      ser = subjectNames.slice(0, 8).map((subjectName, index) => ({
        name: subjectName,
        data: periods.map((period) => {
          const periodData = grouped.find((item) => item.period === period)
          if (!periodData || !periodData.subjectsData) {
            return { x: period, y: 0 }
          }

          const subjectData = periodData.subjectsData.find((s) => s.name === subjectName)

          if (!subjectData) {
            return { x: period, y: 0 }
          }

          // Debug log for subject data
          // console.log(`Subject ${subjectName} in ${period}:`, {
          //   attended: subjectData.attendedClasses,
          //   total: subjectData.totalClasses,
          //   originalPercentage: subjectData.percentage,
          // });

          const calculatedPercentage =
            subjectData.totalClasses > 0 ? (subjectData.attendedClasses / subjectData.totalClasses) * 100 : 0

          return {
            x: period,
            y: Math.round(calculatedPercentage * 100) / 100,
            totalClasses: subjectData.totalClasses,
            attendedClasses: subjectData.attendedClasses,
          }
        }),
        color: colors.subjects[index % colors.subjects.length],
      }))
    }

    return {
      groupedData: grouped,
      currentAttendance: current,
      chartData: data,
      series: ser,
    }
  }, [attendanceHistory, chartPeriod, subjects, chartType, colors])

  const chartOptions = useMemo(
    () => ({
      chart: {
        type: chartType === "overall" ? "area" : "line",
        toolbar: { show: true },
        animations: { enabled: true },
        background: "transparent",
        foreColor: colors.text,
      },
      colors: chartType === "overall" ? [colors.primary] : colors.subjects,
      stroke: { curve: "smooth", width: chartType === "overall" ? 3 : 2 },
      markers: { size: chartType === "overall" ? 6 : 4 },
      grid: { borderColor: colors.grid },
      xaxis: { type: "category", labels: { style: { colors: colors.text } } },
      yaxis: {
        labels: { formatter: (val: number) => `${val.toFixed(0)}%` },
        min: 0,
        max: 100,
      },
      tooltip: { theme: currentTheme === "dark" ? "dark" : "light" },
      legend: {
        show: chartType === "subject-wise",
        labels: { colors: colors.text },
      },
    }),
    [chartType, colors, currentTheme],
  )
  if (!mounted) {
    return <div className="h-[350px] flex items-center justify-center">Loading chart...</div>
  }

  if (loading) {
    return (
      <div className="h-[350px] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-2"></div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading attendance data...</p>
        </div>
      </div>
    )
  }

  if (attendanceHistory.length === 0) {
    return (
      <div className="h-[350px] flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
        <div className="text-center">
          <span className="material-symbols-outlined text-4xl text-gray-400 mb-2">trending_up</span>
          <p className="text-lg font-medium mb-2">No Attendance History</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Start logging your attendance to see trends and analytics.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h3 className="text-lg font-semibold">Attendance Trends</h3>
        <div className="flex flex-col sm:flex-row gap-2">
          {/* Chart Type Selection */}
          <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setChartType("overall")}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                chartType === "overall"
                  ? "bg-primary-600 text-white"
                  : "text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              Overall
            </button>
            <button
              onClick={() => setChartType("subject-wise")}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                chartType === "subject-wise"
                  ? "bg-primary-600 text-white"
                  : "text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              By Subject
            </button>
          </div>

          {/* Period Selection */}
          <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            {(["daily", "weekly", "monthly"] as const).map((period) => (
              <button
                key={period}
                onClick={() => setChartPeriod(period)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  chartPeriod === period
                    ? "bg-primary-600 text-white"
                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
              >
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="h-[350px] bg-white dark:bg-gray-800 rounded-lg p-4">
        {mounted && (
          <Chart
            type={chartType === "overall" ? "area" : "line"}
            height={300}
            width="100%"
            series={series}
            options={chartOptions}
          />
        )}
      </div>

      {/* Current Subject Status */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
        <h4 className="text-md font-semibold mb-3">Current Subject Status</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {currentAttendance.map((subject, index) => (
            <div
              key={subject.name}
              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" title={subject.name}>
                  {subject.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {subject.attended}/{subject.total} classes
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{
                    backgroundColor: colors.subjects[index % colors.subjects.length],
                  }}
                ></div>
                <span
                  className={`text-sm font-bold ${
                    subject.percentage >= subject.goal
                      ? "text-green-600 dark:text-green-400"
                      : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {subject.percentage.toFixed(1)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total Entries</p>
          <p className="text-lg font-bold">{attendanceHistory.length}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Avg Attendance</p>
          <p className="text-lg font-bold">
            {groupedData.length > 0
              ? (groupedData.reduce((sum, item) => sum + item.percentage, 0) / groupedData.length).toFixed(1)
              : "0"}
            %
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Best Period</p>
          <p className="text-lg font-bold">
            {groupedData.length > 0 ? Math.max(...groupedData.map((item) => item.percentage)).toFixed(1) : "0"}%
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Subjects Tracked</p>
          <p className="text-lg font-bold">{subjects.length}</p>
        </div>
      </div>
    </div>
  )
}

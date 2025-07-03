// Utility functions for date handling and chart data processing

export const formatDate = (date: Date): string => {
  return date.toISOString().split("T")[0] // YYYY-MM-DD format
}

export const formatDateForDisplay = (date: Date): string => {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

export const getMonthYear = (date: Date): string => {
  return date.toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  })
}

export const getDaysInMonth = (year: number, month: number): number => {
  return new Date(year, month + 1, 0).getDate()
}

export const getWeekNumber = (date: Date): number => {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1)
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7)
}

// Calculate attendance percentage from attendance array
export const calculateAttendancePercentage = (
  attendance: Array<{ date: string; status: "present" | "absent" }>,
): number => {
  if (attendance.length === 0) return 0
  const presentCount = attendance.filter((entry) => entry.status === "present").length
  return Math.round((presentCount / attendance.length) * 100)
}

// Get attendance status based on percentage
export const getAttendanceStatus = (percentage: number) => {
  if (percentage >= 75) {
    return { variant: "default", label: "Good" }
  } else if (percentage >= 60) {
    return { variant: "secondary", label: "Warning" }
  } else {
    return { variant: "destructive", label: "Critical" }
  }
}

// Group attendance data by time periods with subject-wise segregation - FIXED
export const groupAttendanceByPeriod = (
  attendanceHistory: any[],
  period: "daily" | "weekly" | "monthly" = "monthly",
) => {
  // Validate and normalize data first
  const validatedData = attendanceHistory.map((entry) => ({
    ...entry,
    attended: entry.attended || false,
    happened: entry.happened !== false, // Default to true
    date: entry.date ? new Date(entry.date) : new Date(),
    subjectName: entry.subjectName || "Unknown",
  }))

  console.log("Validated attendance data:", validatedData)

  const grouped = new Map()

  validatedData.forEach((entry) => {
    if (!entry.happened) return // Skip classes that didn't happen

    const date = entry.date
    let key: string

    switch (period) {
      case "daily":
        key = formatDate(date)
        break
      case "weekly":
        // Consistent week grouping
        const weekStart = new Date(date)
        weekStart.setDate(date.getDate() - date.getDay())
        key = `Week of ${formatDateForDisplay(weekStart)}`
        break
      case "monthly":
      default:
        key = getMonthYear(date)
        break
    }

    if (!grouped.has(key)) {
      grouped.set(key, {
        period: key,
        totalClasses: 0,
        attendedClasses: 0,
        subjects: new Map(),
        date: date,
      })
    }

    const group = grouped.get(key)
    group.totalClasses += 1

    if (entry.attended) {
      group.attendedClasses += 1
    }

    // Subject-wise tracking
    const subjectName = entry.subjectName
    if (!group.subjects.has(subjectName)) {
      group.subjects.set(subjectName, {
        totalClasses: 0,
        attendedClasses: 0,
      })
    }

    const subjectData = group.subjects.get(subjectName)
    subjectData.totalClasses += 1
    if (entry.attended) {
      subjectData.attendedClasses += 1
    }
  })

  // Convert to array with percentages
  const result = Array.from(grouped.values())
    .map((group) => ({
      ...group,
      percentage:
        group.totalClasses > 0 ? Math.round((group.attendedClasses / group.totalClasses) * 100 * 100) / 100 : 0,
      subjectCount: group.subjects.size,
      subjectsData: Array.from(group.subjects.entries()).map(([name, data]) => ({
        name,
        ...data,
        percentage:
          data.totalClasses > 0 ? Math.round((data.attendedClasses / data.totalClasses) * 100 * 100) / 100 : 0,
      })),
    }))
    .sort((a, b) => a.date.getTime() - b.date.getTime())

  console.log("Final grouped attendance data:", result)
  return result
}

// Group marks data by time periods with subject-wise segregation
export const groupMarksByPeriod = (marksHistory: any[], period: "daily" | "weekly" | "monthly" = "monthly") => {
  const grouped = new Map()

  marksHistory.forEach((entry) => {
    const date = new Date(entry.date)
    let key: string

    switch (period) {
      case "daily":
        key = formatDate(date)
        break
      case "weekly":
        key = `Week ${getWeekNumber(date)}, ${date.getFullYear()}`
        break
      case "monthly":
      default:
        key = getMonthYear(date)
        break
    }

    if (!grouped.has(key)) {
      grouped.set(key, {
        period: key,
        totalMarks: 0,
        scoredMarks: 0,
        examCount: 0,
        subjects: new Map(),
        date: date,
      })
    }

    const group = grouped.get(key)
    group.totalMarks += entry.totalMarks || 0
    group.scoredMarks += entry.scoredMarks || 0
    group.examCount += 1

    // Track subject-wise data
    const subjectName = entry.subjectName
    if (!group.subjects.has(subjectName)) {
      group.subjects.set(subjectName, {
        totalMarks: 0,
        scoredMarks: 0,
        examCount: 0,
      })
    }

    const subjectData = group.subjects.get(subjectName)
    subjectData.totalMarks += entry.totalMarks || 0
    subjectData.scoredMarks += entry.scoredMarks || 0
    subjectData.examCount += 1
  })

  return Array.from(grouped.values())
    .map((group) => ({
      ...group,
      percentage: group.totalMarks > 0 ? (group.scoredMarks / group.totalMarks) * 100 : 0,
      subjectCount: group.subjects.size,
      subjectsData: Array.from(group.subjects.entries()).map(([name, data]) => ({
        name,
        totalMarks: data.totalMarks,
        scoredMarks: data.scoredMarks,
        examCount: data.examCount,
        percentage: data.totalMarks > 0 ? (data.scoredMarks / data.totalMarks) * 100 : 0,
      })),
    }))
    .sort((a, b) => a.date.getTime() - b.date.getTime())
}

// Generate chart colors that work in both light and dark mode - FIXED
export const getChartColors = (isDark = false) => {
  const baseColors = {
    primary: isDark ? "#8b5cf6" : "#7c3aed",
    secondary: isDark ? "#06b6d4" : "#0891b2",
    success: isDark ? "#10b981" : "#059669",
    warning: isDark ? "#f59e0b" : "#d97706",
    danger: isDark ? "#ef4444" : "#dc2626",
    grid: isDark ? "#374151" : "#e5e7eb",
    text: isDark ? "#d1d5db" : "#374151",
    background: isDark ? "#1f2937" : "#ffffff",
  }

  const subjectColors = [
    isDark ? "#8b5cf6" : "#7c3aed", // Purple
    isDark ? "#06b6d4" : "#0891b2", // Cyan
    isDark ? "#10b981" : "#059669", // Green
    isDark ? "#f59e0b" : "#d97706", // Amber
    isDark ? "#ef4444" : "#dc2626", // Red
    isDark ? "#ec4899" : "#db2777", // Pink
    isDark ? "#6366f1" : "#4f46e5", // Indigo
    isDark ? "#84cc16" : "#65a30d", // Lime
  ]

  return {
    ...baseColors,
    subjects: subjectColors,
  }
}

// Get subject-wise attendance data for current state - FIXED
export const getSubjectWiseAttendance = (subjects: any[]) => {
  return subjects.map((subject) => ({
    name: subject.name || "Unknown Subject",
    attended: subject.attended || 0,
    total: subject.happened || 0,
    percentage: (subject.happened || 0) > 0 ? ((subject.attended || 0) / subject.happened) * 100 : 0,
    goal: subject.customGoalPercentage || 75,
  }))
}

// Get subject-wise marks data for current state
export const getSubjectWiseMarks = (subjects: any[]) => {
  return subjects.map((subject) => ({
    name: subject.subjectName || "Unknown Subject",
    scored: subject.totalScoredMarks || 0,
    total: subject.totalMaxMarks || 0,
    percentage: subject.percentage || 0,
    gradePoint: subject.gradePoint || 0,
    credits: subject.credits || 0,
  }))
}

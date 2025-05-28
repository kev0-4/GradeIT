"use client"

import { useState, useEffect } from "react"
import dynamic from "next/dynamic"

// Dynamically import ApexCharts to avoid SSR issues
const Chart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
  loading: () => <div className="h-[350px] flex items-center justify-center">Loading chart...</div>,
})

interface AttendanceTrendProps {
  subjects: any[]
}

export default function AttendanceTrendChart({ subjects }: AttendanceTrendProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Process data for the chart
  const generateHistoricalData = (current: number) => {
    // Generate 6 months of simulated data leading up to current percentage
    const variance = 15 // Max variance from current value

    return Array(6)
      .fill(0)
      .map((_, i) => {
        // Start lower and trend toward current value
        const base = current * (0.7 + (0.3 * i) / 5)
        // Add some randomness
        const random = Math.random() * variance * 2 - variance
        // Ensure value is between 0 and 100
        return Math.min(100, Math.max(0, Math.round(base + random)))
      })
  }

  const seriesData = subjects.slice(0, 5).map((subject) => {
    const currentPercentage = subject.happened > 0 ? Math.round((subject.attended / subject.happened) * 100) : 0

    return {
      name: subject.name,
      data: generateHistoricalData(currentPercentage),
    }
  })

  const options = {
    chart: {
      toolbar: { show: false },
      animations: {
        enabled: true,
        easing: "easeinout",
        speed: 800,
      },
    },
    colors: ["#7341ff", "#6327ff", "#8355ff", "#9169ff", "#a47dff"],
    stroke: {
      curve: "smooth",
      width: 3,
    },
    markers: {
      size: 5,
      hover: {
        size: 7,
      },
    },
    grid: {
      borderColor: "#e5e7eb",
      row: {
        colors: ["#f9fafb", "transparent"],
        opacity: 0.5,
      },
    },
    xaxis: {
      categories: ["January", "February", "March", "April", "May", "June"],
      labels: {
        style: {
          colors: "#4b5563",
        },
      },
    },
    yaxis: {
      title: {
        text: "Attendance (%)",
        style: {
          fontWeight: 600,
        },
      },
      min: 50,
      max: 100,
      labels: {
        style: {
          colors: "#4b5563",
        },
      },
    },
    tooltip: {
      theme: "light",
      y: {
        formatter: (val: number) => val + "%",
      },
    },
    legend: {
      position: "top",
      horizontalAlign: "right",
      floating: true,
      offsetY: -25,
      offsetX: -5,
    },
    annotations: {
      yaxis: [
        {
          y: 75,
          borderColor: "#ff4560",
          label: {
            borderColor: "#ff4560",
            style: {
              color: "#fff",
              background: "#ff4560",
            },
            text: "Attendance Threshold (75%)",
          },
        },
      ],
    },
  }

  if (!mounted) return <div className="h-[350px] flex items-center justify-center">Loading chart...</div>

  // Fallback if ApexCharts fails to load
  if (typeof window === "undefined" || !Chart) {
    return (
      <div className="h-[350px] flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
        <p className="text-lg font-medium mb-2">Attendance Trends</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Charts visualization is not available. Please check your connection or try again later.
        </p>
      </div>
    )
  }

  return (
    <div className="h-[350px]">
      {mounted && (
        // @ts-ignore - ApexCharts types might not be available
        <Chart type="line" height={300} width="100%" series={seriesData} options={options} />
      )}
    </div>
  )
}

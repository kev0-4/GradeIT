"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import Link from "next/link"
import { toast } from "sonner"
import dynamic from "next/dynamic"

// Add imports for authentication
import ProtectedRoute from "../components/protected-route"
import UserProfile from "../components/user-profile"
import { useAuth } from "../contexts/auth-context"
import {
  getUserDocuments,
  addUserDocument,
  updateUserDocument,
  addAttendanceHistory,
  deleteUserDocument,
  deleteAttendanceHistoryForSubject,
  deleteMarksHistoryForSubject,
} from "../utils/user-data"

// Dynamically import the chart component
const AttendanceTrendChart = dynamic(() => import("../components/attendance-trend-chart"), {
  ssr: false,
  loading: () => <div className="h-[350px] flex items-center justify-center">Loading chart...</div>,
})

const App = () => {
  const [subjects, setSubjects] = useState([])
  const [newSubject, setNewSubject] = useState("")
  const [newAttended, setNewAttended] = useState(0)
  const [newHappened, setNewHappened] = useState(0)
  const [showSummary, setShowSummary] = useState(false)
  const [showAttendanceTrend, setShowAttendanceTrend] = useState(false)
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
  const { theme, setTheme } = useTheme()
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [deletingSubjectId, setDeletingSubjectId] = useState<string | null>(null)

  const { user } = useAuth()

  const fetchSubjects = async () => {
    if (!user) return

    try {
      const subjectsData = await getUserDocuments(user, "subjects")
      setSubjects(subjectsData)
    } catch (error) {
      console.error("Error fetching subjects:", error)
    }
  }

  useEffect(() => {
    if (user) {
      fetchSubjects()
    }
  }, [user])

  const calculateCumulativeAttendance = () => {
    const totalAttended = subjects.reduce((sum, subject) => sum + subject.attended, 0)
    const totalHappened = subjects.reduce((sum, subject) => sum + subject.happened, 0)

    const currentPercentage = totalHappened > 0 ? ((totalAttended / totalHappened) * 100).toFixed(1) : 0
    const requiredClasses = totalHappened > 0 ? Math.ceil((0.75 * totalHappened - totalAttended) / 0.25) : 0
    const classesCanMiss = totalHappened > 0 ? Math.floor(totalAttended - 0.75 * totalHappened) : 0

    return {
      currentPercentage,
      requiredClasses,
      totalAttended,
      totalHappened,
      classesCanMiss: Math.max(0, classesCanMiss),
    }
  }

  const { currentPercentage, requiredClasses, totalAttended, totalHappened, classesCanMiss } =
    calculateCumulativeAttendance()

  const addSubject = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      if (!newSubject || newAttended < 0 || newHappened < 0 || !user) return

      const goal = Math.ceil((newHappened * 3) / 4)
      try {
        const docRef = await addUserDocument(user, "subjects", {
          name: newSubject,
          attended: newAttended,
          happened: newHappened,
          goal,
          customGoalPercentage: null,
        })
        setSubjects((prev) => [
          ...prev,
          {
            id: docRef.id,
            name: newSubject,
            attended: newAttended,
            happened: newHappened,
            goal,
            customGoalPercentage: null,
          },
        ])
        setNewSubject("")
        setNewAttended(0)
        setNewHappened(0)
      } catch (error) {
        console.error("Error adding subject:", error)
      }
    },
    [newSubject, newAttended, newHappened, user],
  )

  const updateSubject = useCallback(
    async (id, updatedData) => {
      if (!user) return

      try {
        const currentSubject = subjects.find((s) => s.id === id)
        if (!currentSubject) return

        await updateUserDocument(user, "subjects", id, updatedData)
        setSubjects((prev) => prev.map((subject) => (subject.id === id ? { ...subject, ...updatedData } : subject)))

        if (updatedData.attended !== undefined || updatedData.happened !== undefined) {
          if (updatedData.attended > currentSubject.attended && updatedData.happened > currentSubject.happened) {
            await addAttendanceHistory(user, id, currentSubject.name, true, true)
          } else if (
            updatedData.happened &&
            updatedData.happened > currentSubject.happened &&
            updatedData.attended === undefined
          ) {
            await addAttendanceHistory(user, id, currentSubject.name, false, true)
          } else if (updatedData.attended < currentSubject.attended && updatedData.happened < currentSubject.happened) {
            if (user && id) {
              try {
                const { query, orderBy, limit, getDocs, collection, where } = await import("firebase/firestore")
                const { db } = await import("../firebase")
                const historyCollectionRef = collection(db, `users/${user.uid}/attendanceHistory`)
                const q = query(
                  historyCollectionRef,
                  where("subjectId", "==", id),
                  orderBy("createdAt", "desc"),
                  limit(1),
                )
                const querySnapshot = await getDocs(q)

                if (!querySnapshot.empty) {
                  const lastEntryDoc = querySnapshot.docs[0]
                  await deleteUserDocument(user, "attendanceHistory", lastEntryDoc.id)
                  console.log("Successfully deleted last attendance entry for undo:", lastEntryDoc.id)
                }
              } catch (error) {
                console.error("Error during undo operation for attendance history:", error)
              }
            }
          }

          setRefreshTrigger((prev) => prev + 1)
        }
      } catch (error) {
        console.error("Error updating subject:", error)
      }
    },
    [user, subjects],
  )

  const handleDeleteSubject = async (subjectId: string) => {
    if (!user) {
      toast.error("User not authenticated.")
      return
    }
    setDeletingSubjectId(subjectId)
    try {
      await deleteAttendanceHistoryForSubject(user, subjectId)
      await deleteMarksHistoryForSubject(user, subjectId)
      await deleteUserDocument(user, "marks", subjectId)
      await deleteUserDocument(user, "subjects", subjectId)

      setSubjects((prevSubjects) => prevSubjects.filter((s) => s.id !== subjectId))
      toast.success("Subject and associated data deleted successfully.")
    } catch (error) {
      console.error("Error deleting subject:", error)
      toast.error("Failed to delete subject and associated data. Please try again.")
    } finally {
      setDeletingSubjectId(null)
    }
  }

  const calculateNeededClasses = useCallback((subject) => {
    const goalPercentage = subject.customGoalPercentage || 75
    const numerator = (subject.happened * goalPercentage) / 100 - subject.attended
    const denominator = 1 - goalPercentage / 100

    if (goalPercentage === 100) {
      if (subject.attended === subject.happened) {
        return 0
      }
      return Number.POSITIVE_INFINITY
    }

    if ((subject.attended / subject.happened) * 100 >= goalPercentage) {
      return 0
    }

    const requiredAdditionalClasses = Math.ceil(numerator / denominator)
    return Math.max(0, requiredAdditionalClasses)
  }, [])

  const handleGeneratePDF = async () => {
    if (!user) return

    setIsGeneratingPDF(true)
    try {
      const { generatePDFReport } = await import("../utils/pdfGenerator")
      await generatePDFReport(user)
    } catch (error) {
      console.error("Error generating PDF:", error)
      alert("There was an error generating the PDF report. Please try again.")
    } finally {
      setIsGeneratingPDF(false)
    }
  }

  return (
    <ProtectedRoute>
      <div className="w-[400px] md:w-[768px] lg:w-[1024px] p-4 md:p-6 lg:p-8 pb-20 md:pb-8 bg-gray-50 dark:bg-gray-900 min-h-screen transition-colors duration-300">
        <header className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-2xl font-bold text-primary-600 dark:text-primary-400 tracking-tight">
            GradeIT
            <span className="ml-1 text-sm font-normal text-gray-500 dark:text-gray-400">v2.0</span>
          </h1>

          <div className="flex items-center space-x-3">
            <button
              className="relative inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-300 hover:bg-primary-200 dark:hover:bg-primary-800 transition-colors duration-200 shadow-sm"
              onClick={handleGeneratePDF}
              disabled={isGeneratingPDF}
            >
              <span className="material-symbols-outlined">download</span>
            </button>

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

        {user && localStorage.getItem("demoUser") && (
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-3 rounded-lg mb-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <span className="material-symbols-outlined mr-2">info</span>
                <div>
                  <p className="font-medium text-sm">Demo Mode Active</p>
                  <p className="text-xs opacity-90">You're viewing sample data. Changes won't be saved permanently.</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="bg-white/20 border-white/30 text-white hover:bg-white/30"
                onClick={() => {
                  localStorage.removeItem("demoUser")
                  window.location.href = "/login"
                }}
              >
                Exit Demo
              </Button>
            </div>
          </div>
        )}

        <main className="space-y-6">
          <section className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm transition-transform duration-200 hover:shadow-md hover:-translate-y-1">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium">Current Attendance</h2>
              <span
                className={`text-2xl font-bold ${
                  Number(currentPercentage) >= 75
                    ? "text-green-600 dark:text-green-400"
                    : Number(currentPercentage) >= 72
                      ? "text-amber-600 dark:text-amber-400"
                      : "text-red-600 dark:text-red-400"
                }`}
              >
                {currentPercentage}%
              </span>
            </div>

            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mb-2 relative">
              <div
                className={`h-2.5 rounded-full ${
                  Number(currentPercentage) >= 75
                    ? "bg-green-500"
                    : Number(currentPercentage) >= 72
                      ? "bg-amber-500"
                      : "bg-red-500"
                }`}
                style={{
                  width: `${Math.min(Number(currentPercentage), 100)}%`,
                }}
              ></div>
              <div className="absolute top-0 bottom-0 w-0.5 bg-primary-600 dark:bg-primary-400" style={{ left: "75%" }}>
                <div className="absolute -top-6 -translate-x-1/2 text-xs text-primary-600 dark:text-primary-400 whitespace-nowrap">
                  Goal: 75%
                </div>
              </div>
            </div>

            <div className="flex justify-between text-sm">
              <div className="text-gray-500 dark:text-gray-400">
                <span>{totalAttended} Present</span>
                <span className="mx-1">•</span>
                <span>{totalHappened - totalAttended} Absent</span>
              </div>
              <div className="font-medium">
                {Number(currentPercentage) >= 75 ? (
                  <span className="text-green-600 dark:text-green-400">Can miss {classesCanMiss} more classes</span>
                ) : (
                  <span className="text-amber-600 dark:text-amber-400">Need {requiredClasses} more classes</span>
                )}
              </div>
            </div>

            <div className="mt-3 flex justify-end">
              <button
                className="text-primary-600 dark:text-primary-400 text-sm flex items-center"
                onClick={() => setShowAttendanceTrend(true)}
              >
                <span className="material-symbols-outlined text-sm mr-1">trending_up</span>
                View Trend
              </button>
            </div>
          </section>

          <Sheet open={showAttendanceTrend} onOpenChange={setShowAttendanceTrend}>
            <SheetContent side="bottom" className="h-[80vh] p-0 overflow-hidden flex flex-col">
              <div className="p-4 border-b">
                <SheetHeader className="text-left">
                  <SheetTitle className="font-sans">Attendance Trends</SheetTitle>
                  <SheetDescription>Visual analysis of your attendance over time</SheetDescription>
                </SheetHeader>
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 mb-6">
                  <AttendanceTrendChart subjects={subjects} refreshTrigger={refreshTrigger} />
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4">
                  <h3 className="text-lg font-medium mb-3">Attendance Insights</h3>
                  <div className="space-y-3">
                    {Number(currentPercentage) >= 75 ? (
                      <div className="flex items-center text-green-600 dark:text-green-400">
                        <span className="material-symbols-outlined mr-2">check_circle</span>
                        <span>Your overall attendance is above the required 75% threshold.</span>
                      </div>
                    ) : (
                      <div className="flex items-center text-amber-600 dark:text-amber-400">
                        <span className="material-symbols-outlined mr-2">warning</span>
                        <span>Your overall attendance is below the required 75% threshold.</span>
                      </div>
                    )}

                    {subjects.filter((s) => (s.attended / s.happened) * 100 < 75).length > 0 && (
                      <div className="flex items-center text-red-600 dark:text-red-400">
                        <span className="material-symbols-outlined mr-2">error</span>
                        <span>
                          {subjects.filter((s) => (s.attended / s.happened) * 100 < 75).length} subjects have attendance
                          below 75%.
                        </span>
                      </div>
                    )}

                    {Number(currentPercentage) < 75 && (
                      <div className="bg-primary-100 dark:bg-primary-900 p-3 rounded-lg mt-4">
                        <p className="font-medium mb-1">Recommendation</p>
                        <p className="text-sm">
                          To reach 75% attendance, you need to attend {requiredClasses} more classes without missing
                          any.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div
              className="flex flex-col items-center justify-center bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm transition-all duration-200 hover:shadow-md hover:bg-gray-50 dark:hover:bg-gray-700 hover:-translate-y-1 group"
              onClick={handleGeneratePDF}
            >
              <span className="material-symbols-outlined text-2xl text-primary-500 mb-2 group-hover:scale-110 transition-transform">
                download
              </span>
              <span className="text-sm font-medium">Summary Download</span>
            </div>

            <Link href="/marks">
              <div className="flex flex-col items-center justify-center bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm transition-all duration-200 hover:shadow-md hover:bg-gray-50 dark:hover:bg-gray-700 hover:-translate-y-1 group">
                <span className="material-symbols-outlined text-2xl text-primary-500 mb-2 group-hover:scale-110 transition-transform">
                  grade
                </span>
                <span className="text-sm font-medium">Marks Section</span>
              </div>
            </Link>

            <Link href="/trends">
              <div className="flex flex-col items-center justify-center bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm transition-all duration-200 hover:shadow-md hover:bg-gray-50 dark:hover:bg-gray-700 hover:-translate-y-1 group">
                <span className="material-symbols-outlined text-2xl text-primary-500 mb-2 group-hover:scale-110 transition-transform">
                  trending_up
                </span>
                <span className="text-sm font-medium">Trends & Analytics</span>
              </div>
            </Link>

            <Sheet>
              <SheetTrigger asChild>
                <div className="flex flex-col items-center justify-center bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm transition-all duration-200 hover:shadow-md hover:bg-gray-50 dark:hover:bg-gray-700 hover:-translate-y-1 group">
                  <span className="material-symbols-outlined text-2xl text-primary-500 mb-2 group-hover:scale-110 transition-transform">
                    add_circle
                  </span>
                  <span className="text-sm font-medium">Add Subject</span>
                </div>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle className="font-sans">Add New Subject</SheetTitle>
                  <SheetDescription>Enter the details of the new subject you want to track.</SheetDescription>
                </SheetHeader>
                <form onSubmit={addSubject} className="space-y-4 mt-4">
                  <Input
                    type="text"
                    placeholder="Subject Name"
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value)}
                    required
                  />
                  <Input
                    type="number"
                    placeholder="Classes Attended"
                    value={newAttended}
                    onChange={(e) => setNewAttended(Number.parseInt(e.target.value, 10))}
                    required
                  />
                  <Input
                    type="number"
                    placeholder="Classes Happened"
                    value={newHappened}
                    onChange={(e) => setNewHappened(Number.parseInt(e.target.value, 10))}
                    required
                  />
                  <Button type="submit" className="w-full">
                    Add Subject
                  </Button>
                </form>
              </SheetContent>
            </Sheet>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {subjects.map((subject) => {
              const neededClasses = calculateNeededClasses(subject)
              const currentPercentage =
                subject.happened > 0 ? ((subject.attended / subject.happened) * 100).toFixed(1) : 0
              const goalPercentage = subject.customGoalPercentage || 75

              const colors = [
                "from-primary-500/90 to-indigo-600/90",
                "from-amber-500 to-orange-600",
                "from-emerald-500/90 to-teal-600/90",
                "from-blue-500/90 to-cyan-600/90",
                "from-purple-500/90 to-pink-600/90",
                "from-red-500/90 to-rose-600/90",
              ]
              const colorIndex = subject.name.length % colors.length
              const gradientColor = colors[colorIndex]

              return (
                <div
                  key={subject.id}
                  className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm transition-all duration-200 hover:shadow-lg hover:-translate-y-1"
                >
                  <div
                    className={`h-28 bg-gradient-to-r ${gradientColor} p-4 flex flex-col justify-between text-white`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1 mr-2">
                        <h3 className="font-bold truncate">{subject.name}</h3>
                      </div>
                      <div className="flex-shrink-0">
                        <span className="bg-white/20 px-2 py-1 rounded-full text-xs backdrop-blur-sm whitespace-nowrap">
                          {Number(currentPercentage) >= goalPercentage ? "On Track" : "Needs Attention"}
                        </span>
                      </div>
                    </div>
                    <div className="text-sm">
                      <p>
                        Attendance: {subject.attended}/{subject.happened}
                      </p>
                      <p className="opacity-80">Goal: {goalPercentage}%</p>
                    </div>
                  </div>

                  <div className="p-4">
                    <div className="flex justify-between mb-3">
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Current</p>
                        <p
                          className={`text-xl font-bold ${
                            Number(currentPercentage) >= goalPercentage
                              ? "text-green-600 dark:text-green-400"
                              : Number(currentPercentage) >= goalPercentage - 3
                                ? "text-amber-600 dark:text-amber-400"
                                : "text-red-600 dark:text-red-400"
                          }`}
                        >
                          {currentPercentage}%
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500 dark:text-gray-400">Needed Classes</p>
                        <p className="text-xl font-bold text-primary-600 dark:text-primary-400">{neededClasses}</p>
                      </div>
                    </div>

                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-4 relative">
                      <div
                        className={`h-2 rounded-full ${
                          Number(currentPercentage) >= goalPercentage
                            ? "bg-green-500"
                            : Number(currentPercentage) >= goalPercentage - 3
                              ? "bg-amber-500"
                              : "bg-red-500"
                        }`}
                        style={{
                          width: `${Math.min(Number(currentPercentage), 100)}%`,
                        }}
                      ></div>
                      <div
                        className="absolute top-0 bottom-0 w-0.5 bg-primary-600/50 dark:bg-primary-400/50"
                        style={{ left: `${goalPercentage}%` }}
                      ></div>
                    </div>

                    <div className="flex gap-2 mt-4">
                      <button
                        className="flex items-center justify-center p-2 bg-primary-600 hover:bg-primary-700 text-white rounded-full transition-all duration-300 transform hover:scale-105"
                        onClick={() =>
                          updateSubject(subject.id, {
                            attended: subject.attended + 1,
                            happened: subject.happened + 1,
                          })
                        }
                      >
                        <span className="material-symbols-outlined text-sm">check_circle</span>
                        <span className="ml-1 text-xs">Attended</span>
                      </button>

                      <button
                        className="flex items-center justify-center p-2 bg-green-600/90 hover:bg-green-700/90 text-white rounded-full transition-all duration-300 transform hover:scale-105"
                        onClick={() =>
                          updateSubject(subject.id, {
                            happened: subject.happened + 1,
                          })
                        }
                      >
                        <span className="material-symbols-outlined text-sm">event_available</span>
                        <span className="ml-1 text-xs">Class Happened</span>
                      </button>

                      <button
                        className="flex items-center justify-center p-2 bg-gray-600/90 hover:bg-gray-700/90 text-white rounded-full transition-all duration-300 transform hover:scale-105"
                        onClick={() =>
                          updateSubject(subject.id, {
                            attended: Math.max(0, subject.attended - 1),
                            happened: Math.max(0, subject.happened - 1),
                          })
                        }
                      >
                        <span className="material-symbols-outlined text-sm">undo</span>
                        <span className="ml-1 text-xs">Undo</span>
                      </button>
                    </div>

                    <div className="mt-4 flex justify-end">
                      <Popover>
                        <PopoverTrigger asChild>
                          <button className="text-primary-600 dark:text-primary-400 text-sm flex items-center">
                            <span className="material-symbols-outlined text-sm mr-1">settings</span>
                            Set Goal
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80">
                          <div className="space-y-4">
                            <h4 className="font-medium">Attendance Goal</h4>
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span>Current Goal: {goalPercentage}%</span>
                                <span>Current: {currentPercentage}%</span>
                              </div>
                              <input
                                type="range"
                                min="70"
                                max="100"
                                step="5"
                                value={subject.customGoalPercentage || 75}
                                onChange={(e) => {
                                  const value = Number.parseInt(e.target.value, 10)
                                  updateSubject(subject.id, {
                                    customGoalPercentage: value,
                                  })
                                }}
                                className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full appearance-none cursor-pointer"
                              />
                              <div className="flex justify-between text-xs text-gray-500">
                                <span>70%</span>
                                <span>75%</span>
                                <span>80%</span>
                                <span>85%</span>
                                <span>90%</span>
                                <span>95%</span>
                                <span>100%</span>
                              </div>
                            </div>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="destructive"
                                  className="w-full mt-2"
                                  disabled={deletingSubjectId === subject.id}
                                >
                                  {deletingSubjectId === subject.id ? (
                                    "Deleting..."
                                  ) : (
                                    <>
                                      <span className="material-symbols-outlined text-sm mr-1">delete</span>
                                      Delete Subject
                                    </>
                                  )}
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete the subject "
                                    {subject.name}" and all its associated data, including attendance and marks history.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel disabled={deletingSubjectId === subject.id}>
                                    Cancel
                                  </AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteSubject(subject.id)}
                                    disabled={deletingSubjectId === subject.id}
                                    className="bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600"
                                  >
                                    {deletingSubjectId === subject.id ? "Deleting..." : "Delete"}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {subjects.length === 0 && (
            <Sheet>
              <SheetTrigger asChild>
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm text-center cursor-pointer hover:shadow-md transition-shadow">
                  <span className="material-symbols-outlined text-4xl text-primary-500 mb-2">add_circle</span>
                  <h3 className="text-lg font-medium">Add Your First Subject</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    Start tracking your attendance by adding a subject
                  </p>
                </div>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle className="font-sans">Add New Subject</SheetTitle>
                  <SheetDescription>Enter the details of the new subject you want to track.</SheetDescription>
                </SheetHeader>
                <form onSubmit={addSubject} className="space-y-4 mt-4">
                  <Input
                    type="text"
                    placeholder="Subject Name"
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value)}
                    required
                  />
                  <Input
                    type="number"
                    placeholder="Classes Attended"
                    value={newAttended}
                    onChange={(e) => setNewAttended(Number.parseInt(e.target.value, 10))}
                    required
                  />
                  <Input
                    type="number"
                    placeholder="Classes Happened"
                    value={newHappened}
                    onChange={(e) => setNewHappened(Number.parseInt(e.target.value, 10))}
                    required
                  />
                  <Button type="submit" className="w-full">
                    Add Subject
                  </Button>
                </form>
              </SheetContent>
            </Sheet>
          )}
        </main>

        <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 py-2 px-6 border-t border-gray-200 dark:border-gray-700 md:hidden z-10">
          <div className="flex justify-between items-center">
            <div className="flex flex-col items-center text-primary-600 dark:text-primary-400">
              <span className="material-symbols-outlined">home</span>
              <span className="text-xs mt-1">Home</span>
            </div>

            <Link href="/marks">
              <div className="flex flex-col items-center text-gray-600 dark:text-gray-400">
                <span className="material-symbols-outlined">grade</span>
                <span className="text-xs mt-1">Marks</span>
              </div>
            </Link>

            <Link href="/trends">
              <div className="flex flex-col items-center text-gray-600 dark:text-gray-400">
                <span className="material-symbols-outlined">trending_up</span>
                <span className="text-xs mt-1">Trends</span>
              </div>
            </Link>

            <Sheet>
              <SheetTrigger asChild>
                <div className="flex flex-col items-center text-gray-600 dark:text-gray-400">
                  <span className="material-symbols-outlined">add_circle</span>
                  <span className="text-xs mt-1">Add</span>
                </div>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle className="font-sans">Add New Subject</SheetTitle>
                  <SheetDescription>Enter the details of the new subject you want to track.</SheetDescription>
                </SheetHeader>
                <form onSubmit={addSubject} className="space-y-4 mt-4">
                  <Input
                    type="text"
                    placeholder="Subject Name"
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value)}
                    required
                  />
                  <Input
                    type="number"
                    placeholder="Classes Attended"
                    value={newAttended}
                    onChange={(e) => setNewAttended(Number.parseInt(e.target.value, 10))}
                    required
                  />
                  <Input
                    type="number"
                    placeholder="Classes Happened"
                    value={newHappened}
                    onChange={(e) => setNewHappened(Number.parseInt(e.target.value, 10))}
                    required
                  />
                  <Button type="submit" className="w-full">
                    Add Subject
                  </Button>
                </form>
              </SheetContent>
            </Sheet>
          </div>
        </nav>
      </div>
    </ProtectedRoute>
  )
}

export default App

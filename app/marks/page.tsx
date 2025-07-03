"use client"

import { useState, useEffect } from "react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { calculateGradePoint, calculatePercentage } from "../utils/gradeUtils"
import { generatePDFReport } from "../utils/pdfGenerator"

// Imports for delete functionality
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button as ShadButton } from "@/components/ui/button"
import { toast } from "sonner"

// Add imports for authentication
import ProtectedRoute from "../components/protected-route"
import UserProfile from "../components/user-profile"
import { useAuth } from "../contexts/auth-context"
import {
  getUserDocuments,
  addUserDocument,
  updateUserDocument,
  addMarksHistory,
  deleteUserDocument,
  deleteAttendanceHistoryForSubject,
  deleteMarksHistoryForSubject,
} from "../utils/user-data"

// Add import at the top
import ThemeToggle from "../components/theme-toggle"

// Define types
interface Exam {
  examName: string
  scoredMarks: number
  totalMarks: number
}

interface SubjectMarks {
  id?: string
  subjectName: string
  credits: number
  maxExams: number
  exams: Exam[]
  totalScoredMarks: number
  totalMaxMarks: number
  percentage: number
  gradePoint: number
}

const MARKS_PER_CREDIT = 25 // Each credit equals 25 marks

const MarksPage = () => {
  // Add user from useAuth hook at the top of the component
  const { user } = useAuth()
  const [subjectsMarks, setSubjectsMarks] = useState<SubjectMarks[]>([])
  const [showSummary, setShowSummary] = useState(false)
  const [showVisualizations, setShowVisualizations] = useState(false)
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null)
  const [newExam, setNewExam] = useState<Exam>({
    examName: "",
    scoredMarks: 0,
    totalMarks: 0,
  })
  const [editingSubject, setEditingSubject] = useState<SubjectMarks | null>(null)
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
  const { theme } = useTheme()
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [deletingSubjectId, setDeletingSubjectId] = useState<string | null>(null)
  const [subjectToDelete, setSubjectToDelete] = useState<SubjectMarks | null>(null)

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

  // Update the useEffect to depend on user
  useEffect(() => {
    if (user) {
      fetchSubjectsMarks()
    }
  }, [user])

  // Calculate total marks summary
  const calculateMarksSummary = () => {
    const totalAchieved = subjectsMarks.reduce((sum, subject) => sum + subject.totalScoredMarks, 0)
    const totalTaken = subjectsMarks.reduce((sum, subject) => sum + subject.totalMaxMarks, 0)
    const totalPossible = subjectsMarks.reduce((sum, subject) => sum + subject.credits * MARKS_PER_CREDIT, 0)

    const overallPercentage = totalTaken > 0 ? ((totalAchieved / totalTaken) * 100).toFixed(1) : "0"
    const progressPercentage = totalPossible > 0 ? ((totalAchieved / totalPossible) * 100).toFixed(1) : "0"

    return {
      totalAchieved,
      totalTaken,
      totalPossible,
      overallPercentage,
      progressPercentage,
    }
  }

  // Calculate average marks and GPA
  const calculateAverages = () => {
    if (subjectsMarks.length === 0) return { avgPercentage: 0, avgGPA: 0 }

    const totalCredits = subjectsMarks.reduce((sum, subject) => sum + subject.credits, 0)
    const weightedGPA = subjectsMarks.reduce((sum, subject) => sum + subject.gradePoint * subject.credits, 0)
    const totalPercentage = subjectsMarks.reduce((sum, subject) => sum + subject.percentage, 0)

    const avgGPA = totalCredits > 0 ? Number.parseFloat((weightedGPA / totalCredits).toFixed(2)) : 0
    const avgPercentage =
      subjectsMarks.length > 0 ? Number.parseFloat((totalPercentage / subjectsMarks.length).toFixed(2)) : 0

    return { avgPercentage, avgGPA }
  }

  const { avgPercentage, avgGPA } = calculateAverages()
  const { totalAchieved, totalTaken, totalPossible, overallPercentage, progressPercentage } = calculateMarksSummary()

  // Calculate minimum marks needed for each subject to reach goal
  const calculateMinimumMarksNeeded = (subject: SubjectMarks, goalPercentage = 70) => {
    const remainingExams = subject.maxExams - subject.exams.length

    // If no remaining exams, check if goal is already achieved
    if (remainingExams <= 0) {
      return {
        minPercentage: 0,
        minMarks: 0,
        achievable: subject.percentage >= goalPercentage,
      }
    }

    // Calculate total marks based on credits (each credit = 25 marks)
    const totalMaxPossibleMarks = subject.credits * MARKS_PER_CREDIT

    // Calculate target score to achieve goal percentage
    const targetTotalScore = (goalPercentage / 100) * totalMaxPossibleMarks

    // Calculate remaining marks available in future exams
    const remainingMarksAvailable = totalMaxPossibleMarks - subject.totalMaxMarks
    const marksPerRemainingExam = remainingMarksAvailable / remainingExams

    if (subject.percentage >= goalPercentage) {
      // Already meeting goal, calculate minimum to maintain it
      const minTotalScore = targetTotalScore // Minimum score needed to maintain the goal
      const minFutureMarks = minTotalScore - subject.totalScoredMarks

      // Calculate minimum percentage needed in remaining exams to maintain goal
      const minPercentageInRemaining =
        remainingMarksAvailable > 0 ? Math.min(100, Math.max(0, (minFutureMarks / remainingMarksAvailable) * 100)) : 0

      // Calculate minimum marks needed per exam
      const minMarksPerExam = remainingExams > 0 ? Math.ceil(minFutureMarks / remainingExams) : 0

      return {
        minPercentage: Math.ceil(minPercentageInRemaining),
        minMarks: Math.max(0, minMarksPerExam),
        marksPerExam: Math.ceil(marksPerRemainingExam),
        achievable: true,
      }
    }

    // Not meeting goal yet, calculate what's needed to reach it
    const additionalMarksNeeded = targetTotalScore - subject.totalScoredMarks

    // Calculate minimum percentage needed in remaining exams
    const minPercentageInRemaining =
      remainingMarksAvailable > 0
        ? Math.min(100, Math.max(0, (additionalMarksNeeded / remainingMarksAvailable) * 100))
        : 0

    // Calculate minimum marks needed per exam
    const minMarksPerExam = remainingExams > 0 ? Math.ceil(additionalMarksNeeded / remainingExams) : 0

    // Check if it's achievable
    const achievable = minPercentageInRemaining <= 100

    return {
      minPercentage: Math.ceil(minPercentageInRemaining),
      minMarks: Math.max(0, minMarksPerExam),
      marksPerExam: Math.ceil(marksPerRemainingExam),
      achievable,
    }
  }

  // Calculate marks needed to reach goal GPA - FIXED VERSION
  const calculateMarksNeeded = (goalGPA = 8) => {
    return subjectsMarks.map((subject) => {
      const currentGP = subject.gradePoint

      // Calculate what percentage is needed for the goal GPA
      let neededPercentage = 0
      if (goalGPA === 10) neededPercentage = 90
      else if (goalGPA === 9) neededPercentage = 80
      else if (goalGPA === 8) neededPercentage = 70
      else if (goalGPA === 7) neededPercentage = 60
      else if (goalGPA === 6) neededPercentage = 50
      else if (goalGPA === 5) neededPercentage = 45
      else if (goalGPA === 4) neededPercentage = 40

      // Calculate remaining exams and marks
      const remainingExams = subject.maxExams - subject.exams.length
      const totalMaxPossibleMarks = subject.credits * MARKS_PER_CREDIT

      // If no remaining exams, goal can't be achieved if not already met
      if (remainingExams <= 0) {
        return {
          ...subject,
          neededPercentage,
          additionalMarksNeeded: 0,
          minPercentageInRemaining: 0,
          remainingExams,
          achievable: currentGP >= goalGPA,
          status: currentGP >= goalGPA ? "achieved" : "impossible",
        }
      }

      // If already meeting goal, calculate minimum to maintain it
      if (currentGP >= goalGPA) {
        // Calculate minimum score needed to maintain goal
        const targetTotalScore = (neededPercentage / 100) * totalMaxPossibleMarks
        const minFutureMarks = Math.max(0, targetTotalScore - subject.totalScoredMarks)
        const remainingMarksAvailable = totalMaxPossibleMarks - subject.totalMaxMarks

        const minPercentageInRemaining =
          remainingMarksAvailable > 0 ? Math.max(0, (minFutureMarks / remainingMarksAvailable) * 100) : 0

        return {
          ...subject,
          neededPercentage,
          additionalMarksNeeded: Math.ceil(minFutureMarks),
          minPercentageInRemaining: Math.ceil(minPercentageInRemaining),
          remainingExams,
          achievable: true,
          status: "maintaining",
        }
      }

      // Calculate target score to achieve goal percentage
      const targetTotalScore = (neededPercentage / 100) * totalMaxPossibleMarks

      // Calculate how many more marks needed
      const additionalMarksNeeded = Math.max(0, targetTotalScore - subject.totalScoredMarks)

      // Calculate remaining marks available in future exams
      const remainingMarksAvailable = totalMaxPossibleMarks - subject.totalMaxMarks

      // Calculate minimum percentage needed in remaining exams
      const minPercentageInRemaining =
        remainingMarksAvailable > 0 && additionalMarksNeeded > 0
          ? Math.max(0, (additionalMarksNeeded / remainingMarksAvailable) * 100)
          : 0

      // Check if it's achievable (can't score more than 100% in any exam)
      const achievable = minPercentageInRemaining <= 100

      return {
        ...subject,
        neededPercentage,
        additionalMarksNeeded: Math.ceil(additionalMarksNeeded),
        minPercentageInRemaining: Math.ceil(minPercentageInRemaining),
        remainingExams,
        achievable,
        status: achievable ? "achievable" : "challenging",
      }
    })
  }

  const marksNeededData = calculateMarksNeeded()

  // Add new subject marks
  const addSubjectMarks = async (subject: SubjectMarks) => {
    if (!user) return

    try {
      const docRef = await addUserDocument(user, "marks", subject)
      setSubjectsMarks((prev) => [...prev, { ...subject, id: docRef.id }])
    } catch (error) {
      console.error("Error adding subject marks:", error)
    }
  }

  // Update subject marks
  const updateSubjectMarks = async (id: string, updatedData: Partial<SubjectMarks>) => {
    if (!user) return

    try {
      await updateUserDocument(user, "marks", id, updatedData)
      setSubjectsMarks((prev) => prev.map((subject) => (subject.id === id ? { ...subject, ...updatedData } : subject)))
    } catch (error) {
      console.error("Error updating subject marks:", error)
    }
  }

  // Add exam to subject
  const addExamToSubject = async (subjectId: string) => {
    if (!newExam.examName || newExam.scoredMarks < 0 || newExam.totalMarks <= 0) return

    const subject = subjectsMarks.find((s) => s.id === subjectId)
    if (!subject || !user) return

    const updatedExams = [...subject.exams, newExam]
    const totalScoredMarks = updatedExams.reduce((sum, exam) => sum + exam.scoredMarks, 0)
    const totalMaxMarks = updatedExams.reduce((sum, exam) => sum + exam.totalMarks, 0)
    const percentage = calculatePercentage(totalScoredMarks, totalMaxMarks)
    const gradePoint = calculateGradePoint(percentage)

    const updatedSubject = {
      ...subject,
      exams: updatedExams,
      totalScoredMarks,
      totalMaxMarks,
      percentage,
      gradePoint,
    }

    await updateSubjectMarks(subjectId, updatedSubject)

    // Record marks history
    await addMarksHistory(
      user,
      subjectId,
      subject.subjectName,
      newExam.examName,
      newExam.scoredMarks,
      newExam.totalMarks,
    )

    setNewExam({ examName: "", scoredMarks: 0, totalMarks: 0 })
    setSelectedSubject(null)

    // Trigger chart refresh
    setRefreshTrigger((prev) => prev + 1)
  }

  // Handle subject edit
  const handleEditSubject = async () => {
    if (!editingSubject || !editingSubject.id) return

    const { id, credits, maxExams } = editingSubject
    await updateSubjectMarks(id, { credits, maxExams })
    setEditingSubject(null)
  }

  // Delete exam from subject
  const deleteExam = async (subjectId: string, examIndex: number) => {
    const subject = subjectsMarks.find((s) => s.id === subjectId)
    if (!subject) return

    const updatedExams = subject.exams.filter((_, index) => index !== examIndex)
    const totalScoredMarks = updatedExams.reduce((sum, exam) => sum + exam.scoredMarks, 0)
    const totalMaxMarks = updatedExams.reduce((sum, exam) => sum + exam.totalMarks, 0)
    const percentage = calculatePercentage(totalScoredMarks, totalMaxMarks)
    const gradePoint = calculateGradePoint(percentage)

    const updatedSubject = {
      ...subject,
      exams: updatedExams,
      totalScoredMarks,
      totalMaxMarks,
      percentage,
      gradePoint,
    }

    await updateSubjectMarks(subjectId, updatedSubject)
  }

  // Update the handleGeneratePDF function
  const handleGeneratePDF = async () => {
    if (!user) return

    setIsGeneratingPDF(true)
    try {
      await generatePDFReport(user)
    } catch (error) {
      console.error("Error generating PDF:", error)
      alert("There was an error generating the PDF report. Please try again.")
    } finally {
      setIsGeneratingPDF(false)
    }
  }

  const handleOpenDeleteDialog = (subject: SubjectMarks) => {
    setSubjectToDelete(subject)
  }

  const handleConfirmDelete = async () => {
    if (!user || !subjectToDelete || !subjectToDelete.id) {
      toast.error("User not authenticated or subject data missing. Cannot delete.")
      return
    }
    setDeletingSubjectId(subjectToDelete.id)
    try {
      await deleteMarksHistoryForSubject(user, subjectToDelete.id)
      await deleteAttendanceHistoryForSubject(user, subjectToDelete.id)
      await deleteUserDocument(user, "marks", subjectToDelete.id)
      await deleteUserDocument(user, "subjects", subjectToDelete.id)

      setSubjectsMarks((prev) => prev.filter((s) => s.id !== subjectToDelete.id))
      toast.success(`Subject "${subjectToDelete.subjectName}" and all associated data deleted.`)
    } catch (error) {
      console.error("Error deleting subject:", error)
      toast.error(`Failed to delete subject "${subjectToDelete.subjectName}". Please try again.`)
    } finally {
      setDeletingSubjectId(null)
      setSubjectToDelete(null)
    }
  }

  return (
    <ProtectedRoute>
      <div className="full-width-container bg-gray-50 dark:bg-gray-900 amoled:bg-black min-h-screen transition-colors duration-300">
        <div className="w-full max-w-[400px] md:max-w-[768px] lg:max-w-[1024px] mx-auto p-4 md:p-6 lg:p-8 mobile-content-spacing md:pb-8 prevent-overflow">
          {/* Header */}
          <header className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200 dark:border-gray-700 amoled:border-gray-800">
            <div className="flex items-center min-w-0 flex-1">
              <Link href="/">
                <button className="relative inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900 amoled:bg-black amoled:border amoled:border-gray-800 text-primary-600 dark:text-primary-300 amoled:text-neon-blue hover:bg-primary-200 dark:hover:bg-primary-800 amoled:hover:bg-gray-900 transition-colors duration-200 shadow-sm mr-3 flex-shrink-0 amoled:neon-glow">
                  <span className="material-symbols-outlined">arrow_back</span>
                </button>
              </Link>
              <h1 className="text-xl md:text-2xl font-bold text-primary-600 dark:text-primary-400 amoled:text-neon-blue amoled:neon-text tracking-tight truncate">
                GradeIT
                <span className="ml-1 text-sm font-normal text-gray-500 dark:text-gray-400 amoled:text-neon-teal">
                  Marks
                </span>
              </h1>
            </div>

            <div className="flex items-center space-x-2 md:space-x-3 flex-shrink-0">
              <button
                className="relative inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900 amoled:bg-black amoled:border amoled:border-gray-800 text-primary-600 dark:text-primary-300 amoled:text-neon-blue hover:bg-primary-200 dark:hover:bg-primary-800 amoled:hover:bg-gray-900 transition-colors duration-200 shadow-sm amoled:neon-glow"
                onClick={handleGeneratePDF}
                disabled={isGeneratingPDF}
                title="Download PDF Report"
              >
                <span className="material-symbols-outlined text-lg">download</span>
              </button>

              <ThemeToggle />

              <UserProfile />
            </div>
          </header>

          {/* Main Content */}
          <main className="space-y-6 hide-scrollbar">
            {/* Marks Summary Section */}
            <section className="bg-white dark:bg-gray-800 amoled:bg-black amoled:border amoled:border-gray-800 amoled:neon-glow rounded-xl p-4 shadow-sm transition-transform duration-200 hover:shadow-md hover:-translate-y-1">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium amoled:text-neon-blue">Marks Summary</h2>
                <span
                  className={`text-2xl font-bold ${
                    Number(overallPercentage) >= 70
                      ? "text-green-600 dark:text-green-400 amoled:text-neon-green"
                      : Number(overallPercentage) >= 60
                        ? "text-amber-600 dark:text-amber-400 amoled:text-neon-orange"
                        : "text-red-600 dark:text-red-400 amoled:text-neon-red"
                  }`}
                >
                  {overallPercentage}%
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="bg-secondary/30 dark:bg-gray-700/30 amoled:bg-gray-900/30 amoled:border amoled:border-gray-800 p-4 rounded-xl">
                  <p className="text-sm text-gray-500 dark:text-gray-400 amoled:text-neon-teal">Marks Achieved</p>
                  <p className="text-2xl font-bold amoled:text-neon-blue">
                    {totalAchieved}{" "}
                    <span className="text-sm font-normal text-gray-500 dark:text-gray-400 amoled:text-neon-teal">
                      / {totalTaken}
                    </span>
                  </p>
                </div>
                <div className="bg-secondary/30 dark:bg-gray-700/30 amoled:bg-gray-900/30 amoled:border amoled:border-gray-800 p-4 rounded-xl">
                  <p className="text-sm text-gray-500 dark:text-gray-400 amoled:text-neon-teal">Total Possible</p>
                  <p className="text-2xl font-bold amoled:text-neon-blue">{totalPossible}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 amoled:text-neon-teal">
                    Progress: {progressPercentage}%
                  </p>
                </div>
                <div className="bg-secondary/30 dark:bg-gray-700/30 amoled:bg-gray-900/30 amoled:border amoled:border-gray-800 p-4 rounded-xl">
                  <p className="text-sm text-gray-500 dark:text-gray-400 amoled:text-neon-teal">Current GPA</p>
                  <p className="text-2xl font-bold amoled:text-neon-blue">{avgGPA}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 amoled:text-neon-teal">
                    {avgGPA >= 8 ? "On Target! 🎯" : "Below Target 📊"}
                  </p>
                </div>
              </div>

              <div className="w-full bg-gray-200 dark:bg-gray-700 amoled:bg-gray-800 rounded-full h-2.5 mb-2">
                <div
                  className="h-2.5 rounded-full bg-primary-600 dark:bg-primary-500 amoled:bg-neon-blue amoled:shadow-[0_0_10px_currentColor]"
                  style={{
                    width: `${Math.min(Number(progressPercentage), 100)}%`,
                  }}
                ></div>
              </div>

              <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400 amoled:text-neon-teal">
                <span>Overall Progress</span>
                <span>{progressPercentage}%</span>
              </div>
            </section>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <div
                className="flex flex-col items-center justify-center bg-white dark:bg-gray-800 amoled:bg-black amoled:border amoled:border-gray-800 rounded-xl p-4 shadow-sm transition-all duration-200 hover:shadow-md hover:bg-gray-50 dark:hover:bg-gray-700 amoled:hover:bg-gray-900 hover:-translate-y-1 group cursor-pointer amoled:neon-glow"
                onClick={handleGeneratePDF}
              >
                <span className="material-symbols-outlined text-2xl text-primary-500 amoled:text-neon-blue mb-2 group-hover:scale-110 transition-transform">
                  download
                </span>
                <span className="text-sm font-medium amoled:text-neon-teal">Download Report</span>
              </div>

              <div
                className="flex flex-col items-center justify-center bg-white dark:bg-gray-800 amoled:bg-black amoled:border amoled:border-gray-800 rounded-xl p-4 shadow-sm transition-all duration-200 hover:shadow-md hover:bg-gray-50 dark:hover:bg-gray-700 amoled:hover:bg-gray-900 hover:-translate-y-1 group cursor-pointer amoled:neon-glow"
                onClick={() => setShowVisualizations(true)}
              >
                <span className="material-symbols-outlined text-2xl text-primary-500 amoled:text-neon-blue mb-2 group-hover:scale-110 transition-transform">
                  insights
                </span>
                <span className="text-sm font-medium amoled:text-neon-teal">Visualize Progress</span>
              </div>

              <Sheet>
                <SheetTrigger asChild>
                  <div className="flex flex-col items-center justify-center bg-white dark:bg-gray-800 amoled:bg-black amoled:border amoled:border-gray-800 rounded-xl p-4 shadow-sm transition-all duration-200 hover:shadow-md hover:bg-gray-50 dark:hover:bg-gray-700 amoled:hover:bg-gray-900 hover:-translate-y-1 group cursor-pointer amoled:neon-glow">
                    <span className="material-symbols-outlined text-2xl text-primary-500 amoled:text-neon-blue mb-2 group-hover:scale-110 transition-transform">
                      add_circle
                    </span>
                    <span className="text-sm font-medium amoled:text-neon-teal">Add Subject</span>
                  </div>
                </SheetTrigger>
                <SheetContent className="amoled:bg-black amoled:border-gray-800">
                  <SheetHeader>
                    <SheetTitle className="font-sans amoled:text-neon-blue">Add New Subject</SheetTitle>
                    <SheetDescription className="amoled:text-neon-teal">
                      Enter the details of the new subject marks.
                    </SheetDescription>
                  </SheetHeader>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault()
                      const formData = new FormData(e.currentTarget)
                      const subjectName = formData.get("subjectName") as string
                      const credits = Number.parseInt(formData.get("credits") as string, 10)
                      const maxExams = Number.parseInt(formData.get("maxExams") as string, 10)

                      const newSubject: SubjectMarks = {
                        subjectName,
                        credits,
                        maxExams,
                        exams: [],
                        totalScoredMarks: 0,
                        totalMaxMarks: 0,
                        percentage: 0,
                        gradePoint: 0,
                      }

                      addSubjectMarks(newSubject)
                      e.currentTarget.reset()
                    }}
                    className="space-y-4 mt-4"
                  >
                    <div className="space-y-2">
                      <Label htmlFor="subjectName" className="amoled:text-neon-blue">
                        Subject Name
                      </Label>
                      <Input
                        id="subjectName"
                        name="subjectName"
                        required
                        className="amoled:bg-gray-900 amoled:border-gray-700 amoled:text-neon-blue"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="credits" className="amoled:text-neon-blue">
                        Credits
                      </Label>
                      <Input
                        id="credits"
                        name="credits"
                        type="number"
                        min="1"
                        max="5"
                        defaultValue="3"
                        required
                        className="amoled:bg-gray-900 amoled:border-gray-700 amoled:text-neon-blue"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 amoled:text-neon-teal">
                        Each credit equals {MARKS_PER_CREDIT} marks
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="maxExams" className="amoled:text-neon-blue">
                        Maximum Exams
                      </Label>
                      <Input
                        id="maxExams"
                        name="maxExams"
                        type="number"
                        min="1"
                        defaultValue="5"
                        required
                        className="amoled:bg-gray-900 amoled:border-gray-700 amoled:text-neon-blue"
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full amoled:bg-neon-blue amoled:text-black amoled:hover:bg-neon-teal"
                    >
                      Add Subject
                    </Button>
                  </form>
                </SheetContent>
              </Sheet>

              <div
                className="flex flex-col items-center justify-center bg-white dark:bg-gray-800 amoled:bg-black amoled:border amoled:border-gray-800 rounded-xl p-4 shadow-sm transition-all duration-200 hover:shadow-md hover:bg-gray-50 dark:hover:bg-gray-700 amoled:hover:bg-gray-900 hover:-translate-y-1 group cursor-pointer amoled:neon-glow"
                onClick={() => setShowSummary(!showSummary)}
              >
                <span className="material-symbols-outlined text-2xl text-primary-500 amoled:text-neon-blue mb-2 group-hover:scale-110 transition-transform">
                  analytics
                </span>
                <span className="text-sm font-medium amoled:text-neon-teal">Goal Analysis</span>
              </div>
            </div>

            {/* Goal Analysis Section */}
            {showSummary && (
              <details
                className="bg-white dark:bg-gray-800 amoled:bg-black amoled:border amoled:border-gray-800 rounded-xl overflow-hidden shadow-sm group transition-shadow duration-200 hover:shadow-md amoled:neon-glow"
                open
              >
                <summary className="flex justify-between items-center p-4 cursor-pointer">
                  <h2 className="text-lg font-medium amoled:text-neon-blue">Goal Analysis (Target GPA: 8.0)</h2>
                  <span className="material-symbols-outlined transition-transform duration-300 group-open:rotate-180 amoled:text-neon-teal">
                    expand_more
                  </span>
                </summary>

                <div className="p-4 pt-0 space-y-4 border-t border-gray-100 dark:border-gray-700 amoled:border-gray-800">
                  {marksNeededData.map((subject) => (
                    <div
                      key={subject.id}
                      className="border-b border-gray-100 dark:border-gray-700 amoled:border-gray-800 pb-3 last:border-0"
                    >
                      <div className="flex justify-between items-center">
                        <h3 className="font-medium amoled:text-neon-blue">{subject.subjectName}</h3>
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            subject.gradePoint >= 8
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 amoled:bg-green-900/30 amoled:text-neon-green amoled:border amoled:border-green-500/30"
                              : subject.achievable
                                ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 amoled:bg-yellow-900/30 amoled:text-neon-orange amoled:border amoled:border-yellow-500/30"
                                : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 amoled:bg-red-900/30 amoled:text-neon-red amoled:border amoled:border-red-500/30"
                          }`}
                        >
                          {subject.gradePoint >= 8 ? "On Target" : subject.achievable ? "Achievable" : "Challenging"}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
                        <div>
                          <p className="text-gray-500 dark:text-gray-400 amoled:text-neon-teal">Current</p>
                          <p className="amoled:text-neon-blue">
                            {subject.percentage}% (GPA: {subject.gradePoint})
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500 dark:text-gray-400 amoled:text-neon-teal">Target</p>
                          <p className="amoled:text-neon-blue">{subject.neededPercentage}% (GPA: 8.0)</p>
                        </div>
                        <div>
                          <p className="text-gray-500 dark:text-gray-400 amoled:text-neon-teal">Remaining Exams</p>
                          <p className="amoled:text-neon-blue">{subject.remainingExams}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 dark:text-gray-400 amoled:text-neon-teal">
                            {subject.gradePoint >= 8 ? "Min % to Maintain Goal" : "Min % in Next Exams"}
                          </p>
                          <p
                            className={
                              subject.gradePoint >= 8
                                ? "text-green-600 dark:text-green-400 amoled:text-neon-green"
                                : subject.minPercentageInRemaining > 100
                                  ? "text-red-600 dark:text-red-400 amoled:text-neon-red"
                                  : "text-amber-600 dark:text-amber-400 amoled:text-neon-orange"
                            }
                          >
                            {subject.minPercentageInRemaining}%
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}

                  <div className="mt-4 p-3 bg-primary-100 dark:bg-primary-900 amoled:bg-gray-900/30 amoled:border amoled:border-gray-800 rounded-lg">
                    <p className="text-sm font-medium amoled:text-neon-blue">Overall Assessment</p>
                    <p className="text-xs mt-1 amoled:text-neon-teal">
                      {avgGPA >= 8 ? (
                        "You're currently meeting your target GPA of 8.0. Keep up the good work!"
                      ) : (
                        <>
                          To reach a GPA of 8.0, focus on improving performance in subjects with lower grades,
                          particularly those with more remaining exams and higher credit values.
                        </>
                      )}
                    </p>
                  </div>
                </div>
              </details>
            )}

            {/* Visualization Sheet */}
            <Sheet open={showVisualizations} onOpenChange={setShowVisualizations}>
              <SheetContent
                side="bottom"
                className="h-[80vh] p-0 overflow-hidden flex flex-col amoled:bg-black amoled:border-gray-800"
              >
                <div className="p-4 border-b amoled:border-gray-800">
                  <SheetHeader className="text-left">
                    <SheetTitle className="font-sans amoled:text-neon-blue">Performance Visualization</SheetTitle>
                    <SheetDescription className="amoled:text-neon-teal">
                      Visual analysis of your academic performance
                    </SheetDescription>
                  </SheetHeader>
                </div>

                {/* Main scrollable content */}
                <div className="flex-1 overflow-y-auto p-4 hide-scrollbar">
                  {/* Summary Cards */}
                  <div className="grid grid-cols-3 gap-3 mb-6">
                    <div className="bg-white dark:bg-gray-800 amoled:bg-black amoled:border amoled:border-gray-800 shadow-sm rounded-lg p-3 text-center amoled:neon-glow">
                      <p className="text-xs text-gray-500 dark:text-gray-400 amoled:text-neon-teal mb-1">
                        Marks Achieved
                      </p>
                      <p className="text-xl font-bold amoled:text-neon-blue">{totalAchieved}</p>
                      <p className="text-xs amoled:text-neon-teal">{overallPercentage}% of attempted</p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 amoled:bg-black amoled:border amoled:border-gray-800 shadow-sm rounded-lg p-3 text-center amoled:neon-glow">
                      <p className="text-xs text-gray-500 dark:text-gray-400 amoled:text-neon-teal mb-1">
                        Total Possible
                      </p>
                      <p className="text-xl font-bold amoled:text-neon-blue">{totalPossible}</p>
                      <p className="text-xs amoled:text-neon-teal">{progressPercentage}% completed</p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 amoled:bg-black amoled:border amoled:border-gray-800 shadow-sm rounded-lg p-3 text-center amoled:neon-glow">
                      <p className="text-xs text-gray-500 dark:text-gray-400 amoled:text-neon-teal mb-1">Current GPA</p>
                      <p className="text-xl font-bold amoled:text-neon-blue">{avgGPA}</p>
                      <p className="text-xs amoled:text-neon-teal">{avgGPA >= 8 ? "On Target" : "Below Target"}</p>
                    </div>
                  </div>

                  {/* GPA Target Meter */}
                  <div className="bg-white dark:bg-gray-800 amoled:bg-black amoled:border amoled:border-gray-800 shadow-sm rounded-lg p-4 mb-6 amoled:neon-glow">
                    <h3 className="text-sm font-medium mb-2 amoled:text-neon-blue">GPA Progress</h3>
                    <div className="flex items-center mb-1">
                      <span className="text-xs mr-2 amoled:text-neon-teal">0</span>
                      <div className="flex-1 h-5 bg-gray-200 dark:bg-gray-700 amoled:bg-gray-800 rounded-md relative">
                        <div
                          className={`h-full rounded-l-md ${
                            avgGPA >= 8
                              ? "bg-green-500 amoled:bg-neon-green amoled:shadow-[0_0_10px_currentColor]"
                              : "bg-primary-600 dark:bg-primary-500 amoled:bg-neon-blue amoled:shadow-[0_0_10px_currentColor]"
                          }`}
                          style={{
                            width: `${Math.min((avgGPA / 10) * 100, 100)}%`,
                          }}
                        >
                          <span className="absolute text-[10px] text-white font-medium left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
                            {avgGPA} GPA
                          </span>
                        </div>
                        {/* Target marker */}
                        <div
                          className="absolute top-0 bottom-0 w-0.5 bg-red-500 amoled:bg-neon-red flex flex-col items-center"
                          style={{ left: `${(8 / 10) * 100}%` }}
                        >
                          <div className="absolute -top-4 transform -translate-x-1/2 bg-red-100 dark:bg-red-900 amoled:bg-red-900/30 amoled:border amoled:border-red-500/30 text-red-800 dark:text-red-200 amoled:text-neon-red text-[10px] px-1 rounded">
                            Target: 8.0
                          </div>
                        </div>
                      </div>
                      <span className="text-xs ml-2 amoled:text-neon-teal">10</span>
                    </div>
                  </div>

                  {/* Subject Performance */}
                  <div className="bg-white dark:bg-gray-800 amoled:bg-black amoled:border amoled:border-gray-800 shadow-sm rounded-lg p-4 mb-6 amoled:neon-glow">
                    <h3 className="text-sm font-medium mb-3 amoled:text-neon-blue">Subject Performance</h3>
                    <div className="space-y-3">
                      {subjectsMarks
                        .sort((a, b) => b.gradePoint - a.gradePoint)
                        .map((subject) => (
                          <div key={subject.id} className="flex items-center">
                            <div
                              className="w-24 truncate text-xs mr-2 amoled:text-neon-teal"
                              title={subject.subjectName}
                            >
                              {subject.subjectName}
                            </div>
                            <div className="flex-1">
                              <div className="flex justify-between text-xs mb-0.5">
                                <span className="amoled:text-neon-blue">{subject.percentage}%</span>
                                <span className="amoled:text-neon-blue">GPA: {subject.gradePoint}</span>
                              </div>
                              <div className="w-full bg-gray-200 dark:bg-gray-700 amoled:bg-gray-800 rounded-full h-2 overflow-hidden">
                                <div
                                  className={`h-2 rounded-full ${
                                    subject.gradePoint >= 8
                                      ? "bg-green-500 amoled:bg-neon-green amoled:shadow-[0_0_5px_currentColor]"
                                      : subject.gradePoint >= 7
                                        ? "bg-amber-500 amoled:bg-neon-orange amoled:shadow-[0_0_5px_currentColor]"
                                        : "bg-red-500 amoled:bg-neon-red amoled:shadow-[0_0_5px_currentColor]"
                                  }`}
                                  style={{
                                    width: `${Math.min(subject.percentage, 100)}%`,
                                  }}
                                ></div>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* Credits Distribution */}
                  <div className="bg-white dark:bg-gray-800 amoled:bg-black amoled:border amoled:border-gray-800 shadow-sm rounded-lg p-4 mb-6 amoled:neon-glow">
                    <h3 className="text-sm font-medium mb-3 amoled:text-neon-blue">Credits & Marks Distribution</h3>
                    <div className="flex flex-wrap gap-2">
                      {subjectsMarks.map((subject) => {
                        const totalPossible = subject.credits * MARKS_PER_CREDIT
                        const scored = subject.totalScoredMarks
                        const lost = subject.totalMaxMarks - subject.totalScoredMarks
                        const remaining = totalPossible - subject.totalMaxMarks

                        return (
                          <div key={subject.id} className="flex-1 min-w-[150px]">
                            <div className="flex justify-between text-xs mb-1">
                              <span className="font-medium truncate amoled: text-neon-blue" title={subject.subjectName}>
                                {subject.subjectName}
                              </span>
                              <span className="text-gray-500 dark:text-gray-400 amoled:text-neon-teal">
                                {subject.credits}cr
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 amoled:bg-gray-800 rounded-full h-3 overflow-hidden">
                              <div className="h-full flex">
                                {/* Scored marks */}
                                <div
                                  className="bg-green-500 amoled:bg-neon-green amoled:shadow-[0_0_5px_currentColor]"
                                  style={{
                                    width: `${(scored / totalPossible) * 100}%`,
                                  }}
                                  title={`Scored: ${scored}`}
                                ></div>
                                {/* Lost marks */}
                                <div
                                  className="bg-red-500 amoled:bg-neon-red amoled:shadow-[0_0_5px_currentColor]"
                                  style={{
                                    width: `${(lost / totalPossible) * 100}%`,
                                  }}
                                  title={`Lost: ${lost}`}
                                ></div>
                                {/* Remaining marks */}
                                <div
                                  className="bg-gray-400 amoled:bg-gray-600"
                                  style={{
                                    width: `${(remaining / totalPossible) * 100}%`,
                                  }}
                                  title={`Remaining: ${remaining}`}
                                ></div>
                              </div>
                            </div>
                            <div className="flex justify-between text-[10px] mt-1 text-gray-500 dark:text-gray-400 amoled:text-neon-teal">
                              <span>S:{scored}</span>
                              <span>L:{lost}</span>
                              <span>R:{remaining}</span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Quick Stats */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white dark:bg-gray-800 amoled:bg-black amoled:border amoled:border-gray-800 shadow-sm rounded-lg p-3 amoled:neon-glow">
                      <p className="text-xs text-gray-500 dark:text-gray-400 amoled:text-neon-teal mb-1">
                        Subjects Above Target
                      </p>
                      <p className="text-lg font-bold amoled:text-neon-blue">
                        {subjectsMarks.filter((s) => s.gradePoint >= 8).length}
                      </p>
                      <p className="text-xs amoled:text-neon-teal">
                        of {subjectsMarks.length} subjects (
                        {subjectsMarks.length > 0
                          ? Math.round(
                              (subjectsMarks.filter((s) => s.gradePoint >= 8).length / subjectsMarks.length) * 100,
                            )
                          : 0}
                        %)
                      </p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 amoled:bg-black amoled:border amoled:border-gray-800 shadow-sm rounded-lg p-3 amoled:neon-glow">
                      <p className="text-xs text-gray-500 dark:text-gray-400 amoled:text-neon-teal mb-1">
                        Total Credits
                      </p>
                      <p className="text-lg font-bold amoled:text-neon-blue">
                        {subjectsMarks.reduce((sum, s) => sum + s.credits, 0)}
                      </p>
                      <p className="text-xs amoled:text-neon-teal">
                        {subjectsMarks.reduce((sum, s) => sum + s.credits * MARKS_PER_CREDIT, 0)} total marks
                      </p>
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            {/* Subjects List */}
            <section className="space-y-4">
              <h2 className="text-lg font-medium amoled:text-neon-blue">Subjects</h2>
              {subjectsMarks.length === 0 ? (
                <div className="text-center py-8 bg-white dark:bg-gray-800 amoled:bg-black amoled:border amoled:border-gray-800 rounded-xl amoled:neon-glow">
                  <span className="material-symbols-outlined text-4xl text-gray-400 amoled:text-neon-teal mb-2">
                    school
                  </span>
                  <p className="text-gray-500 dark:text-gray-400 amoled:text-neon-teal">No subjects added yet</p>
                  <p className="text-sm text-gray-400 dark:text-gray-500 amoled:text-neon-teal">
                    Add your first subject to start tracking marks
                  </p>
                </div>
              ) : (
                subjectsMarks.map((subject) => {
                  const minMarksData = calculateMinimumMarksNeeded(subject)
                  return (
                    <div
                      key={subject.id}
                      className="bg-white dark:bg-gray-800 amoled:bg-black amoled:border amoled:border-gray-800 rounded-xl p-4 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-1 amoled:neon-glow"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-lg truncate amoled:text-neon-blue">{subject.subjectName}</h3>
                          <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400 amoled:text-neon-teal">
                            <span>{subject.credits} credits</span>
                            <span>
                              {subject.exams.length}/{subject.maxExams} exams
                            </span>
                            <span className="font-medium amoled:text-neon-blue">
                              {subject.percentage}% (GPA: {subject.gradePoint})
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2 ml-4">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <ShadButton
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 amoled:text-neon-blue amoled:hover:bg-gray-900"
                              >
                                <span className="material-symbols-outlined text-lg">more_vert</span>
                              </ShadButton>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              align="end"
                              className="amoled:bg-black amoled:border-gray-800 amoled:text-neon-blue"
                            >
                              <DropdownMenuItem
                                onClick={() => setEditingSubject(subject)}
                                className="amoled:hover:bg-gray-900 amoled:focus:bg-gray-900"
                              >
                                <span className="material-symbols-outlined text-sm mr-2">edit</span>
                                Edit Subject
                              </DropdownMenuItem>
                              <DropdownMenuSeparator className="amoled:bg-gray-800" />
                              <DropdownMenuItem
                                onClick={() => handleOpenDeleteDialog(subject)}
                                className="text-red-600 dark:text-red-400 amoled:text-neon-red amoled:hover:bg-gray-900 amoled:focus:bg-gray-900"
                              >
                                <span className="material-symbols-outlined text-sm mr-2">delete</span>
                                Delete Subject
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="mb-3">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="amoled:text-neon-teal">
                            Progress: {subject.totalScoredMarks}/{subject.credits * MARKS_PER_CREDIT}
                          </span>
                          <span className="amoled:text-neon-teal">
                            {((subject.totalScoredMarks / (subject.credits * MARKS_PER_CREDIT)) * 100).toFixed(1)}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 amoled:bg-gray-800 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              subject.gradePoint >= 8
                                ? "bg-green-500 amoled:bg-neon-green amoled:shadow-[0_0_10px_currentColor]"
                                : subject.gradePoint >= 7
                                  ? "bg-amber-500 amoled:bg-neon-orange amoled:shadow-[0_0_10px_currentColor]"
                                  : "bg-red-500 amoled:bg-neon-red amoled:shadow-[0_0_10px_currentColor]"
                            }`}
                            style={{
                              width: `${Math.min((subject.totalScoredMarks / (subject.credits * MARKS_PER_CREDIT)) * 100, 100)}%`,
                            }}
                          ></div>
                        </div>
                      </div>

                      {/* Goal Analysis */}
                      {minMarksData.minPercentage > 0 && (
                        <div className="mb-3 p-2 bg-secondary/30 dark:bg-gray-700/30 amoled:bg-gray-900/30 amoled:border amoled:border-gray-800 rounded-lg">
                          <p className="text-xs font-medium amoled:text-neon-blue">
                            To reach 70% (GPA 8.0): Need {minMarksData.minPercentage}% in remaining{" "}
                            {subject.maxExams - subject.exams.length} exam(s)
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 amoled:text-neon-teal">
                            Approximately {minMarksData.minMarks} marks per exam
                            {!minMarksData.achievable && " (May be challenging)"}
                          </p>
                        </div>
                      )}

                      {/* Exams List */}
                      {subject.exams.length > 0 && (
                        <div className="space-y-2 mb-3">
                          <h4 className="text-sm font-medium amoled:text-neon-blue">Exams:</h4>
                          {subject.exams.map((exam, index) => (
                            <div
                              key={index}
                              className="flex justify-between items-center p-2 bg-secondary/20 dark:bg-gray-700/20 amoled:bg-gray-900/20 amoled:border amoled:border-gray-800 rounded-lg"
                            >
                              <div>
                                <span className="text-sm font-medium amoled:text-neon-blue">{exam.examName}</span>
                                <span className="text-xs text-gray-500 dark:text-gray-400 amoled:text-neon-teal ml-2">
                                  {exam.scoredMarks}/{exam.totalMarks} (
                                  {((exam.scoredMarks / exam.totalMarks) * 100).toFixed(1)}%)
                                </span>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteExam(subject.id!, index)}
                                className="text-red-600 dark:text-red-400 amoled:text-neon-red hover:bg-red-100 dark:hover:bg-red-900 amoled:hover:bg-red-900/30 h-8 w-8 p-0"
                              >
                                <span className="material-symbols-outlined text-sm">delete</span>
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Add Exam Button */}
                      {subject.exams.length < subject.maxExams && (
                        <Sheet>
                          <SheetTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full amoled:border-gray-700 amoled:text-neon-blue amoled:hover:bg-gray-900 bg-transparent"
                              onClick={() => setSelectedSubject(subject.id!)}
                            >
                              <span className="material-symbols-outlined text-sm mr-2">add</span>
                              Add Exam
                            </Button>
                          </SheetTrigger>
                          <SheetContent className="amoled:bg-black amoled:border-gray-800">
                            <SheetHeader>
                              <SheetTitle className="font-sans amoled:text-neon-blue">
                                Add Exam - {subject.subjectName}
                              </SheetTitle>
                              <SheetDescription className="amoled:text-neon-teal">
                                Enter the exam details and marks scored.
                              </SheetDescription>
                            </SheetHeader>
                            <form
                              onSubmit={(e) => {
                                e.preventDefault()
                                addExamToSubject(subject.id!)
                              }}
                              className="space-y-4 mt-4"
                            >
                              <div className="space-y-2">
                                <Label htmlFor="examName" className="amoled:text-neon-blue">
                                  Exam Name
                                </Label>
                                <Input
                                  id="examName"
                                  value={newExam.examName}
                                  onChange={(e) => setNewExam({ ...newExam, examName: e.target.value })}
                                  placeholder="e.g., Mid-term, Quiz 1"
                                  required
                                  className="amoled:bg-gray-900 amoled:border-gray-700 amoled:text-neon-blue"
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label htmlFor="scoredMarks" className="amoled:text-neon-blue">
                                    Scored Marks
                                  </Label>
                                  <Input
                                    id="scoredMarks"
                                    type="number"
                                    min="0"
                                    value={newExam.scoredMarks}
                                    onChange={(e) =>
                                      setNewExam({ ...newExam, scoredMarks: Number.parseFloat(e.target.value) || 0 })
                                    }
                                    required
                                    className="amoled:bg-gray-900 amoled:border-gray-700 amoled:text-neon-blue"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="totalMarks" className="amoled:text-neon-blue">
                                    Total Marks
                                  </Label>
                                  <Input
                                    id="totalMarks"
                                    type="number"
                                    min="1"
                                    value={newExam.totalMarks}
                                    onChange={(e) =>
                                      setNewExam({ ...newExam, totalMarks: Number.parseFloat(e.target.value) || 0 })
                                    }
                                    required
                                    className="amoled:bg-gray-900 amoled:border-gray-700 amoled:text-neon-blue"
                                  />
                                </div>
                              </div>
                              <Button
                                type="submit"
                                className="w-full amoled:bg-neon-blue amoled:text-black amoled:hover:bg-neon-teal"
                              >
                                Add Exam
                              </Button>
                            </form>
                          </SheetContent>
                        </Sheet>
                      )}
                    </div>
                  )
                })
              )}
            </section>
          </main>

          {/* Edit Subject Sheet */}
          <Sheet open={!!editingSubject} onOpenChange={() => setEditingSubject(null)}>
            <SheetContent className="amoled:bg-black amoled:border-gray-800">
              <SheetHeader>
                <SheetTitle className="font-sans amoled:text-neon-blue">Edit Subject</SheetTitle>
                <SheetDescription className="amoled:text-neon-teal">
                  Update the subject details. Note: Changing credits will affect total possible marks.
                </SheetDescription>
              </SheetHeader>
              {editingSubject && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    handleEditSubject()
                  }}
                  className="space-y-4 mt-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="editSubjectName" className="amoled:text-neon-blue">
                      Subject Name
                    </Label>
                    <Input
                      id="editSubjectName"
                      value={editingSubject.subjectName}
                      disabled
                      className="amoled:bg-gray-900 amoled:border-gray-700 amoled:text-neon-blue opacity-50"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 amoled:text-neon-teal">
                      Subject name cannot be changed
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="editCredits" className="amoled:text-neon-blue">
                      Credits
                    </Label>
                    <Input
                      id="editCredits"
                      type="number"
                      min="1"
                      max="5"
                      value={editingSubject.credits}
                      onChange={(e) =>
                        setEditingSubject({ ...editingSubject, credits: Number.parseInt(e.target.value, 10) || 1 })
                      }
                      required
                      className="amoled:bg-gray-900 amoled:border-gray-700 amoled:text-neon-blue"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 amoled:text-neon-teal">
                      Each credit equals {MARKS_PER_CREDIT} marks
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="editMaxExams" className="amoled:text-neon-blue">
                      Maximum Exams
                    </Label>
                    <Input
                      id="editMaxExams"
                      type="number"
                      min={editingSubject.exams.length}
                      value={editingSubject.maxExams}
                      onChange={(e) =>
                        setEditingSubject({ ...editingSubject, maxExams: Number.parseInt(e.target.value, 10) || 1 })
                      }
                      required
                      className="amoled:bg-gray-900 amoled:border-gray-700 amoled:text-neon-blue"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 amoled:text-neon-teal">
                      Cannot be less than current exams ({editingSubject.exams.length})
                    </p>
                  </div>
                  <Button
                    type="submit"
                    className="w-full amoled:bg-neon-blue amoled:text-black amoled:hover:bg-neon-teal"
                  >
                    Update Subject
                  </Button>
                </form>
              )}
            </SheetContent>
          </Sheet>

          {/* Delete Confirmation Dialog */}
          <AlertDialog open={!!subjectToDelete} onOpenChange={() => setSubjectToDelete(null)}>
            <AlertDialogContent className="amoled:bg-black amoled:border-gray-800">
              <AlertDialogHeader>
                <AlertDialogTitle className="amoled:text-neon-blue">Delete Subject</AlertDialogTitle>
                <AlertDialogDescription className="amoled:text-neon-teal">
                  Are you sure you want to delete "{subjectToDelete?.subjectName}"? This will permanently remove:
                  <br />
                  <br />• All exam records for this subject
                  <br />• All attendance records for this subject
                  <br />• All historical data and trends
                  <br />
                  <br />
                  This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="amoled:border-gray-700 amoled:text-neon-blue amoled:hover:bg-gray-900">
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleConfirmDelete}
                  disabled={!!deletingSubjectId}
                  className="bg-red-600 hover:bg-red-700 amoled:bg-neon-red amoled:text-black amoled:hover:bg-red-400"
                >
                  {deletingSubjectId ? "Deleting..." : "Delete Subject"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
      <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 py-2 px-6 border-t border-gray-200 dark:border-gray-700 md:hidden z-10 bottom-nav-safe"></nav>
    </ProtectedRoute>
  )
}

export default MarksPage

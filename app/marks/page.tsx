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

// Add imports for authentication
import ProtectedRoute from "../components/protected-route"
import UserProfile from "../components/user-profile"
import { useAuth } from "../contexts/auth-context"
import { getUserDocuments, addUserDocument, updateUserDocument, addMarksHistory } from "../utils/user-data"

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
  const [newExam, setNewExam] = useState<Exam>({ examName: "", scoredMarks: 0, totalMarks: 0 })
  const [editingSubject, setEditingSubject] = useState<SubjectMarks | null>(null)
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
  const { theme, setTheme } = useTheme()
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  // Fetch subjects marks data
  // Update the fetchSubjectsMarks function to use user-specific data
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

    return { totalAchieved, totalTaken, totalPossible, overallPercentage, progressPercentage }
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
  // Update the addSubjectMarks function to use user-specific data
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
  // Update the updateSubjectMarks function to use user-specific data
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

  // Update the header section to include UserProfile (replace the existing header)
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
              <span className="ml-1 text-sm font-normal text-gray-500 dark:text-gray-400">Marks</span>
            </h1>
          </div>

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

        {/* Main Content */}
        <main className="space-y-6">
          {/* Marks Summary Section */}
          <section className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm transition-transform duration-200 hover:shadow-md hover:-translate-y-1">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium">Marks Summary</h2>
              <span
                className={`text-2xl font-bold ${
                  Number(overallPercentage) >= 70
                    ? "text-green-600 dark:text-green-400"
                    : Number(overallPercentage) >= 60
                      ? "text-amber-600 dark:text-amber-400"
                      : "text-red-600 dark:text-red-400"
                }`}
              >
                {overallPercentage}%
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="bg-secondary/30 dark:bg-gray-700/30 p-4 rounded-xl">
                <p className="text-sm text-gray-500 dark:text-gray-400">Marks Achieved</p>
                <p className="text-2xl font-bold">
                  {totalAchieved}{" "}
                  <span className="text-sm font-normal text-gray-500 dark:text-gray-400">/ {totalTaken}</span>
                </p>
              </div>
              <div className="bg-secondary/30 dark:bg-gray-700/30 p-4 rounded-xl">
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Possible</p>
                <p className="text-2xl font-bold">{totalPossible}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Progress: {progressPercentage}%</p>
              </div>
              <div className="bg-secondary/30 dark:bg-gray-700/30 p-4 rounded-xl">
                <p className="text-sm text-gray-500 dark:text-gray-400">Current GPA</p>
                <p className="text-2xl font-bold">{avgGPA}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {avgGPA >= 8 ? "On Target! 🎯" : "Below Target 📊"}
                </p>
              </div>
            </div>

            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mb-2">
              <div
                className="h-2.5 rounded-full bg-primary-600 dark:bg-primary-500"
                style={{ width: `${Math.min(Number(progressPercentage), 100)}%` }}
              ></div>
            </div>

            <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
              <span>Overall Progress</span>
              <span>{progressPercentage}%</span>
            </div>
          </section>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div
              className="flex flex-col items-center justify-center bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm transition-all duration-200 hover:shadow-md hover:bg-gray-50 dark:hover:bg-gray-700 hover:-translate-y-1 group"
              onClick={handleGeneratePDF}
            >
              <span className="material-symbols-outlined text-2xl text-primary-500 mb-2 group-hover:scale-110 transition-transform">
                download
              </span>
              <span className="text-sm font-medium">Download Report</span>
            </div>

            <div
              className="flex flex-col items-center justify-center bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm transition-all duration-200 hover:shadow-md hover:bg-gray-50 dark:hover:bg-gray-700 hover:-translate-y-1 group"
              onClick={() => setShowVisualizations(true)}
            >
              <span className="material-symbols-outlined text-2xl text-primary-500 mb-2 group-hover:scale-110 transition-transform">
                insights
              </span>
              <span className="text-sm font-medium">Visualize Progress</span>
            </div>

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
                  <SheetDescription>Enter the details of the new subject marks.</SheetDescription>
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
                    <Label htmlFor="subjectName">Subject Name</Label>
                    <Input id="subjectName" name="subjectName" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="credits">Credits</Label>
                    <Input id="credits" name="credits" type="number" min="1" max="5" defaultValue="3" required />
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Each credit equals {MARKS_PER_CREDIT} marks
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxExams">Maximum Exams</Label>
                    <Input id="maxExams" name="maxExams" type="number" min="1" defaultValue="5" required />
                  </div>
                  <Button type="submit" className="w-full">
                    Add Subject
                  </Button>
                </form>
              </SheetContent>
            </Sheet>

            <div
              className="flex flex-col items-center justify-center bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm transition-all duration-200 hover:shadow-md hover:bg-gray-50 dark:hover:bg-gray-700 hover:-translate-y-1 group"
              onClick={() => setShowSummary(!showSummary)}
            >
              <span className="material-symbols-outlined text-2xl text-primary-500 mb-2 group-hover:scale-110 transition-transform">
                analytics
              </span>
              <span className="text-sm font-medium">Goal Analysis</span>
            </div>
          </div>

          {/* Goal Analysis Section */}
          {showSummary && (
            <details
              className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm group transition-shadow duration-200 hover:shadow-md"
              open
            >
              <summary className="flex justify-between items-center p-4 cursor-pointer">
                <h2 className="text-lg font-medium">Goal Analysis (Target GPA: 8.0)</h2>
                <span className="material-symbols-outlined transition-transform duration-300 group-open:rotate-180">
                  expand_more
                </span>
              </summary>

              <div className="p-4 pt-0 space-y-4 border-t border-gray-100 dark:border-gray-700">
                {marksNeededData.map((subject) => (
                  <div key={subject.id} className="border-b border-gray-100 dark:border-gray-700 pb-3 last:border-0">
                    <div className="flex justify-between items-center">
                      <h3 className="font-medium">{subject.subjectName}</h3>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          subject.gradePoint >= 8
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                            : subject.achievable
                              ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                              : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                        }`}
                      >
                        {subject.gradePoint >= 8 ? "On Target" : subject.achievable ? "Achievable" : "Challenging"}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
                      <div>
                        <p className="text-gray-500 dark:text-gray-400">Current</p>
                        <p>
                          {subject.percentage}% (GPA: {subject.gradePoint})
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500 dark:text-gray-400">Target</p>
                        <p>{subject.neededPercentage}% (GPA: 8.0)</p>
                      </div>
                      <div>
                        <p className="text-gray-500 dark:text-gray-400">Remaining Exams</p>
                        <p>{subject.remainingExams}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 dark:text-gray-400">
                          {subject.gradePoint >= 8 ? "Min % to Maintain Goal" : "Min % in Next Exams"}
                        </p>
                        <p
                          className={
                            subject.gradePoint >= 8
                              ? "text-green-600 dark:text-green-400"
                              : subject.minPercentageInRemaining > 100
                                ? "text-red-600 dark:text-red-400"
                                : "text-amber-600 dark:text-amber-400"
                          }
                        >
                          {subject.minPercentageInRemaining}%
                        </p>
                      </div>
                    </div>
                  </div>
                ))}

                <div className="mt-4 p-3 bg-primary-100 dark:bg-primary-900 rounded-lg">
                  <p className="text-sm font-medium">Overall Assessment</p>
                  <p className="text-xs mt-1">
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
            <SheetContent side="bottom" className="h-[80vh] p-0 overflow-hidden flex flex-col">
              <div className="p-4 border-b">
                <SheetHeader className="text-left">
                  <SheetTitle className="font-sans">Performance Visualization</SheetTitle>
                  <SheetDescription>Visual analysis of your academic performance</SheetDescription>
                </SheetHeader>
              </div>

              {/* Main scrollable content */}
              <div className="flex-1 overflow-y-auto p-4">
                {/* Summary Cards */}
                <div className="grid grid-cols-3 gap-3 mb-6">
                  <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-3 text-center">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Marks Achieved</p>
                    <p className="text-xl font-bold">{totalAchieved}</p>
                    <p className="text-xs">{overallPercentage}% of attempted</p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-3 text-center">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total Possible</p>
                    <p className="text-xl font-bold">{totalPossible}</p>
                    <p className="text-xs">{progressPercentage}% completed</p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-3 text-center">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Current GPA</p>
                    <p className="text-xl font-bold">{avgGPA}</p>
                    <p className="text-xs">{avgGPA >= 8 ? "On Target" : "Below Target"}</p>
                  </div>
                </div>

                {/* GPA Target Meter */}
                <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-4 mb-6">
                  <h3 className="text-sm font-medium mb-2">GPA Progress</h3>
                  <div className="flex items-center mb-1">
                    <span className="text-xs mr-2">0</span>
                    <div className="flex-1 h-5 bg-gray-200 dark:bg-gray-700 rounded-md relative">
                      <div
                        className={`h-full rounded-l-md ${avgGPA >= 8 ? "bg-green-500" : "bg-primary-600 dark:bg-primary-500"}`}
                        style={{ width: `${Math.min((avgGPA / 10) * 100, 100)}%` }}
                      >
                        <span className="absolute text-[10px] text-white font-medium left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
                          {avgGPA} GPA
                        </span>
                      </div>
                      {/* Target marker */}
                      <div
                        className="absolute top-0 bottom-0 w-0.5 bg-red-500 flex flex-col items-center"
                        style={{ left: `${(8 / 10) * 100}%` }}
                      >
                        <div className="absolute -top-4 transform -translate-x-1/2 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 text-[10px] px-1 rounded">
                          Target: 8.0
                        </div>
                      </div>
                    </div>
                    <span className="text-xs ml-2">10</span>
                  </div>
                </div>

                {/* Subject Performance */}
                <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-4 mb-6">
                  <h3 className="text-sm font-medium mb-3">Subject Performance</h3>
                  <div className="space-y-3">
                    {subjectsMarks
                      .sort((a, b) => b.gradePoint - a.gradePoint)
                      .map((subject) => (
                        <div key={subject.id} className="flex items-center">
                          <div className="w-24 truncate text-xs mr-2" title={subject.subjectName}>
                            {subject.subjectName}
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between text-xs mb-0.5">
                              <span>{subject.percentage}%</span>
                              <span>GPA: {subject.gradePoint}</span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                              <div
                                className={`h-2 rounded-full ${
                                  subject.gradePoint >= 8
                                    ? "bg-green-500"
                                    : subject.gradePoint >= 7
                                      ? "bg-amber-500"
                                      : "bg-red-500"
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
                <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-4 mb-6">
                  <h3 className="text-sm font-medium mb-3">Credits & Marks Distribution</h3>
                  <div className="flex flex-wrap gap-2">
                    {subjectsMarks.map((subject) => {
                      const totalPossible = subject.credits * MARKS_PER_CREDIT
                      const scored = subject.totalScoredMarks
                      const lost = subject.totalMaxMarks - subject.totalScoredMarks
                      const remaining = totalPossible - subject.totalMaxMarks

                      return (
                        <div key={subject.id} className="flex-1 min-w-[150px]">
                          <div className="flex justify-between text-xs mb-1">
                            <span className="font-medium truncate" title={subject.subjectName}>
                              {subject.subjectName}
                            </span>
                            <span>{subject.credits} cr</span>
                          </div>
                          <div className="w-full h-4 rounded-md overflow-hidden flex mb-1">
                            <div
                              className="bg-green-500 h-full"
                              style={{ width: `${(scored / totalPossible) * 100}%` }}
                              title={`Scored: ${scored} marks`}
                            ></div>
                            <div
                              className="bg-red-500 h-full"
                              style={{ width: `${(lost / totalPossible) * 100}%` }}
                              title={`Lost: ${lost} marks`}
                            ></div>
                            <div
                              className="bg-gray-300 dark:bg-gray-700 h-full"
                              style={{ width: `${(remaining / totalPossible) * 100}%` }}
                              title={`Remaining: ${remaining} marks`}
                            ></div>
                          </div>
                          <div className="text-[10px] text-gray-500 dark:text-gray-400">
                            {scored}/{totalPossible} marks ({Math.round((scored / totalPossible) * 100)}%)
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  <div className="mt-3 flex justify-start space-x-4 text-xs">
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                      <span>Scored</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-red-500 rounded-full mr-1"></div>
                      <span>Lost</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-gray-300 dark:bg-gray-700 rounded-full mr-1"></div>
                      <span>Remaining</span>
                    </div>
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>

          {/* Subject Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {subjectsMarks.map((subject) => {
              const goalPercentage = 70 // For GPA 8.0
              const remainingExams = subject.maxExams - subject.exams.length
              const { minPercentage, minMarks, marksPerExam, achievable } = calculateMinimumMarksNeeded(
                subject,
                goalPercentage,
              )
              const totalMaxPossibleMarks = subject.credits * MARKS_PER_CREDIT

              // Generate a gradient color based on the subject name for visual variety
              const colors = [
                "from-primary-500/90 to-indigo-600/90",
                "from-amber-500 to-orange-600",
                "from-emerald-500/90 to-teal-600/90",
                "from-blue-500/90 to-cyan-600/90",
                "from-purple-500/90 to-pink-600/90",
                "from-red-500/90 to-rose-600/90",
              ]
              const colorIndex = subject.subjectName.length % colors.length
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
                      <h3 className="font-bold">{subject.subjectName}</h3>
                      <span className="bg-white/20 px-2 py-1 rounded-full text-xs backdrop-blur-sm">
                        {subject.credits} Credits
                      </span>
                    </div>
                    <div className="text-sm">
                      <p>GPA: {subject.gradePoint}</p>
                      <p className="opacity-80">
                        {subject.exams.length}/{subject.maxExams} Exams
                      </p>
                    </div>
                  </div>

                  <div className="p-4">
                    <div className="flex justify-between mb-3">
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Current</p>
                        <p
                          className={`text-xl font-bold ${
                            subject.gradePoint >= 8
                              ? "text-green-600 dark:text-green-400"
                              : subject.gradePoint >= 7
                                ? "text-amber-600 dark:text-amber-400"
                                : "text-red-600 dark:text-red-400"
                          }`}
                        >
                          {subject.percentage}%
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500 dark:text-gray-400">Progress</p>
                        <p className="text-xl font-bold text-primary-600 dark:text-primary-400">
                          {Math.floor((subject.totalScoredMarks / totalMaxPossibleMarks) * 100)}%
                        </p>
                      </div>
                    </div>

                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-4 overflow-hidden">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${
                          subject.gradePoint >= 8
                            ? "bg-green-500"
                            : subject.gradePoint >= 7
                              ? "bg-amber-500"
                              : "bg-red-500"
                        }`}
                        style={{
                          width: `${Math.min(subject.percentage, 100)}%`,
                        }}
                      ></div>
                    </div>

                    {/* Exams List */}
                    {subject.exams.length > 0 ? (
                      <div className="space-y-2 mb-4">
                        <p className="text-sm font-medium">Exams</p>
                        <div className="max-h-40 overflow-y-auto space-y-2">
                          {subject.exams.map((exam, index) => (
                            <div
                              key={index}
                              className="flex justify-between items-center p-2 bg-gray-100 dark:bg-gray-700/30 rounded-lg text-xs"
                            >
                              <div>
                                <p className="font-medium">{exam.examName}</p>
                                <p>
                                  {exam.scoredMarks}/{exam.totalMarks} (
                                  {calculatePercentage(exam.scoredMarks, exam.totalMarks)}%)
                                </p>
                              </div>
                              <button
                                className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-200/50 dark:bg-gray-600/50 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                onClick={() => deleteExam(subject.id!, index)}
                              >
                                <span className="material-symbols-outlined text-sm">delete</span>
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">No exams added yet</p>
                    )}

                    {/* Add Exam Button */}
                    {subject.exams.length < subject.maxExams && (
                      <div>
                        {selectedSubject === subject.id ? (
                          <div className="space-y-2">
                            <div className="grid grid-cols-3 gap-2">
                              <Input
                                placeholder="Exam Name"
                                value={newExam.examName}
                                onChange={(e) => setNewExam({ ...newExam, examName: e.target.value })}
                                className="col-span-3"
                              />
                              <Input
                                type="number"
                                placeholder="Scored"
                                value={newExam.scoredMarks}
                                onChange={(e) =>
                                  setNewExam({ ...newExam, scoredMarks: Number.parseInt(e.target.value, 10) || 0 })
                                }
                              />
                              <Input
                                type="number"
                                placeholder="Total"
                                value={newExam.totalMarks}
                                onChange={(e) =>
                                  setNewExam({ ...newExam, totalMarks: Number.parseInt(e.target.value, 10) || 0 })
                                }
                              />
                              <Button
                                onClick={() => addExamToSubject(subject.id!)}
                                disabled={!newExam.examName || newExam.totalMarks <= 0}
                                className="bg-primary-600 hover:bg-primary-700 text-white"
                              >
                                Add
                              </Button>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full"
                              onClick={() => setSelectedSubject(null)}
                            >
                              Cancel
                            </Button>
                          </div>
                        ) : (
                          <Button
                            className="w-full flex items-center justify-center bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-300 hover:bg-primary-200 dark:hover:bg-primary-800 transition-colors"
                            onClick={() => setSelectedSubject(subject.id!)}
                          >
                            <span className="material-symbols-outlined text-sm mr-2">add</span>
                            Add Exam
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Add Subject Button (for empty state) */}
          {subjectsMarks.length === 0 && (
            <Sheet>
              <SheetTrigger asChild>
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm text-center cursor-pointer hover:shadow-md transition-shadow">
                  <span className="material-symbols-outlined text-4xl text-primary-500 mb-2">add_circle</span>
                  <h3 className="text-lg font-medium">Add Your First Subject</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    Start tracking your marks by adding a subject
                  </p>
                </div>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle className="font-sans">Add New Subject</SheetTitle>
                  <SheetDescription>Enter the details of the new subject marks.</SheetDescription>
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
                    <Label htmlFor="subjectName">Subject Name</Label>
                    <Input id="subjectName" name="subjectName" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="credits">Credits</Label>
                    <Input id="credits" name="credits" type="number" min="1" max="5" defaultValue="3" required />
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Each credit equals {MARKS_PER_CREDIT} marks
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxExams">Maximum Exams</Label>
                    <Input id="maxExams" name="maxExams" type="number" min="1" defaultValue="5" required />
                  </div>
                  <Button type="submit" className="w-full">
                    Add Subject
                  </Button>
                </form>
              </SheetContent>
            </Sheet>
          )}
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

            <div className="flex flex-col items-center text-primary-600 dark:text-primary-400">
              <span className="material-symbols-outlined">grade</span>
              <span className="text-xs mt-1">Marks</span>
            </div>

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
                  <SheetDescription>Enter the details of the new subject marks.</SheetDescription>
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
                    <Label htmlFor="subjectName">Subject Name</Label>
                    <Input id="subjectName" name="subjectName" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="credits">Credits</Label>
                    <Input id="credits" name="credits" type="number" min="1" max="5" defaultValue="3" required />
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Each credit equals {MARKS_PER_CREDIT} marks
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxExams">Maximum Exams</Label>
                    <Input id="maxExams" name="maxExams" type="number" min="1" defaultValue="5" required />
                  </div>
                  <Button type="submit" className="w-full">
                    Add Subject
                  </Button>
                </form>
              </SheetContent>
            </Sheet>

            <Link href="/trends">
              <div className="flex flex-col items-center text-gray-600 dark:text-gray-400">
                <span className="material-symbols-outlined">insights</span>
                <span className="text-xs mt-1">Visualize</span>
              </div>
            </Link>
          </div>
        </nav>
      </div>
    </ProtectedRoute>
  )
}

export default MarksPage

import jsPDF from "jspdf"

// Define types
interface SubjectAttendance {
  id: string
  name: string
  attended: number
  happened: number
  goal: number
  customGoalPercentage: number | null
}

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

export const generatePDFReport = async (
  attendanceData: SubjectAttendance[],
  marksData: SubjectMarks[],
  overallAttendance: { currentPercentage: string; requiredClasses: number },
  marksSummary: {
    totalAchieved: number
    totalTaken: number
    totalPossible: number
    overallPercentage: string
    progressPercentage: string
  },
  averages: { avgPercentage: number; avgGPA: number },
) => {
  // Create a new PDF document
  const pdf = new jsPDF("p", "mm", "a4")
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const margin = 15
  let yPos = margin

  // Add header
  pdf.setFontSize(22)
  pdf.setTextColor(44, 62, 80)
  pdf.text("GradeIT - Academic Report", pageWidth / 2, yPos, { align: "center" })
  yPos += 10

  // Add date
  pdf.setFontSize(10)
  pdf.setTextColor(100, 100, 100)
  const today = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
  pdf.text(`Generated on: ${today}`, pageWidth / 2, yPos, { align: "center" })
  yPos += 15

  // Add summary section
  pdf.setFillColor(240, 240, 240)
  pdf.rect(margin, yPos, pageWidth - 2 * margin, 35, "F")
  yPos += 5

  pdf.setFontSize(14)
  pdf.setTextColor(44, 62, 80)
  pdf.text("Academic Summary", pageWidth / 2, yPos, { align: "center" })
  yPos += 8

  // Summary data
  pdf.setFontSize(10)
  pdf.setTextColor(60, 60, 60)

  // Left column
  pdf.text(`Overall Attendance: ${overallAttendance.currentPercentage}%`, margin + 5, yPos)
  yPos += 5
  pdf.text(`Classes Needed for 75%: ${overallAttendance.requiredClasses}`, margin + 5, yPos)

  // Right column
  pdf.text(`Current GPA: ${averages.avgGPA.toFixed(2)}`, pageWidth - margin - 60, yPos - 5)
  pdf.text(`Overall Percentage: ${averages.avgPercentage.toFixed(1)}%`, pageWidth - margin - 60, yPos)

  yPos += 10

  // Progress bars
  pdf.setDrawColor(200, 200, 200)
  pdf.setFillColor(120, 120, 120)

  // Attendance progress bar
  pdf.text("Attendance Progress:", margin + 5, yPos + 5)
  pdf.rect(margin + 45, yPos + 2, 60, 4, "S")
  const attendanceWidth = Math.min((Number.parseFloat(overallAttendance.currentPercentage) / 100) * 60, 60)
  pdf.setFillColor(Number.parseFloat(overallAttendance.currentPercentage) >= 75 ? 46 : 231, 204, 76)
  pdf.rect(margin + 45, yPos + 2, attendanceWidth, 4, "F")

  // GPA progress bar
  pdf.text("GPA Progress:", pageWidth - margin - 60, yPos + 5)
  pdf.rect(pageWidth - margin - 30, yPos + 2, 30, 4, "S")
  const gpaWidth = Math.min((averages.avgGPA / 10) * 30, 30)
  pdf.setFillColor(averages.avgGPA >= 8 ? 46 : 231, averages.avgGPA >= 8 ? 204 : 76, averages.avgGPA >= 8 ? 113 : 60)
  pdf.rect(pageWidth - margin - 30, yPos + 2, gpaWidth, 4, "F")

  yPos += 15

  // Marks section
  pdf.setFontSize(14)
  pdf.setTextColor(44, 62, 80)
  pdf.text("Marks Analysis", pageWidth / 2, yPos, { align: "center" })
  yPos += 8

  // Marks summary
  pdf.setFontSize(10)
  pdf.setTextColor(60, 60, 60)
  pdf.text(`Total Marks Achieved: ${marksSummary.totalAchieved} / ${marksSummary.totalTaken}`, margin + 5, yPos)
  pdf.text(`Total Possible Marks: ${marksSummary.totalPossible}`, pageWidth - margin - 60, yPos)
  yPos += 5
  pdf.text(`Overall Percentage: ${marksSummary.overallPercentage}%`, margin + 5, yPos)
  pdf.text(`Progress: ${marksSummary.progressPercentage}%`, pageWidth - margin - 60, yPos)
  yPos += 10

  // Subject marks table
  pdf.setFillColor(230, 230, 230)
  pdf.rect(margin, yPos, pageWidth - 2 * margin, 8, "F")

  // Table header
  pdf.setFontSize(9)
  pdf.setTextColor(40, 40, 40)
  pdf.text("Subject", margin + 5, yPos + 5)
  pdf.text("Credits", margin + 60, yPos + 5)
  pdf.text("Marks", margin + 80, yPos + 5)
  pdf.text("Percentage", margin + 105, yPos + 5)
  pdf.text("GPA", margin + 135, yPos + 5)
  pdf.text("Status", margin + 155, yPos + 5)

  yPos += 8

  // Table rows
  pdf.setFontSize(8)
  pdf.setTextColor(60, 60, 60)

  marksData.forEach((subject, index) => {
    if (yPos > pageHeight - 30) {
      // Add new page if we're near the bottom
      pdf.addPage()
      yPos = margin
    }

    // Alternate row background
    if (index % 2 === 0) {
      pdf.setFillColor(245, 245, 245)
      pdf.rect(margin, yPos, pageWidth - 2 * margin, 7, "F")
    }

    // Subject data
    pdf.text(subject.subjectName.substring(0, 25), margin + 5, yPos + 5)
    pdf.text(subject.credits.toString(), margin + 60, yPos + 5)
    pdf.text(`${subject.totalScoredMarks}/${subject.credits * 25}`, margin + 80, yPos + 5)
    pdf.text(`${subject.percentage.toFixed(1)}%`, margin + 105, yPos + 5)
    pdf.text(subject.gradePoint.toString(), margin + 135, yPos + 5)

    // Status with color
    const status = subject.gradePoint >= 8 ? "Good" : subject.gradePoint >= 7 ? "Average" : "Needs Work"
    pdf.setTextColor(
      subject.gradePoint >= 8 ? 46 : subject.gradePoint >= 7 ? 230 : 231,
      subject.gradePoint >= 8 ? 204 : subject.gradePoint >= 7 ? 126 : 76,
      subject.gradePoint >= 8 ? 113 : subject.gradePoint >= 7 ? 34 : 60,
    )
    pdf.text(status, margin + 155, yPos + 5)
    pdf.setTextColor(60, 60, 60)

    yPos += 7
  })

  yPos += 10

  // Attendance section
  if (yPos > pageHeight - 50) {
    // Add new page if we're near the bottom
    pdf.addPage()
    yPos = margin
  }

  pdf.setFontSize(14)
  pdf.setTextColor(44, 62, 80)
  pdf.text("Attendance Analysis", pageWidth / 2, yPos, { align: "center" })
  yPos += 8

  // Attendance table
  pdf.setFillColor(230, 230, 230)
  pdf.rect(margin, yPos, pageWidth - 2 * margin, 8, "F")

  // Table header
  pdf.setFontSize(9)
  pdf.setTextColor(40, 40, 40)
  pdf.text("Subject", margin + 5, yPos + 5)
  pdf.text("Attended", margin + 70, yPos + 5)
  pdf.text("Happened", margin + 100, yPos + 5)
  pdf.text("Percentage", margin + 130, yPos + 5)
  pdf.text("Status", margin + 160, yPos + 5)

  yPos += 8

  // Table rows
  pdf.setFontSize(8)
  pdf.setTextColor(60, 60, 60)

  attendanceData.forEach((subject, index) => {
    if (yPos > pageHeight - 30) {
      // Add new page if we're near the bottom
      pdf.addPage()
      yPos = margin
    }

    // Alternate row background
    if (index % 2 === 0) {
      pdf.setFillColor(245, 245, 245)
      pdf.rect(margin, yPos, pageWidth - 2 * margin, 7, "F")
    }

    // Calculate percentage
    const percentage = subject.happened > 0 ? (subject.attended / subject.happened) * 100 : 0
    const goalPercentage = subject.customGoalPercentage || 75

    // Subject data
    pdf.text(subject.name.substring(0, 30), margin + 5, yPos + 5)
    pdf.text(subject.attended.toString(), margin + 70, yPos + 5)
    pdf.text(subject.happened.toString(), margin + 100, yPos + 5)
    pdf.text(`${percentage.toFixed(1)}%`, margin + 130, yPos + 5)

    // Status with color
    const status = percentage >= goalPercentage ? "On Track" : percentage >= goalPercentage - 5 ? "At Risk" : "Critical"
    pdf.setTextColor(
      percentage >= goalPercentage ? 46 : percentage >= goalPercentage - 5 ? 230 : 231,
      percentage >= goalPercentage ? 204 : percentage >= goalPercentage - 5 ? 126 : 76,
      percentage >= goalPercentage ? 113 : percentage >= goalPercentage - 5 ? 34 : 60,
    )
    pdf.text(status, margin + 160, yPos + 5)
    pdf.setTextColor(60, 60, 60)

    yPos += 7
  })

  yPos += 15

  // Recommendations section
  if (yPos > pageHeight - 60) {
    // Add new page if we're near the bottom
    pdf.addPage()
    yPos = margin
  }

  pdf.setFontSize(14)
  pdf.setTextColor(44, 62, 80)
  pdf.text("Recommendations", pageWidth / 2, yPos, { align: "center" })
  yPos += 10

  pdf.setFontSize(10)
  pdf.setTextColor(60, 60, 60)

  // Generate recommendations based on data
  const recommendations = []

  // GPA recommendations
  if (averages.avgGPA < 8) {
    recommendations.push(
      `Focus on improving your GPA (currently ${averages.avgGPA.toFixed(2)}) to reach the target of 8.0.`,
    )

    // Find subjects with low GPA
    const lowGPASubjects = marksData
      .filter((s) => s.gradePoint < 7)
      .sort((a, b) => a.gradePoint - b.gradePoint)
      .slice(0, 3)

    if (lowGPASubjects.length > 0) {
      recommendations.push(`Prioritize improvement in: ${lowGPASubjects.map((s) => s.subjectName).join(", ")}.`)
    }
  } else {
    recommendations.push(`Maintain your good academic performance with GPA of ${averages.avgGPA.toFixed(2)}.`)
  }

  // Attendance recommendations
  if (Number.parseFloat(overallAttendance.currentPercentage) < 75) {
    recommendations.push(
      `Improve your overall attendance (currently ${overallAttendance.currentPercentage}%) to reach the minimum 75%.`,
    )
    recommendations.push(
      `You need to attend ${overallAttendance.requiredClasses} more classes without missing any to reach 75%.`,
    )

    // Find subjects with low attendance
    const lowAttendanceSubjects = attendanceData
      .filter((s) => s.happened > 0 && (s.attended / s.happened) * 100 < 75)
      .sort((a, b) => a.attended / a.happened - b.attended / b.happened)
      .slice(0, 3)

    if (lowAttendanceSubjects.length > 0) {
      recommendations.push(`Focus on attending classes for: ${lowAttendanceSubjects.map((s) => s.name).join(", ")}.`)
    }
  } else {
    recommendations.push(`Continue maintaining good attendance above 75%.`)
  }

  // Exam recommendations
  const subjectsWithRemainingExams = marksData.filter((s) => s.maxExams - s.exams.length > 0)
  if (subjectsWithRemainingExams.length > 0) {
    recommendations.push(`Prepare well for upcoming exams in ${subjectsWithRemainingExams.length} subjects.`)

    // Find subjects that need high scores in remaining exams
    const challengingSubjects = marksData
      .filter((s) => {
        const remainingExams = s.maxExams - s.exams.length
        if (remainingExams <= 0) return false

        const totalMaxPossibleMarks = s.credits * 25
        const targetTotalScore = (70 / 100) * totalMaxPossibleMarks // For GPA 8.0
        const additionalMarksNeeded = targetTotalScore - s.totalScoredMarks
        const remainingMarksAvailable = totalMaxPossibleMarks - s.totalMaxMarks

        if (remainingMarksAvailable <= 0) return false

        const minPercentageInRemaining = (additionalMarksNeeded / remainingMarksAvailable) * 100
        return minPercentageInRemaining > 80 && minPercentageInRemaining <= 100
      })
      .slice(0, 3)

    if (challengingSubjects.length > 0) {
      recommendations.push(
        `You need to score high in remaining exams for: ${challengingSubjects.map((s) => s.subjectName).join(", ")}.`,
      )
    }
  }

  // Write recommendations
  recommendations.forEach((rec) => {
    if (yPos > pageHeight - 20) {
      // Add new page if we're near the bottom
      pdf.addPage()
      yPos = margin
    }

    // Add bullet point and wrap text
    const textLines = pdf.splitTextToSize(`• ${rec}`, pageWidth - 2 * margin - 10)
    pdf.text(textLines, margin + 5, yPos)
    yPos += textLines.length * 5 + 2
  })

  // Add footer
  pdf.setFontSize(8)
  pdf.setTextColor(150, 150, 150)
  pdf.text("Generated by GradeIT - Your Academic Progress Tracker", pageWidth / 2, pageHeight - 10, { align: "center" })

  // Save the PDF
  pdf.save("GradeIT-Academic-Report.pdf")
}

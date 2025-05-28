// Calculate grade point from percentage
export const calculateGradePoint = (percentage: number): number => {
  if (percentage >= 90) return 10.0
  if (percentage >= 80) return 9.0
  if (percentage >= 70) return 8.0
  if (percentage >= 60) return 7.0
  if (percentage >= 50) return 6.0
  if (percentage >= 45) return 5.0
  if (percentage >= 40) return 4.0
  return 0.0
}

// Calculate percentage from marks
export const calculatePercentage = (scored: number, total: number): number => {
  if (total === 0) return 0
  return Number.parseFloat(((scored / total) * 100).toFixed(2))
}

// Get letter grade from grade point
export const getLetterGrade = (gradePoint: number): string => {
  if (gradePoint >= 9) return "A+"
  if (gradePoint >= 8) return "A"
  if (gradePoint >= 7) return "B"
  if (gradePoint >= 6) return "C"
  if (gradePoint >= 5) return "D"
  if (gradePoint >= 4) return "E"
  return "F"
}

// Calculate minimum marks needed to reach a target grade point
export const calculateMinimumMarksNeeded = (
  currentScored: number,
  currentTotal: number,
  remainingExams: number,
  targetPercentage: number,
  credits: number,
  marksPerCredit = 25,
): { minPercentage: number; minMarks: number; achievable: boolean } => {
  // Calculate total marks based on credits
  const totalMaxPossibleMarks = credits * marksPerCredit

  // Calculate target score to achieve or maintain the goal percentage
  const targetTotalScore = (targetPercentage / 100) * totalMaxPossibleMarks

  // Calculate how many more marks are needed or can be lost
  const additionalMarksNeeded = targetTotalScore - currentScored

  // Calculate remaining marks available in future exams
  const remainingMarksAvailable = totalMaxPossibleMarks - currentTotal

  // If no remaining exams, check if the goal is already met
  if (remainingExams <= 0) {
    const isGoalAchieved = currentScored >= targetTotalScore
    return {
      minPercentage: 0,
      minMarks: 0,
      achievable: isGoalAchieved,
    }
  }

  // Calculate minimum percentage needed in remaining exams
  let minPercentageInRemaining = 0
  if (additionalMarksNeeded > 0) {
    // If additional marks are needed to reach the goal
    minPercentageInRemaining = Math.min(100, Math.max(0, (additionalMarksNeeded / remainingMarksAvailable) * 100))
  } else if (additionalMarksNeeded < 0) {
    // If the goal is already achieved, calculate the minimum percentage to maintain it
    const maxMarksCanLose = currentScored - targetTotalScore
    minPercentageInRemaining = Math.max(0, ((remainingMarksAvailable - maxMarksCanLose) / remainingMarksAvailable) * 100)
  } else {
    // If the goal is exactly met
    minPercentageInRemaining = 0
  }

  // Calculate minimum marks needed per exam
  const minMarksPerExam = remainingExams > 0 ? Math.ceil(Math.abs(additionalMarksNeeded) / remainingExams) : 0

  // Check if it's achievable
  const achievable = minPercentageInRemaining <= 100

  return {
    minPercentage: Math.ceil(minPercentageInRemaining),
    minMarks: Math.max(0, minMarksPerExam),
    achievable,
  }
}

// Calculate how many marks needed to reach a target grade point
export const calculateMarksNeeded = (
  currentScored: number,
  currentTotal: number,
  remainingTotal: number,
  targetGP: number,
): number => {
  // Get the percentage needed for the target grade point
  let targetPercentage = 0
  if (targetGP >= 10) targetPercentage = 90
  else if (targetGP >= 9) targetPercentage = 80
  else if (targetGP >= 8) targetPercentage = 70
  else if (targetGP >= 7) targetPercentage = 60
  else if (targetGP >= 6) targetPercentage = 50
  else if (targetGP >= 5) targetPercentage = 45
  else if (targetGP >= 4) targetPercentage = 40

  // Calculate total marks needed
  const totalPossibleMarks = currentTotal + remainingTotal
  const totalNeededMarks = (targetPercentage / 100) * totalPossibleMarks

  // Calculate additional marks needed
  const additionalMarksNeeded = totalNeededMarks - currentScored

  return Math.max(0, Math.ceil(additionalMarksNeeded))
}

// Grading utilities for the school management system

// Get the form level (1-6) from form string like "Form 3A"
export function getFormLevel(form: string): number {
  const match = form.match(/Form\s*(\d)/i);
  return match ? parseInt(match[1]) : 1;
}

// Calculate grade based on percentage and form level
// Form 1-4: A (75-100%), B (60-74%), C (50-59%), D (40-49%), U (<40%)
// Form 5-6: A* (90-100%), A (80-89%), B (70-79%), C (60-69%), D (50-59%), E (40-49%), U (<40%)
export function calculateGrade(percentage: number, formLevel: number): string {
  if (formLevel <= 4) {
    // Form 1-4 grading scale
    if (percentage >= 75) return "A";
    if (percentage >= 60) return "B";
    if (percentage >= 50) return "C";
    if (percentage >= 40) return "D";
    return "U";
  } else {
    // Form 5-6 grading scale (A-Level)
    if (percentage >= 90) return "A*";
    if (percentage >= 80) return "A";
    if (percentage >= 70) return "B";
    if (percentage >= 60) return "C";
    if (percentage >= 50) return "D";
    if (percentage >= 40) return "E";
    return "U";
  }
}

// Get color class for grade badge
export function getGradeColor(grade: string): string {
  switch (grade) {
    case "A*":
    case "A":
      return "bg-green-100 text-green-800";
    case "B":
      return "bg-blue-100 text-blue-800";
    case "C":
      return "bg-yellow-100 text-yellow-800";
    case "D":
      return "bg-orange-100 text-orange-800";
    case "E":
      return "bg-red-100 text-red-800";
    case "U":
      return "bg-gray-100 text-gray-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

// Get grading scale description for a form level
export function getGradingScale(formLevel: number): string {
  if (formLevel <= 4) {
    return "A (75%+) | B (60-74%) | C (50-59%) | D (40-49%) | U (<40%)";
  }
  return "A* (90%+) | A (80-89%) | B (70-79%) | C (60-69%) | D (50-59%) | E (40-49%) | U (<40%)";
}

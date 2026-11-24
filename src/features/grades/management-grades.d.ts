
export interface ManagementGrade {
  minimum: number
  letter: string
  points: number
}

export interface ManagementCourse {
  id: string
  name: string
  level: string
  formula: string
}

export const managementGrades: ManagementGrade[]

export const managementCourses: ManagementCourse[]

export const managementFormulas: Record<string, string>

export function predictManagementGrade(
  course: ManagementCourse,
  input: {
    eligibilityAverage: number
    quizzes: (number | null)[]
    final: number | null
    gaa?: number | null
    bonus?: number
  }
): Record<string, any>

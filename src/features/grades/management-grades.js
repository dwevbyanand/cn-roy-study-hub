export const managementGrades = [
  { minimum: 90, letter: 'S', points: 10 },
  { minimum: 80, letter: 'A', points: 9 },
  { minimum: 70, letter: 'B', points: 8 },
  { minimum: 60, letter: 'C', points: 7 },
  { minimum: 50, letter: 'D', points: 6 },
  { minimum: 40, letter: 'E', points: 4 },
  { minimum: 0, letter: 'U', points: 0 },
];

const foundation = 'Foundation';
const diploma = 'Diploma';
export const managementCourses = [
  ['math', 'Mathematics for Data Science 1', foundation, 'foundation'],
  ['english', 'English 1', foundation, 'foundation'],
  ['ct', 'Computational Thinking', foundation, 'foundation'],
  ['stats', 'Statistics for Data Science 1', foundation, 'statistics'],
  ['economics', 'Principles of Economics', foundation, 'foundation'],
  ['accounting', 'Financial Accounting', foundation, 'foundation'],
  ['business-stats', 'Business Statistics', foundation, 'foundation'],
  ['management', 'Management Thought and Practice', foundation, 'foundation'],
  ['python', 'Python for Data Analytics', diploma, 'diploma'],
  ['finance', 'Corporate Finance', diploma, 'diploma'],
  ['economic-data', 'Analysis of Economic Data', diploma, 'diploma'],
  ['operations', 'Operations Management', diploma, 'diploma'],
  ['behavior', 'Organisational Behavior', diploma, 'diploma'],
  ['marketing', 'Marketing Management', diploma, 'marketing'],
].map(([id, name, level, formula]) => ({id, name, level, formula}));

const foundationFormula = 'max(0.60F + 0.30 max(Q1, Q2), 0.45F + 0.25Q1 + 0.30Q2)';
export const managementFormulas = {
  foundation: foundationFormula,
  statistics: foundationFormula + ' + eligible extra activity bonus (up to 5)',
  diploma: '0.05 GAA + max(0.60F + 0.25 max(Q1, Q2), 0.40F + 0.25Q1 + 0.30Q2)',
  marketing: '0.05 GAA + max(0.65F + 0.15Q1 + 0.15Q2, 0.45F + 0.25Q1 + 0.25Q2)',
};

export function predictManagementGrade(course, {eligibilityAverage, quizzes, final, gaa = null, bonus = 0}) {
  const assignmentEligible = eligibilityAverage >= 40;
  const quizEligible = quizzes.some(score => score !== null);
  const result = {eligibilityAverage, assignmentEligible, quizEligible};
  if (!assignmentEligible || !quizEligible) {
    const letter = !assignmentEligible && !quizEligible ? 'WA/WQ' : assignmentEligible ? 'WQ' : 'WA';
    return {...result, letter, points: 0, status: 'Ineligible for end term'};
  }
  if (final === null) return {...result, status: 'End term attendance is required for a final grade'};

  const [q1, q2] = quizzes.map(score => score ?? 0);
  const bestQuiz = Math.max(q1, q2);
  let base;
  if (course.level === diploma) {
    if (gaa === null) return {...result, needsGaa: true};
    const assessment = course.formula === 'marketing'
      ? Math.max(65 * final + 15 * q1 + 15 * q2, 45 * final + 25 * q1 + 25 * q2)
      : Math.max(60 * final + 25 * bestQuiz, 40 * final + 25 * q1 + 30 * q2);
    base = (5 * gaa + assessment) / 100;
  } else {
    base = Math.max(60 * final + 30 * bestQuiz, 45 * final + 25 * q1 + 30 * q2) / 100;
  }
  const appliedBonus = course.formula === 'statistics' && base >= 40 ? Math.min(bonus, 5) : 0;
  const total = base + appliedBonus;
  const {letter, points} = managementGrades.find(grade => total >= grade.minimum);
  return {...result, total, base, gaa: course.level === diploma ? gaa : undefined, appliedBonus, letter, points, status: letter === 'U' ? 'Fail' : 'Pass'};
}

import {managementFormulas, managementGrades, predictManagementGrade} from './management-grades.js';

export const dataScienceCourses = [
  ['math', 'Mathematics for Data Science 1', 'MA1001', 'foundation'],
  ['english', 'English 1', 'HS1001', 'foundation'],
  ['ct', 'Computational Thinking', 'CS1001', 'foundation'],
  ['stats', 'Statistics for Data Science 1', 'MA1002', 'statistics'],
  ['math2', 'Mathematics for Data Science 2', 'MA1003', 'math2'],
  ['english2', 'English 2', 'HS1002', 'foundation'],
  ['python', 'Programming in Python', 'CS1002', 'python'],
  ['stats2', 'Statistics for Data Science 2', 'MA1004', 'statistics'],
].map(([id,name,code,formula]) => ({id,name: name + ' (' + code + ')',level:'Foundation',formula,credits:4}));

export const dataScienceFormulas = {
  ...managementFormulas,
  math2: 'min(100, ' + managementFormulas.foundation + ' + B), where B is the total from three extra activities worth 2 marks each.',
  python: '0.15Q1 + 0.40F + 0.25 max(PE1, PE2) + 0.20 min(PE1, PE2), plus any bonus awarded in the portal if SCT was completed.',
};

function scoreResult(result,total,credits) {
  const {letter,points} = managementGrades.find(grade => total >= grade.minimum);
  const passed = letter !== 'U';
  return {...result,total,letter,points,status:passed?'Pass':'Fail',credits:passed?credits:0};
}

export function predictDataScienceGrade(course,input) {
  if (course.formula === 'python') return predictPython(course,input);
  const result = predictManagementGrade(course,input);
  if (result.total === undefined) return {...result,credits:result.letter ? 0 : undefined};
  const appliedBonus = course.formula === 'math2' ? Math.min(input.bonus ?? 0,6) : result.appliedBonus;
  const total = course.formula === 'math2' ? Math.min(100,result.base+appliedBonus) : result.total;
  return scoreResult({...result,appliedBonus},total,course.credits);
}

function predictPython(course,{eligibilityAverage,quizzes,final,finalAbsent,programmingWeeks,oppe,sct,carriedEligibility,repeatRequiresEligibility,bonus}) {
  const assignmentEligible = eligibilityAverage >= 40;
  const oppe1Eligible = carriedEligibility || (sct && programmingWeeks.slice(0,4).every(score=>score>=40));
  const oppe2Eligible = carriedEligibility || (sct && assignmentEligible && programmingWeeks.slice(4,8).every(score=>score>=40));
  const finalEligible = assignmentEligible && (oppe1Eligible || oppe2Eligible);
  const result = {eligibilityAverage,oppe1Eligible,oppe2Eligible,finalEligible};
  const special = (letter,status,total) => ({...result,letter,status,total,points:letter==='U'?0:undefined,credits:0});
  if (repeatRequiresEligibility && !oppe1Eligible && !oppe2Eligible) return special('U','Repeat the course');
  const attended = oppe.some(score=>score!==null);
  const [pe1,pe2] = oppe.map(score=>score??0);
  const best = Math.max(pe1,pe2);
  if (!finalEligible) return special('U','Ineligible for end term. Repeat the course');
  if (finalAbsent) {
    if (!attended) return special('U','Repeat the course');
    return best>=40 ? special('I','Complete the end term only, or repeat the course') : special('I_BOTH','Complete the OPPE and end term, or repeat the course');
  }
  if (final === null) return {...result,status:'Enter an end term score or mark it as missed'};
  const base = (15*(quizzes[0]??0)+40*final+25*best+20*Math.min(pe1,pe2))/100;
  const appliedBonus = sct ? bonus ?? 0 : 0;
  const total = base+appliedBonus;
  if (!attended || best<40) {
    if (total >= (attended?40:35)) return special('I_OP','Complete the OPPE only, or repeat the course',total);
    return special('U','Repeat the course',total);
  }
  return scoreResult({...result,base,appliedBonus},total,course.credits);
}

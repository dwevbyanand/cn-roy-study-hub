// Search by hundredths so the displayed requirement always reaches the target.
export function findTargetMarks(predict, input, assessment, targetPoints) {
  const evaluate = marks => predict(assessment === 'quiz2'
    ? {...input, quizzes:[input.quizzes[0], marks]}
    : {...input, final:marks, finalAbsent:false});
  const maximum = evaluate(100);
  if ((maximum.points ?? 0) < targetPoints) return {maximum};

  let low = 0;
  let high = 10000;
  while (low < high) {
    const midpoint = Math.floor((low + high) / 2);
    if ((evaluate(midpoint / 100).points ?? 0) >= targetPoints) high = midpoint;
    else low = midpoint + 1;
  }
  const marks = low / 100;
  return {marks, result:evaluate(marks)};
}

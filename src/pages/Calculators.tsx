
import { useMemo, useState } from 'react'
import { managementGrades, managementCourses, predictManagementGrade } from '../features/grades/management-grades'
import {
  dataScienceCourses,
  predictDataScienceGrade,
} from '../features/grades/data-science-grades'

type Tab = 'predictor' | 'endterm' | 'cgpa'
type Section = 'data-science' | 'management'

type CGPARow = {
  id: number
  credits: string
  points: string
}

export function Calculators() {
  const [tab, setTab] = useState<Tab>('predictor')
  const [section, setSection] = useState<Section>('data-science')
  const [courseId, setCourseId] = useState('math')

  const [eligibilityAverage, setEligibilityAverage] = useState('60')
  const [q1, setQ1] = useState('60')
  const [q2, setQ2] = useState('60')
  const [final, setFinal] = useState('60')
  const [gaa, setGaa] = useState('60')
  const [bonus, setBonus] = useState('0')

  const [weekly, setWeekly] = useState<string[]>(Array(8).fill('60'))
  const [oppe1, setOppe1] = useState('60')
  const [oppe2, setOppe2] = useState('60')

  const [rows, setRows] = useState<CGPARow[]>([
    { id: 1, credits: '4', points: '10' },
  ])
  const [nextId, setNextId] = useState(2)

  const dataScienceCourse = dataScienceCourses.find(
    item => item.id === courseId,
  )

  const managementCourse = managementCourses.find(
    item => item.id === courseId,
  )

  const course = section === 'data-science'
    ? dataScienceCourse
    : managementCourse

  const isPython = section === 'data-science' && courseId === 'python'
  const isDiploma = section === 'management' && managementCourse?.level === 'Diploma'

  const hasStatisticsBonus =
    section === 'data-science' && course?.formula === 'statistics'

  const hasMath2Bonus =
    section === 'data-science' && course?.formula === 'math2'

  const hasPythonBonus = isPython

  const hasManagementStatsBonus =
    section === 'management' && managementCourse?.formula === 'statistics'

  const hasBonus =
    hasStatisticsBonus ||
    hasMath2Bonus ||
    hasPythonBonus ||
    hasManagementStatsBonus

  const bonusLabel = hasStatisticsBonus || hasManagementStatsBonus
    ? 'Extra-activity bonus (maximum 5)'
    : hasMath2Bonus
      ? 'Extra-activity bonus (maximum 6)'
      : 'SCT bonus marks awarded'

  const bonusMaximum = hasStatisticsBonus || hasManagementStatsBonus
    ? 5
    : hasMath2Bonus
      ? 6
      : 100

  // SCT is assumed completed because its checkbox was removed.
  const sct = true

  const validNumber = (value: string) =>
    value.trim() !== '' && Number.isFinite(Number(value))

  const input = useMemo(() => ({
    eligibilityAverage: Number(eligibilityAverage),
    quizzes: [Number(q1), Number(q2)],
    final: Number(final),
    finalAbsent: false,
    bonus: Number(bonus),
    programmingWeeks: weekly.map(Number),
    oppe: [Number(oppe1), Number(oppe2)],
    sct,
    carriedEligibility: false,
    repeatRequiresEligibility: false,
  }), [
    eligibilityAverage,
    q1,
    q2,
    final,
    bonus,
    weekly,
    oppe1,
    oppe2,
  ])

  const inputsValid = [
    eligibilityAverage,
    q1,
    q2,
    final,
    bonus,
    ...(isDiploma ? [gaa] : []),
    ...(isPython ? [...weekly, oppe1, oppe2] : []),
  ].every(validNumber)

  const prediction = useMemo(() => {
    if (!course || !inputsValid) return null

    if (section === 'data-science') {
      return predictDataScienceGrade(dataScienceCourse!, input)
    }

    return predictManagementGrade(managementCourse!, {
      eligibilityAverage: Number(eligibilityAverage),
      quizzes: [Number(q1), Number(q2)],
      final: Number(final),
      gaa: isDiploma ? Number(gaa) : null,
      bonus: Number(bonus),
    })
  }, [
    course,
    inputsValid,
    section,
    dataScienceCourse,
    managementCourse,
    input,
    eligibilityAverage,
    q1,
    q2,
    final,
    gaa,
    bonus,
    isDiploma,
  ])

  const minimumFinal = useMemo(() => {
    if (!course || !inputsValid) return null

    for (let mark = 0; mark <= 100; mark++) {
      const result = section === 'data-science'
        ? predictDataScienceGrade(dataScienceCourse!, {
            ...input,
            final: mark,
            finalAbsent: false,
          })
        : predictManagementGrade(managementCourse!, {
            eligibilityAverage: Number(eligibilityAverage),
            quizzes: [Number(q1), Number(q2)],
            final: mark,
            gaa: isDiploma ? Number(gaa) : null,
            bonus: Number(bonus),
          })

      if (result.status === 'Pass') return mark
    }

    return null
  }, [
    course,
    inputsValid,
    section,
    dataScienceCourse,
    managementCourse,
    input,
    eligibilityAverage,
    q1,
    q2,
    gaa,
    bonus,
    isDiploma,
  ])

  const cgpaResult = useMemo(() => {
    const valid = rows.map(row => ({
      credits: Number(row.credits),
      points: Number(row.points),
    })).filter(row =>
      Number.isFinite(row.credits) &&
      row.credits > 0 &&
      Number.isFinite(row.points) &&
      row.points >= 0 &&
      row.points <= 10
    )

    const credits = valid.reduce(
      (sum, row) => sum + row.credits,
      0,
    )

    const weighted = valid.reduce(
      (sum, row) => sum + row.credits * row.points,
      0,
    )

    return credits > 0
      ? { cgpa: weighted / credits, credits }
      : null
  }, [rows])

  function updateWeekly(index: number, value: string) {
    setWeekly(old =>
      old.map((score, i) => i === index ? value : score),
    )
  }

  function numberInput(
    label: string,
    value: string,
    setter: (value: string) => void,
    max = 100,
  ) {
    return (
      <label>
        {label}
        <input
          type="number"
          min="0"
          max={max}
          step="any"
          value={value}
          onChange={event => setter(event.target.value)}
        />
      </label>
    )
  }

  function changeSection(value: Section) {
    setSection(value)
    setCourseId('math')
    setBonus('0')
  }

  return (
    <>
      <div className="page-heading">
        <h1>Academic Calculators</h1>
        <p>
          Grade prediction, end-term marks and CGPA
          for IITM BS programmes.
        </p>
      </div>

      <div className="actions">
        <button
          className={tab === 'predictor' ? '' : 'outline'}
          onClick={() => setTab('predictor')}
        >
          Grade Predictor
        </button>

        <button
          className={tab === 'endterm' ? '' : 'outline'}
          onClick={() => setTab('endterm')}
        >
          End-term Marks
        </button>

        <button
          className={tab === 'cgpa' ? '' : 'outline'}
          onClick={() => setTab('cgpa')}
        >
          CGPA Calculator
        </button>
      </div>

      {tab !== 'cgpa' && (
        <section className="panel">
          <h2>
            {tab === 'predictor'
              ? 'Grade Predictor'
              : 'End-term Marks Required'}
          </h2>

          <label>
            Select programme
            <select
              value={section}
              onChange={event =>
                changeSection(event.target.value as Section)
              }
            >
              <option value="data-science">Data Science</option>
              <option value="management">Management</option>
            </select>
          </label>

          <label>
            Select course
            <select
              value={courseId}
              onChange={event => {
                setCourseId(event.target.value)
                setBonus('0')
              }}
            >
              {(section === 'data-science'
                ? dataScienceCourses
                : managementCourses
              ).map(item => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>

          <h3>Assessment scores</h3>

          {numberInput(
            'Eligibility average (%)',
            eligibilityAverage,
            setEligibilityAverage,
          )}

          <p className="muted">
            Enter the average used to determine your end-term eligibility.
          </p>

          <div className="score-row">
            {numberInput('Quiz 1 (%)', q1, setQ1)}
            {numberInput('Quiz 2 (%)', q2, setQ2)}
          </div>

          {isDiploma && (
            <>
              <h3>General Assessment Average</h3>
              {numberInput('GAA (%)', gaa, setGaa)}
              <p className="muted">
                Diploma course calculations include GAA.
              </p>
            </>
          )}

          {isPython && (
            <>
              <h3>Programming in Python</h3>

              <p className="muted">
                Enter your weekly graded programming assessment scores.
              </p>

              <div className="score-grid">
                {weekly.map((value, index) => (
                  <label key={index}>
                    A{index + 1}
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={value}
                      onChange={event =>
                        updateWeekly(index, event.target.value)
                      }
                    />
                  </label>
                ))}
              </div>

              <div className="score-row">
                {numberInput('OPPE 1 (%)', oppe1, setOppe1)}
                {numberInput('OPPE 2 (%)', oppe2, setOppe2)}
              </div>

              <p className="muted">
                Python calculations assume SCT completion.
              </p>
            </>
          )}

          {tab === 'predictor' && (
            <>
              <h3>End-term score</h3>

              {numberInput(
                'End-term marks (%)',
                final,
                setFinal,
              )}

              {hasBonus && (
                <>
                  <h3>Bonus marks</h3>

                  {numberInput(
                    bonusLabel,
                    bonus,
                    setBonus,
                    bonusMaximum,
                  )}

                  <p className="muted">
                    Enter only the bonus marks actually awarded or expected.
                  </p>
                </>
              )}
            </>
          )}

          {tab === 'endterm' && (
            <>
              <h3>Required end-term marks</h3>

              <p className="muted">
                The calculator checks the course formula for the minimum
                end-term score needed to reach a passing total.
              </p>
            </>
          )}

          <div className="result">
            {tab === 'predictor' ? (
              prediction?.total !== undefined ? (
                <>
                  <strong>
                    Final score: {Number(prediction.total).toFixed(2)} / 100
                  </strong>

                  <p>Grade: {prediction.letter ?? 'Not available'}</p>
                  <p>
                    Grade points: {prediction.points ?? 'Not available'}
                  </p>
                  <p>Status: {prediction.status}</p>
                </>
              ) : (
                <p>
                  {prediction?.status ??
                    (isDiploma && !validNumber(gaa)
                      ? 'Enter a valid GAA score.'
                      : 'Enter valid assessment scores.')}
                </p>
              )
            ) : (
              minimumFinal !== null ? (
                <>
                  <strong>
                    Minimum end-term marks: {minimumFinal} / 100
                  </strong>
                  <p>Passing threshold: 40 / 100 overall.</p>
                </>
              ) : (
                <p>
                  Passing cannot currently be confirmed with these inputs.
                  Check your eligibility and assessment scores.
                </p>
              )
            )}
          </div>

          <p className="muted">
            This is an estimate based on the configured course formula.
            Official eligibility and academic rules still apply.
          </p>
        </section>
      )}

      {tab === 'cgpa' && (
        <section className="panel">
          <h2>CGPA Calculator</h2>

          <p className="muted">
            Enter each completed course using its credits and grade points
            from your academic transcript.
          </p>

          {rows.map((row, index) => (
            <div className="score-row" key={row.id}>
              <label>
                Course {index + 1} credits
                <input
                  type="number"
                  min="0.01"
                  step="any"
                  value={row.credits}
                  onChange={event =>
                    setRows(old => old.map(item =>
                      item.id === row.id
                        ? { ...item, credits: event.target.value }
                        : item
                    ))
                  }
                />
              </label>

              <label>
                Grade points
                <input
                  type="number"
                  min="0"
                  max="10"
                  step="any"
                  value={row.points}
                  onChange={event =>
                    setRows(old => old.map(item =>
                      item.id === row.id
                        ? { ...item, points: event.target.value }
                        : item
                    ))
                  }
                />
              </label>

              <button
                className="outline remove"
                onClick={() =>
                  setRows(old =>
                    old.length > 1
                      ? old.filter(item => item.id !== row.id)
                      : old
                  )
                }
                aria-label="Remove course"
              >
                ×
              </button>
            </div>
          ))}

          <div className="actions">
            <button
              className="outline"
              onClick={() => {
                setRows(old => [
                  ...old,
                  { id: nextId, credits: '4', points: '10' },
                ])
                setNextId(id => id + 1)
              }}
            >
              + Add course
            </button>
          </div>

          <output className="result">
            {cgpaResult
              ? `${cgpaResult.cgpa.toFixed(2)} / 10 CGPA · ${cgpaResult.credits} credits`
              : 'Enter valid credits and grade points.'}
          </output>

          {rows.some(row =>
            !Number.isFinite(Number(row.credits)) ||
            Number(row.credits) <= 0 ||
            !Number.isFinite(Number(row.points)) ||
            Number(row.points) < 0 ||
            Number(row.points) > 10
          ) && (
            <p className="error">
              Some entries are invalid. Only valid entries are included.
            </p>
          )}

          <details>
            <summary>Grade scale</summary>
            <ul>
              {managementGrades.map(grade => (
                <li key={grade.letter}>
                  {grade.letter}: {grade.points} points
                  (minimum score {grade.minimum})
                </li>
              ))}
            </ul>
          </details>
        </section>
      )}
    </>
  )
}

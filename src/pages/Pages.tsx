
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowUpRight,
  BookOpen,
  Calculator,
  FileText,
  GraduationCap,
  Youtube,
  Search,
} from 'lucide-react'
import { supabase } from '../lib/supabase'

const channel = 'https://www.youtube.com/@cn-roy/videos'
const playlist = 'https://www.youtube.com/playlist?list=PLKcYWlrDGteE'

const gaLectures = [
  { week: 1, id: 'AQYM0wHb7TI', title: 'Week 1 Graded Assignment Statistics Complete Explanation' },
  { week: 2, id: 'oFDf8jInwh8', title: 'Week 2 graded assignment Statistics Complete Explanation' },
  { week: 3, id: 'PRAXsshWyZU', title: 'Week 3 Graded Assignment Statistics Complete Explanation' },
  { week: 4, id: 'pZfMgqrAog0', title: 'Week 4 Graded Assignment Statistics Complete Explanation' },
]

type Lecture = {
  id: string
  title: string
  description: string | null
  subject: string | null
  subject_id: string | null
  degree: string
  url: string | null
  created_at: string
}

type Subject = {
  id: string
  name: string
  degree: string
  term: 'foundation_1' | 'foundation_2'
}

type GASolution = {
  id: string
  title: string
  description: string | null
  subject: string | null
  subject_id: string | null
  degree: string
  url: string | null
  week: number | null
  created_at: string
}

function PageTitle({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div className="page-heading">
      <h1>{title}</h1>
      <p>{description}</p>
    </div>
  )
}

function ResourceCard({
  title,
  description,
  icon: Icon,
  to,
}: {
  title: string
  description: string
  icon: typeof BookOpen
  to: string
}) {
  return (
    <Link className="resource-card" to={to}>
      <span className="icon-tile"><Icon /></span>
      <h3>{title}</h3>
      <p>{description}</p>
    </Link>
  )
}

function getYouTubeThumbnail(url: string | null) {
  if (!url) return null

  try {
    const parsed = new URL(url)
    let videoId: string | null = null

    if (parsed.hostname === 'youtu.be') {
      videoId = parsed.pathname.split('/').filter(Boolean)[0] || null
    } else if (
      ['youtube.com', 'www.youtube.com', 'm.youtube.com'].includes(parsed.hostname)
    ) {
      videoId =
        parsed.searchParams.get('v') ||
        parsed.pathname.match(/\/(?:shorts|embed|live)\/([^/?]+)/)?.[1] ||
        null
    }

    return videoId
      ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`
      : null
  } catch {
    return null
  }
}

export function Home() {
  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <div className="hero-motto">तमसो मा ज्योतिर्गमय...</div>
          <h1>Study with <span>CN Roy.</span></h1>
          <p>Notes, previous-year questions and grade tools for your IIT Madras BS journey.</p>
          <div className="actions">
            <Link className="primary" to="/notes">Browse notes</Link>
            <Link className="outline" to="/calculators">Open calculators</Link>
          </div>
        </div>
        <img src="/images/portrait.jpg" alt="CN Roy" />
      </section>

      <section className="section">
        <div className="section-heading">
          <h2>Study resources</h2>
        </div>
        <div className="resource-grid">
          <ResourceCard title="Lectures" description="Watch lectures and assignment explanations." icon={Youtube} to="/lectures" />
          <ResourceCard title="Notes" description="Revise course topics and weekly material." icon={FileText} to="/notes" />
          <ResourceCard title="Past papers" description="Find previous-year question papers." icon={BookOpen} to="/past-papers" />
          <ResourceCard title="Calculators" description="Explore grade and CGPA tools." icon={Calculator} to="/calculators" />
          <ResourceCard title="Courses" description="Explore available study courses." icon={GraduationCap} to="/courses" />
        </div>
      </section>
    </>
  )
}

export function Lectures() {
  const [lectures, setLectures] = useState<Lecture[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [degree, setDegree] = useState('all')
  const [subjectId, setSubjectId] = useState('all')

  useEffect(() => {
    async function loadLectures() {
      if (!supabase) {
        setError('Supabase is not configured.')
        setLoading(false)
        return
      }

      const [lectureResult, subjectResult] = await Promise.all([
        supabase
          .from('study_resources')
          .select('*')
          .eq('type', 'lecture')
          .order('created_at', { ascending: false }),
        supabase
          .from('study_subjects')
          .select('id, name, degree, term')
          .order('name', { ascending: true }),
      ])

      if (lectureResult.error) {
        setError(lectureResult.error.message)
      } else {
        setLectures((lectureResult.data || []) as Lecture[])
      }

      if (subjectResult.error) {
        setError(current =>
          current || `Could not load subjects: ${subjectResult.error.message}`,
        )
      } else {
        setSubjects((subjectResult.data || []) as Subject[])
      }

      setLoading(false)
    }

    void loadLectures()
  }, [])

  const availableSubjects = useMemo(
    () =>
      subjects.filter(item => degree === 'all' || item.degree === degree),
    [subjects, degree],
  )

  const getLectureSubject = (lecture: Lecture) => {
    const linkedSubject = subjects.find(item => item.id === lecture.subject_id)
    if (linkedSubject) return linkedSubject

    return subjects.find(
      item =>
        item.degree === lecture.degree &&
        item.name.trim().toLowerCase() ===
          (lecture.subject || '').trim().toLowerCase(),
    )
  }

  const filteredLectures = useMemo(() => {
    return lectures.filter(lecture => {
      const linkedSubject = subjects.find(
        item => item.id === lecture.subject_id,
      )

      const legacySubject = !linkedSubject
        ? subjects.find(
            item =>
              item.degree === lecture.degree &&
              item.name.trim().toLowerCase() ===
                (lecture.subject || '').trim().toLowerCase(),
          )
        : undefined

      const resolvedSubject = linkedSubject || legacySubject
      const matchesDegree =
        degree === 'all' || lecture.degree === degree
      const matchesSubject =
        subjectId === 'all' || resolvedSubject?.id === subjectId

      const subjectName = resolvedSubject?.name || lecture.subject || ''
      const searchText = search.trim().toLowerCase()

      const matchesSearch =
        lecture.title.toLowerCase().includes(searchText) ||
        (lecture.description || '').toLowerCase().includes(searchText) ||
        subjectName.toLowerCase().includes(searchText)

      return matchesDegree && matchesSubject && matchesSearch
    })
  }, [lectures, subjects, degree, subjectId, search])

  return (
    <>
      <PageTitle
        title="Lectures"
        description="Watch CN Roy lectures and assignment explanations."
      />

      <section className="section">
        <div className="section-heading">
          <h2>Published Lectures</h2>
          <a className="outline" href={channel} target="_blank" rel="noreferrer">
            YouTube Channel <ArrowUpRight size={15} />
          </a>
        </div>

        <div className="lecture-filters">
          <label>
            <span>Search lectures</span>
            <div className="search-input">
              <Search size={17} />
              <input
                type="search"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by title or subject..."
              />
            </div>
          </label>

          <label>
            <span>Degree</span>
            <select
              value={degree}
              onChange={e => {
                setDegree(e.target.value)
                setSubjectId('all')
              }}
            >
              <option value="all">All degrees</option>
              <option value="ds">Data Science and Applications</option>
              <option value="mg">Management and Data Science</option>
            </select>
          </label>

          <label>
            <span>Subject</span>
            <select
              value={subjectId}
              onChange={e => setSubjectId(e.target.value)}
            >
              <option value="all">All subjects</option>
              {availableSubjects.map(item => (
                <option value={item.id} key={item.id}>
                  {item.name} — {item.term === 'foundation_1'
                    ? 'Foundation Term 1'
                    : 'Foundation Term 2'}
                </option>
              ))}
            </select>
          </label>
        </div>

        {loading && <p>Loading lectures...</p>}

        {error && <p role="alert">{error}</p>}

        {!loading && !error && filteredLectures.length > 0 && (
          <div className="resource-grid">
            {filteredLectures.map(lecture => {
              const linkedSubject = getLectureSubject(lecture)

              return (
                <article className="resource-card" key={lecture.id}>
                  <span className="eyebrow">
                    {lecture.degree === 'ds'
                      ? 'Data Science and Applications'
                      : 'Management and Data Science'}
                  </span>

                  <h3>{lecture.title}</h3>

                  <p>
                    {linkedSubject
                      ? `${linkedSubject.name} · ${
                          linkedSubject.term === 'foundation_1'
                            ? 'Foundation Term 1'
                            : 'Foundation Term 2'
                        }`
                      : lecture.subject || 'General lecture'}
                  </p>

                  {lecture.description && <p>{lecture.description}</p>}

                  {lecture.url && (
                    <a href={lecture.url} target="_blank" rel="noreferrer">
                      Watch lecture <ArrowUpRight size={15} />
                    </a>
                  )}
                </article>
              )
            })}
          </div>
        )}

        {!loading && !error && filteredLectures.length === 0 && (
          <div className="empty-state">
            <Youtube size={26} />
            <h2>No lectures found</h2>
            <p>
              {lectures.length === 0
                ? 'Lectures will appear here once they are published.'
                : 'Try changing your search or filters.'}
            </p>
          </div>
        )}
      </section>

      <section className="section">
        <div className="section-heading">
          <h2>Statistics for Data Science 1 — GA Solutions</h2>
          <a className="outline" href={playlist} target="_blank" rel="noreferrer">
            Full playlist <ArrowUpRight size={15} />
          </a>
        </div>

        <div className="resource-grid">
          {gaLectures.map(video => (
            <a
              className="lecture-card"
              key={video.id}
              href={`https://www.youtube.com/watch?v=${video.id}&list=PLKcYWlrDGteE`}
              target="_blank"
              rel="noreferrer"
            >
              <img
                src={`https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`}
                alt=""
                loading="lazy"
              />
              <div>
                <span className="eyebrow">Week {video.week}</span>
                <h3>{video.title}</h3>
              </div>
            </a>
          ))}
        </div>
      </section>
    </>
  )
}

export function GASolutions() {
  const [solutions, setSolutions] = useState<GASolution[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [degree, setDegree] = useState('all')
  const [subjectId, setSubjectId] = useState('all')
  const [week, setWeek] = useState('all')

  useEffect(() => {
    async function loadSolutions() {
      if (!supabase) {
        setError('Supabase is not configured.')
        setLoading(false)
        return
      }

      const [solutionResult, subjectResult] = await Promise.all([
        supabase
          .from('study_resources')
          .select('*')
          .eq('type', 'ga_solution')
          .order('created_at', { ascending: false }),
        supabase
          .from('study_subjects')
          .select('id, name, degree, term')
          .order('name', { ascending: true }),
      ])

      if (solutionResult.error) {
        setError(solutionResult.error.message)
      } else {
        setSolutions((solutionResult.data || []) as GASolution[])
      }

      if (subjectResult.error) {
        setError(current =>
          current || `Could not load subjects: ${subjectResult.error.message}`,
        )
      } else {
        setSubjects((subjectResult.data || []) as Subject[])
      }

      setLoading(false)
    }

    void loadSolutions()
  }, [])

  const availableSubjects = useMemo(
    () =>
      subjects.filter(item => degree === 'all' || item.degree === degree),
    [subjects, degree],
  )

  const availableWeeks = useMemo(
    () =>
      [...new Set(
        solutions
          .map(item => item.week)
          .filter((value): value is number => value !== null),
      )].sort((a, b) => a - b),
    [solutions],
  )

  const getSolutionSubject = (solution: GASolution) => {
    const linkedSubject = subjects.find(
      item => item.id === solution.subject_id,
    )

    if (linkedSubject) return linkedSubject

    return subjects.find(
      item =>
        item.degree === solution.degree &&
        item.name.trim().toLowerCase() ===
          (solution.subject || '').trim().toLowerCase(),
    )
  }

  const filteredSolutions = useMemo(() => {
    return solutions.filter(solution => {
      const linkedSubject = subjects.find(
        item => item.id === solution.subject_id,
      )

      const legacySubject = !linkedSubject
        ? subjects.find(
            item =>
              item.degree === solution.degree &&
              item.name.trim().toLowerCase() ===
                (solution.subject || '').trim().toLowerCase(),
          )
        : undefined

      const resolvedSubject = linkedSubject || legacySubject

      const matchesDegree =
        degree === 'all' || solution.degree === degree

      const matchesSubject =
        subjectId === 'all' || resolvedSubject?.id === subjectId

      const matchesWeek =
        week === 'all' || String(solution.week) === week

      const subjectName = resolvedSubject?.name || solution.subject || ''
      const searchText = search.trim().toLowerCase()

      const matchesSearch =
        solution.title.toLowerCase().includes(searchText) ||
        (solution.description || '').toLowerCase().includes(searchText) ||
        subjectName.toLowerCase().includes(searchText)

      return (
        matchesDegree &&
        matchesSubject &&
        matchesWeek &&
        matchesSearch
      )
    })
  }, [solutions, subjects, degree, subjectId, week, search])

  return (
    <>
      <PageTitle
        title="GA Solutions"
        description="Graded Assignment solution lectures organized by subject and week."
      />

      <section className="section">
        <div className="section-heading">
          <h2>Published GA Solutions</h2>
          <a className="outline" href={playlist} target="_blank" rel="noreferrer">
            YouTube playlist <ArrowUpRight size={15} />
          </a>
        </div>

        <div className="lecture-filters">
          <label>
            <span>Search solutions</span>
            <div className="search-input">
              <Search size={17} />
              <input
                type="search"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by title or subject..."
              />
            </div>
          </label>

          <label>
            <span>Degree</span>
            <select
              value={degree}
              onChange={e => {
                setDegree(e.target.value)
                setSubjectId('all')
              }}
            >
              <option value="all">All degrees</option>
              <option value="ds">Data Science and Applications</option>
              <option value="mg">Management and Data Science</option>
            </select>
          </label>

          <label>
            <span>Subject</span>
            <select
              value={subjectId}
              onChange={e => setSubjectId(e.target.value)}
            >
              <option value="all">All subjects</option>
              {availableSubjects.map(item => (
                <option value={item.id} key={item.id}>
                  {item.name} — {item.term === 'foundation_1'
                    ? 'Foundation Term 1'
                    : 'Foundation Term 2'}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Week</span>
            <select value={week} onChange={e => setWeek(e.target.value)}>
              <option value="all">All weeks</option>
              {availableWeeks.map(item => (
                <option value={String(item)} key={item}>
                  Week {item}
                </option>
              ))}
            </select>
          </label>
        </div>

        {loading && <p>Loading GA solutions...</p>}

        {error && <p role="alert">{error}</p>}

        {!loading && !error && filteredSolutions.length > 0 && (
          <div className="resource-grid">
            {filteredSolutions.map(item => {
              const linkedSubject = getSolutionSubject(item)
              const thumbnail = getYouTubeThumbnail(item.url)

              return (
                <article className="resource-card" key={item.id}>
                  {thumbnail && (
                    <a
                      href={item.url || '#'}
                      target="_blank"
                      rel="noreferrer"
                      className="ga-thumbnail"
                    >
                      <img
                        src={thumbnail}
                        alt={`Thumbnail for ${item.title}`}
                        loading="lazy"
                      />
                    </a>
                  )}

                  <span className="eyebrow">
                    {item.degree === 'ds'
                      ? 'Data Science and Applications'
                      : 'Management and Data Science'}
                    {item.week !== null ? ` · Week ${item.week}` : ''}
                  </span>

                  <h3>{item.title}</h3>

                  <p>
                    {linkedSubject
                      ? `${linkedSubject.name} · ${
                          linkedSubject.term === 'foundation_1'
                            ? 'Foundation Term 1'
                            : 'Foundation Term 2'
                        }`
                      : item.subject || 'General subject'}
                  </p>

                  {item.description && <p>{item.description}</p>}

                  {item.url && (
                    <a href={item.url} target="_blank" rel="noreferrer">
                      Watch solution <ArrowUpRight size={15} />
                    </a>
                  )}
                </article>
              )
            })}
          </div>
        )}

        {!loading && !error && filteredSolutions.length === 0 && (
          <div className="empty-state">
            <Youtube size={26} />
            <h2>No GA solutions found</h2>
            <p>
              {solutions.length === 0
                ? 'GA solutions will appear here once they are published in Creator Studio.'
                : 'Try changing your search or filters.'}
            </p>
          </div>
        )}
      </section>
    </>
  )
}

function EmptyResources({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <>
      <PageTitle title={title} description={description} />
      <div className="empty-state">
        <BookOpen size={26} />
        <h2>No published resources yet</h2>
        <p>
          This section is ready for content. Resources will appear here once
          they are added to the platform catalogue.
        </p>
        <a href={channel} target="_blank" rel="noreferrer" className="outline">
          Visit CN Roy on YouTube <ArrowUpRight size={15} />
        </a>
      </div>
    </>
  )
}

export function Notes() {
  return <EmptyResources title="Notes" description="Browse study notes by degree, subject and week." />
}

export function PastPapers() {
  return <EmptyResources title="Past Papers" description="Find previous-year question papers by degree and subject." />
}

export function Courses() {
  return <EmptyResources title="Courses" description="Explore courses and learning pathways." />
}

export function About() {
  return (
    <>
      <PageTitle
        title="About CN Roy"
        description="YouTube creator behind the CN Roy Study Hub."
      />

      <section className="about-card">
        <img src="/images/portrait.jpg" alt="CN Roy" />
        <p>
          This is an independent student resource for IIT Madras BS learners,
          bringing study materials, lecture links and grade tools together.
        </p>
        <p lang="hi">तमसो मा ज्योतिर्गमय</p>
        <a className="primary" href={channel} target="_blank" rel="noreferrer">
          Watch on YouTube <ArrowUpRight size={15} />
        </a>
      </section>
    </>
  )
}

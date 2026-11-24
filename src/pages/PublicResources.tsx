
import { useEffect, useMemo, useState } from 'react'
import {
  Search,
  BookOpen,
  ExternalLink,
  FileDown,
} from 'lucide-react'
import { supabase } from '../lib/supabase'

type ResourceType = 'note' | 'past_paper' | 'course'

type Subject = {
  id: string
  name: string
  degree: string
  term: string
}

type Resource = {
  id: string
  title: string
  description: string | null
  subject: string | null
  subject_id: string | null
  degree: string
  type: string
  url: string | null
  file_path: string | null
  week: number | null
}

const headings = {
  note: {
    title: 'Notes',
    description: 'Browse study notes by degree, subject and week.',
  },
  past_paper: {
    title: 'Past Papers',
    description: 'Find previous-year question papers.',
  },
  course: {
    title: 'Courses',
    description: 'Explore courses and learning resources.',
  },
}

export function PublicResources({
  type,
}: {
  type: ResourceType
}) {
  const [items, setItems] = useState<Resource[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [degree, setDegree] = useState('all')
  const [subjectId, setSubjectId] = useState('all')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [openingFile, setOpeningFile] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    async function load() {
      setLoading(true)
      setError('')
      setItems([])
      setSubjects([])

      if (!supabase) {
        setError('Supabase is not configured.')
        setLoading(false)
        return
      }

      const [resourceResult, subjectResult] = await Promise.all([
        supabase
          .from('study_resources')
          .select('*')
          .eq('type', type)
          .order('created_at', { ascending: false }),

        supabase
          .from('study_subjects')
          .select('id, name, degree, term')
          .order('name'),
      ])

      if (!active) return

      if (resourceResult.error) {
        setError(resourceResult.error.message)
      } else {
        setItems(resourceResult.data || [])
      }

      if (subjectResult.error) {
        setError(subjectResult.error.message)
      } else {
        setSubjects(subjectResult.data || [])
      }

      setLoading(false)
    }

    void load()

    return () => {
      active = false
    }
  }, [type])

  const availableSubjects = useMemo(() => {
    return subjects.filter(item =>
      degree === 'all' || item.degree === degree
    )
  }, [subjects, degree])

  const visible = useMemo(() => {
    return items.filter(item => {
      const matchesDegree =
        degree === 'all' || item.degree === degree

      const selectedSubject = subjects.find(
        subject => subject.id === subjectId
      )

      const matchesSubject =
        subjectId === 'all' ||
        item.subject_id === subjectId ||
        (
          !item.subject_id &&
          Boolean(selectedSubject) &&
          item.subject === selectedSubject?.name &&
          item.degree === selectedSubject?.degree
        )

      const text = [
        item.title,
        item.subject || '',
        item.description || '',
      ].join(' ').toLowerCase()

      const matchesSearch =
        text.includes(search.trim().toLowerCase())

      return matchesDegree && matchesSubject && matchesSearch
    })
  }, [items, degree, subjectId, search, subjects])

  async function openFile(item: Resource) {
    if (!supabase || !item.file_path) return

    setOpeningFile(item.id)
    setError('')

    try {
      const { data, error } = await supabase.storage
        .from('study-resources')
        .createSignedUrl(item.file_path, 300)

      if (error) throw error

      window.open(data.signedUrl, '_blank', 'noopener,noreferrer')
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'Unable to open this file.'
      )
    } finally {
      setOpeningFile(null)
    }
  }

  function getSubjectName(item: Resource) {
    const linkedSubject = subjects.find(
      subject => subject.id === item.subject_id
    )

    return linkedSubject?.name || item.subject || 'General resource'
  }

  const heading = headings[type]

  return (
    <section className="page">
      <div className="page-heading">
        <h1>{heading.title}</h1>
        <p>{heading.description}</p>
      </div>

      <div className="resource-filters">
        <label>
          Degree
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
          Subject
          <select
            value={subjectId}
            onChange={e => setSubjectId(e.target.value)}
          >
            <option value="all">All subjects</option>
            {availableSubjects.map(item => (
              <option value={item.id} key={item.id}>
                {item.name} — {
                  item.term === 'foundation_1'
                    ? 'Foundation Term 1'
                    : 'Foundation Term 2'
                }
              </option>
            ))}
          </select>
        </label>

        <label>
          Search
          <div className="search-input">
            <Search size={17} />
            <input
              type="search"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search resources..."
            />
          </div>
        </label>
      </div>

      {loading && <p>Loading resources...</p>}

      {error && <p role="alert">{error}</p>}

      {!loading && !error && visible.length === 0 && (
        <div className="empty-state">
          <BookOpen size={26} />
          <h2>
            {items.length === 0
              ? 'No published resources yet'
              : 'No matching resources found'}
          </h2>
          <p>
            {items.length === 0
              ? 'Resources will appear here once they are published.'
              : 'Try changing your search or filters.'}
          </p>
        </div>
      )}

      {!loading && !error && visible.length > 0 && (
        <div className="resource-grid">
          {visible.map(item => {
            const linkedSubject = subjects.find(
              subject => subject.id === item.subject_id
            )

            return (
              <article className="resource-card" key={item.id}>
                <div className="eyebrow">
                  {item.degree === 'ds'
                    ? 'Data Science and Applications'
                    : item.degree === 'mg'
                      ? 'Management and Data Science'
                      : item.degree}
                </div>

                <h3>{item.title}</h3>

                <p>{getSubjectName(item)}</p>

                {linkedSubject && (
                  <p className="eyebrow">
                    {linkedSubject.term === 'foundation_1'
                      ? 'Foundation Term 1'
                      : 'Foundation Term 2'}
                  </p>
                )}

                {item.week && <p>Week {item.week}</p>}

                {item.description && <p>{item.description}</p>}

                {item.url && (
                  <a
                    className="primary"
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <ExternalLink size={15} />
                    Open resource
                  </a>
                )}

                {item.file_path && (
                  <button
                    className="outline"
                    type="button"
                    disabled={openingFile === item.id}
                    onClick={() => void openFile(item)}
                  >
                    <FileDown size={16} />
                    {openingFile === item.id
                      ? 'Preparing file...'
                      : 'View / Download file'}
                  </button>
                )}
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}


import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  Youtube,
  Trash2,
  Pencil,
  X,
  ExternalLink,
} from 'lucide-react'
import { supabase } from '../lib/supabase'

type Subject = {
  id: string
  name: string
  degree: string
  term: string
}

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

export function StudioLectures() {
  const [lectures, setLectures] = useState<Lecture[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [editing, setEditing] = useState<Lecture | null>(null)

  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')
  const [subjectId, setSubjectId] = useState('')
  const [degree, setDegree] = useState('ds')
  const [description, setDescription] = useState('')

  const [message, setMessage] = useState('Loading lectures...')
  const [saving, setSaving] = useState(false)

  async function loadSubjects() {
    if (!supabase) return

    const { data, error } = await supabase
      .from('study_subjects')
      .select('id, name, degree, term')
      .order('name')

    if (error) {
      setMessage(error.message)
      return
    }

    setSubjects(data || [])
  }

  async function loadLectures() {
    if (!supabase) {
      setMessage('Supabase is not configured.')
      return
    }

    const { data, error } = await supabase
      .from('study_resources')
      .select('*')
      .eq('type', 'lecture')
      .order('created_at', { ascending: false })

    if (error) {
      setMessage(error.message)
      return
    }

    setLectures(data || [])
    setMessage(data?.length ? '' : 'No lectures published yet.')
  }

  useEffect(() => {
    void loadSubjects()
    void loadLectures()
  }, [])

  const availableSubjects = subjects.filter(
    subject => subject.degree === degree
  )

  const selectedSubject = subjects.find(
    subject => subject.id === subjectId
  )

  function resetForm() {
    setEditing(null)
    setTitle('')
    setUrl('')
    setSubjectId('')
    setDegree('ds')
    setDescription('')
  }

  function startEditing(lecture: Lecture) {
    setEditing(lecture)
    setTitle(lecture.title)
    setUrl(lecture.url || '')
    setDegree(lecture.degree)
    setDescription(lecture.description || '')

    const matchingSubject = subjects.find(
      subject =>
        subject.id === lecture.subject_id ||
        (!lecture.subject_id &&
          subject.name === lecture.subject &&
          subject.degree === lecture.degree)
    )

    setSubjectId(matchingSubject?.id || '')
    setMessage('')

    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function saveLecture(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()

    if (!supabase) {
      setMessage('Supabase is not configured.')
      return
    }

    if (!title.trim() || !url.trim()) {
      setMessage('Lecture title and YouTube URL are required.')
      return
    }

    try {
      const parsedUrl = new URL(url.trim())

      if (
        !['youtube.com', 'www.youtube.com', 'youtu.be', 'm.youtube.com']
          .includes(parsedUrl.hostname)
      ) {
        setMessage('Please enter a valid YouTube video or playlist URL.')
        return
      }
    } catch {
      setMessage('Please enter a valid YouTube URL.')
      return
    }

    setSaving(true)
    setMessage(editing ? 'Saving changes...' : 'Publishing...')

    try {
      const lectureData = {
        title: title.trim(),
        url: url.trim(),
        subject_id: subjectId || null,
        subject: selectedSubject?.name || null,
        degree,
        description: description.trim() || null,
        type: 'lecture' as const,
      }

      if (editing) {
        const { error } = await supabase
          .from('study_resources')
          .update(lectureData)
          .eq('id', editing.id)

        if (error) throw error

        setMessage('Lecture updated successfully.')
      } else {
        const { error } = await supabase
          .from('study_resources')
          .insert(lectureData)

        if (error) throw error

        setMessage('Lecture published successfully.')
      }

      resetForm()
      await loadLectures()
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : 'Unable to save lecture.'
      )
    } finally {
      setSaving(false)
    }
  }

  async function deleteLecture(lecture: Lecture) {
    if (!supabase) return

    if (!confirm(`Delete "${lecture.title}"?`)) return

    const { error } = await supabase
      .from('study_resources')
      .delete()
      .eq('id', lecture.id)

    if (error) {
      setMessage(error.message)
      return
    }

    if (editing?.id === lecture.id) {
      resetForm()
    }

    setMessage('Lecture deleted successfully.')
    await loadLectures()
  }

  return (
    <section className="page">
      <Link to="/studio" className="studio-back">
        <ArrowLeft size={16} /> Back to Creator Studio
      </Link>

      <div className="eyebrow">CONTENT MANAGEMENT</div>
      <h1>Manage Lectures</h1>
      <p>Publish and manage your YouTube lectures.</p>

      <div className="resource-card">
        <h3>
          <Youtube size={22} />
          {editing ? 'Edit lecture' : 'Add a new lecture'}
        </h3>

        <form onSubmit={saveLecture} className="studio-form">
          <label>
            Lecture title
            <input
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Enter lecture title"
            />
          </label>

          <label>
            YouTube URL
            <input
              required
              type="url"
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
            />
          </label>

          <label>
            Degree
            <select
              value={degree}
              onChange={e => {
                setDegree(e.target.value)
                setSubjectId('')
              }}
            >
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
              <option value="">Select a subject (optional)</option>
              {availableSubjects.map(subject => (
                <option value={subject.id} key={subject.id}>
                  {subject.name} — {
                    subject.term === 'foundation_1'
                      ? 'Foundation Term 1'
                      : 'Foundation Term 2'
                  }
                </option>
              ))}
            </select>
          </label>

          <label>
            Description
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Lecture description"
              rows={3}
            />
          </label>

          <button type="submit" disabled={saving}>
            <Youtube size={16} />
            {saving
              ? 'Saving...'
              : editing
                ? 'Save Changes'
                : 'Publish Lecture'}
          </button>

          {editing && (
            <button
              type="button"
              className="outline"
              onClick={resetForm}
              disabled={saving}
            >
              <X size={16} /> Cancel Editing
            </button>
          )}
        </form>

        {message && <p role="status">{message}</p>}
      </div>

      <div className="section">
        <h2>Published lectures ({lectures.length})</h2>

        <div className="resource-grid">
          {lectures.map(lecture => (
            <article className="resource-card" key={lecture.id}>
              <h3>{lecture.title}</h3>
              <p>{lecture.subject || 'No subject'} · {lecture.degree}</p>

              {lecture.description && <p>{lecture.description}</p>}

              {lecture.url && (
                <a href={lecture.url} target="_blank" rel="noreferrer">
                  <ExternalLink size={15} /> Watch lecture
                </a>
              )}

              <button
                type="button"
                className="outline"
                onClick={() => startEditing(lecture)}
              >
                <Pencil size={16} /> Edit
              </button>

              <button
                type="button"
                className="outline"
                onClick={() => void deleteLecture(lecture)}
              >
                <Trash2 size={16} /> Delete
              </button>
            </article>
          ))}
        </div>

        {!lectures.length && <p>{message || 'No lectures available.'}</p>}
      </div>
    </section>
  )
}

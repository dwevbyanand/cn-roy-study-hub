
import { useEffect, useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'

type Subject = {
  id: string
  name: string
  degree: string
  term: string
}

type GASolution = {
  id: string
  title: string
  description: string | null
  subject_id: string | null
  subject: string | null
  degree: string
  url: string | null
  week: number | null
  created_at: string
}

const emptyForm = {
  title: '',
  description: '',
  subject_id: '',
  degree: 'ds',
  url: '',
  week: '1',
}

export function StudioGASolutions() {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [solutions, setSolutions] = useState<GASolution[]>([])
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  async function loadData() {
    if (!supabase) {
      setError('Supabase is not configured.')
      setLoading(false)
      return
    }

    const [subjectResult, solutionResult] = await Promise.all([
      supabase
        .from('study_subjects')
        .select('id, name, degree, term')
        .order('name'),

      supabase
        .from('study_resources')
        .select('*')
        .eq('type', 'ga_solution')
        .order('week', { ascending: true })
        .order('created_at', { ascending: false }),
    ])

    if (subjectResult.error) {
      setError(subjectResult.error.message)
    } else {
      setSubjects(subjectResult.data || [])
    }

    if (solutionResult.error) {
      setError(solutionResult.error.message)
    } else {
      setSolutions(solutionResult.data || [])
    }

    setLoading(false)
  }

  useEffect(() => {
    void loadData()
  }, [])

  const availableSubjects = subjects.filter(
    subject => subject.degree === form.degree
  )

  function resetForm() {
    setForm(emptyForm)
    setEditingId(null)
    setError('')
  }

  function startEdit(solution: GASolution) {
    setEditingId(solution.id)
    setForm({
      title: solution.title,
      description: solution.description || '',
      subject_id: solution.subject_id || '',
      degree: solution.degree,
      url: solution.url || '',
      week: String(solution.week || 1),
    })
    setMessage('')
    setError('')
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!supabase) return

    if (!form.subject_id) {
      setError('Please select a subject.')
      return
    }

    const selectedSubject = subjects.find(
      subject => subject.id === form.subject_id
    )

    if (!selectedSubject) {
      setError('Selected subject could not be found.')
      return
    }

    try {
      const parsedUrl = new URL(form.url)

      if (
        !['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be'].includes(
          parsedUrl.hostname
        )
      ) {
        setError('Please enter a valid YouTube URL.')
        return
      }
    } catch {
      setError('Please enter a valid YouTube URL.')
      return
    }

    const week = Number(form.week)

    if (!Number.isInteger(week) || week < 1) {
      setError('Week must be a positive whole number.')
      return
    }

    setSaving(true)
    setError('')
    setMessage('')

    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      subject_id: selectedSubject.id,
      subject: selectedSubject.name,
      degree: selectedSubject.degree,
      url: form.url.trim(),
      week,
      type: 'ga_solution',
    }

    const result = editingId
      ? await supabase
          .from('study_resources')
          .update(payload)
          .eq('id', editingId)
      : await supabase
          .from('study_resources')
          .insert(payload)

    if (result.error) {
      setError(result.error.message)
    } else {
      setMessage(editingId ? 'GA solution updated.' : 'GA solution added.')
      resetForm()
      await loadData()
    }

    setSaving(false)
  }

  async function deleteSolution(id: string) {
    if (!supabase) return

    const confirmed = window.confirm(
      'Are you sure you want to delete this GA solution?'
    )

    if (!confirmed) return

    const { error } = await supabase
      .from('study_resources')
      .delete()
      .eq('id', id)

    if (error) {
      setError(error.message)
    } else {
      setSolutions(current => current.filter(item => item.id !== id))
      setMessage('GA solution deleted.')
    }
  }

  function getSubjectName(solution: GASolution) {
    return (
      subjects.find(subject => subject.id === solution.subject_id)?.name ||
      solution.subject ||
      'General'
    )
  }

  return (
    <div className="studio-page">
      <div className="page-heading">
        <h1>GA Solutions</h1>
        <p>Manage graded assignment solution videos by subject and week.</p>
      </div>

      <section className="studio-panel">
        <h2>{editingId ? 'Edit GA Solution' : 'Add GA Solution'}</h2>

        <form className="studio-form" onSubmit={handleSubmit}>
          <label>
            Video title
            <input
              required
              value={form.title}
              onChange={event =>
                setForm({ ...form, title: event.target.value })
              }
              placeholder="Week 1 Statistics GA Solution"
            />
          </label>

          <label>
            Degree
            <select
              value={form.degree}
              onChange={event =>
                setForm({
                  ...form,
                  degree: event.target.value,
                  subject_id: '',
                })
              }
            >
              <option value="ds">Data Science and Applications</option>
              <option value="mg">Management and Data Science</option>
            </select>
          </label>

          <label>
            Subject
            <select
              required
              value={form.subject_id}
              onChange={event =>
                setForm({ ...form, subject_id: event.target.value })
              }
            >
              <option value="">Select a subject</option>
              {availableSubjects.map(subject => (
                <option key={subject.id} value={subject.id}>
                  {subject.name} — {subject.term === 'foundation_1'
                    ? 'Foundation Term 1'
                    : 'Foundation Term 2'}
                </option>
              ))}
            </select>
          </label>

          <label>
            Week
            <input
              type="number"
              min="1"
              step="1"
              required
              value={form.week}
              onChange={event =>
                setForm({ ...form, week: event.target.value })
              }
            />
          </label>

          <label>
            YouTube URL
            <input
              type="url"
              required
              value={form.url}
              onChange={event =>
                setForm({ ...form, url: event.target.value })
              }
              placeholder="https://www.youtube.com/watch?v=..."
            />
          </label>

          <label>
            Description
            <textarea
              value={form.description}
              onChange={event =>
                setForm({ ...form, description: event.target.value })
              }
              placeholder="Optional explanation..."
              rows={3}
            />
          </label>

          {error && <p role="alert">{error}</p>}
          {message && <p>{message}</p>}

          <div className="form-actions">
            <button type="submit" disabled={saving}>
              {saving
                ? 'Saving...'
                : editingId
                  ? 'Update GA Solution'
                  : 'Add GA Solution'}
            </button>

            {editingId && (
              <button type="button" onClick={resetForm}>
                Cancel
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="studio-panel">
        <h2>Published GA Solutions ({solutions.length})</h2>

        {loading && <p>Loading GA solutions...</p>}

        {!loading && solutions.length === 0 && (
          <p>No GA solutions have been added yet.</p>
        )}

        <div className="studio-list">
          {solutions.map(solution => (
            <article className="studio-list-item" key={solution.id}>
              <div>
                <span className="eyebrow">
                  {getSubjectName(solution)} · Week {solution.week || 1}
                </span>
                <h3>{solution.title}</h3>
                <p>
                  {solution.degree === 'ds'
                    ? 'Data Science and Applications'
                    : 'Management and Data Science'}
                </p>
              </div>

              <div className="form-actions">
                <button type="button" onClick={() => startEdit(solution)}>
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => void deleteSolution(solution.id)}
                >
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}


import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  BookOpen,
  Pencil,
  Trash2,
  X,
  Plus,
} from 'lucide-react'
import { supabase } from '../lib/supabase'

type Subject = {
  id: string
  name: string
  degree: string
  term: string
  description: string | null
}

function getErrorMessage(error: unknown): string {
  if (
    typeof error === 'object' &&
    error !== null &&
    'message' in error
  ) {
    return String(error.message)
  }

  return String(error)
}

export function StudioSubjects() {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [editing, setEditing] = useState<Subject | null>(null)

  const [name, setName] = useState('')
  const [degree, setDegree] = useState('ds')
  const [term, setTerm] = useState('foundation_1')
  const [description, setDescription] = useState('')

  const [message, setMessage] = useState('Loading subjects...')
  const [saving, setSaving] = useState(false)

  async function loadSubjects() {
    if (!supabase) {
      setMessage('Supabase is not configured.')
      return
    }

    const { data, error } = await supabase
      .from('study_subjects')
      .select('*')
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Load subjects error:', error)
      setMessage(error.message)
      return
    }

    setSubjects(data || [])
    setMessage(data?.length ? '' : 'No subjects added yet.')
  }

  useEffect(() => {
    void loadSubjects()
  }, [])

  function resetForm() {
    setEditing(null)
    setName('')
    setDegree('ds')
    setTerm('foundation_1')
    setDescription('')
  }

  function startEditing(subject: Subject) {
    setEditing(subject)
    setName(subject.name)
    setDegree(subject.degree)
    setTerm(subject.term)
    setDescription(subject.description || '')
    setMessage('')

    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function saveSubject(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()

    if (!supabase) {
      setMessage('Supabase is not configured.')
      return
    }

    if (!name.trim()) {
      setMessage('Please enter a subject name.')
      return
    }

    setSaving(true)
    setMessage(editing ? 'Saving changes...' : 'Adding subject...')

    const subjectData = {
      name: name.trim(),
      degree,
      term,
      description: description.trim() || null,
    }

    try {
      if (editing) {
        const { error } = await supabase
          .from('study_subjects')
          .update(subjectData)
          .eq('id', editing.id)

        if (error) throw error

        setMessage('Subject updated successfully.')
      } else {
        const { error } = await supabase
          .from('study_subjects')
          .insert(subjectData)

        if (error) throw error

        setMessage('Subject added successfully.')
      }

      resetForm()
      await loadSubjects()
    } catch (error: unknown) {
      console.error('Save subject error:', error)
      setMessage(`Unable to save subject: ${getErrorMessage(error)}`)
    } finally {
      setSaving(false)
    }
  }

  async function deleteSubject(subject: Subject) {
    if (!supabase) {
      setMessage('Supabase is not configured.')
      return
    }

    if (!confirm(`Delete "${subject.name}"?`)) return

    const { error } = await supabase
      .from('study_subjects')
      .delete()
      .eq('id', subject.id)

    if (error) {
      console.error('Delete subject error:', error)
      setMessage(`Unable to delete subject: ${error.message}`)
      return
    }

    if (editing?.id === subject.id) {
      resetForm()
    }

    setMessage('Subject deleted successfully.')
    await loadSubjects()
  }

  const termLabel = (value: string) =>
    value === 'foundation_2'
      ? 'Foundation Term 2'
      : 'Foundation Term 1'

  return (
    <section className="page">
      <Link to="/studio" className="studio-back">
        <ArrowLeft size={16} />
        Back to Creator Studio
      </Link>

      <div className="page-heading">
        <div className="eyebrow">CONTENT MANAGEMENT</div>
        <h1>Manage Subjects</h1>
        <p>Create and organize Foundation subjects.</p>
      </div>

      <div className="panel">
        <h2>{editing ? 'Edit Subject' : 'Add New Subject'}</h2>

        <form className="studio-form" onSubmit={saveSubject}>
          <label>
            Subject Name
            <input
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Mathematics 1"
            />
          </label>

          <label>
            Degree
            <select
              value={degree}
              onChange={e => setDegree(e.target.value)}
            >
              <option value="ds">Data Science and Applications</option>
              <option value="mg">Management and Data Science</option>
            </select>
          </label>

          <label>
            Foundation Term
            <select
              value={term}
              onChange={e => setTerm(e.target.value)}
            >
              <option value="foundation_1">Foundation Term 1</option>
              <option value="foundation_2">Foundation Term 2</option>
            </select>
          </label>

          <label>
            Description
            <textarea
              rows={3}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Optional subject description"
            />
          </label>

          <button type="submit" disabled={saving}>
            {editing ? <Pencil size={16} /> : <Plus size={16} />}
            {saving
              ? 'Saving...'
              : editing
                ? 'Save Changes'
                : 'Add Subject'}
          </button>

          {editing && (
            <button
              type="button"
              className="outline"
              onClick={resetForm}
              disabled={saving}
            >
              <X size={16} />
              Cancel Editing
            </button>
          )}
        </form>

        {message && <p role="status">{message}</p>}
      </div>

      <section className="section">
        <h2>Subjects ({subjects.length})</h2>

        <div className="resource-grid">
          {subjects.map(subject => (
            <article className="resource-card" key={subject.id}>
              <BookOpen size={22} />

              <h3>{subject.name}</h3>

              <p>
                {subject.degree === 'ds'
                  ? 'Data Science and Applications'
                  : 'Management and Data Science'}
              </p>

              <span className="eyebrow">
                {termLabel(subject.term)}
              </span>

              {subject.description && (
                <p>{subject.description}</p>
              )}

              <button
                type="button"
                className="outline"
                onClick={() => startEditing(subject)}
              >
                <Pencil size={16} />
                Edit
              </button>

              <button
                type="button"
                className="outline"
                onClick={() => void deleteSubject(subject)}
              >
                <Trash2 size={16} />
                Delete
              </button>
            </article>
          ))}
        </div>
      </section>
    </section>
  )
}


import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  Trash2,
  Upload,
  Pencil,
  X,
  ExternalLink,
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
  type: ResourceType
  url: string | null
  file_path: string | null
  week: number | null
}

const settings = {
  note: {
    heading: 'Manage Notes',
    description: 'Upload and organize study notes.',
    button: 'Publish Note',
  },
  past_paper: {
    heading: 'Manage Past Papers',
    description: 'Upload previous-year question papers.',
    button: 'Publish Paper',
  },
  course: {
    heading: 'Manage Courses',
    description: 'Add courses and learning resources.',
    button: 'Publish Course',
  },
}

export function StudioResourceManager({
  type,
}: {
  type: ResourceType
}) {
  const config = settings[type]

  const [items, setItems] = useState<Resource[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [editing, setEditing] = useState<Resource | null>(null)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [subjectId, setSubjectId] = useState('')
  const [degree, setDegree] = useState('ds')
  const [url, setUrl] = useState('')
  const [week, setWeek] = useState('')
  const [file, setFile] = useState<File | null>(null)

  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)
  const [openingFile, setOpeningFile] = useState<string | null>(null)

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

  async function loadItems() {
    if (!supabase) return

    const { data, error } = await supabase
      .from('study_resources')
      .select('*')
      .eq('type', type)
      .order('created_at', { ascending: false })

    if (error) {
      setMessage(error.message)
      return
    }

    setItems(data || [])
  }

  useEffect(() => {
    void loadSubjects()
    void loadItems()
  }, [type])

  const availableSubjects = subjects.filter(
    subject => subject.degree === degree
  )

  const selectedSubject = subjects.find(
    subject => subject.id === subjectId
  )

  function resetForm() {
    setEditing(null)
    setTitle('')
    setDescription('')
    setSubjectId('')
    setDegree('ds')
    setUrl('')
    setWeek('')
    setFile(null)

    const input = document.getElementById(
      'resource-file'
    ) as HTMLInputElement | null

    if (input) input.value = ''
  }

  function startEditing(item: Resource) {
    setEditing(item)
    setTitle(item.title)
    setDescription(item.description || '')
    setDegree(item.degree)
    setUrl(item.url || '')
    setWeek(item.week?.toString() || '')
    setFile(null)

    const matchingSubject = subjects.find(
      subject =>
        subject.id === item.subject_id ||
        (!item.subject_id &&
          subject.name === item.subject &&
          subject.degree === item.degree)
    )

    setSubjectId(matchingSubject?.id || '')

    const input = document.getElementById(
      'resource-file'
    ) as HTMLInputElement | null

    if (input) input.value = ''

    setMessage('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function saveResource(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()

    if (!supabase) {
      setMessage('Supabase is not configured.')
      return
    }

    if (!title.trim()) {
      setMessage('Please enter a title.')
      return
    }

    if (!file && !url.trim() && !editing?.file_path) {
      setMessage('Add a resource link or upload a file.')
      return
    }

    setSaving(true)
    setMessage(editing ? 'Saving changes...' : 'Publishing...')

    let newFilePath: string | null = null

    try {
      if (file) {
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-')
        newFilePath = `${type}/${crypto.randomUUID()}-${safeName}`

        const { error: uploadError } = await supabase.storage
          .from('study-resources')
          .upload(newFilePath, file)

        if (uploadError) throw uploadError
      }

      const resourceData = {
        title: title.trim(),
        description: description.trim() || null,
        subject_id: subjectId || null,
        subject: selectedSubject?.name || null,
        degree,
        type,
        url: url.trim() || null,
        file_path: newFilePath || editing?.file_path || null,
        week: type === 'note' && week ? Number(week) : null,
      }

      if (editing) {
        const { error } = await supabase
          .from('study_resources')
          .update(resourceData)
          .eq('id', editing.id)

        if (error) throw error

        if (newFilePath && editing.file_path) {
          const { error: cleanupError } = await supabase.storage
            .from('study-resources')
            .remove([editing.file_path])

          if (cleanupError) {
            setMessage(
              `Changes saved, but old file cleanup failed: ${cleanupError.message}`
            )
          } else {
            setMessage('Resource updated successfully.')
          }
        } else {
          setMessage('Resource updated successfully.')
        }
      } else {
        const { error } = await supabase
          .from('study_resources')
          .insert(resourceData)

        if (error) throw error

        setMessage('Resource published successfully.')
      }

      resetForm()
      await loadItems()
    } catch (error) {
      if (newFilePath) {
        await supabase.storage
          .from('study-resources')
          .remove([newFilePath])
      }

      setMessage(
        error instanceof Error ? error.message : 'Something went wrong.'
      )
    } finally {
      setSaving(false)
    }
  }

  async function removeItem(item: Resource) {
    if (!supabase) return

    if (!confirm(`Delete "${item.title}"?`)) return

    const { error } = await supabase
      .from('study_resources')
      .delete()
      .eq('id', item.id)

    if (error) {
      setMessage(error.message)
      return
    }

    if (item.file_path) {
      const { error: storageError } = await supabase.storage
        .from('study-resources')
        .remove([item.file_path])

      if (storageError) {
        setMessage(
          `Resource deleted, but file cleanup failed: ${storageError.message}`
        )
      } else {
        setMessage('Resource deleted successfully.')
      }
    } else {
      setMessage('Resource deleted successfully.')
    }

    if (editing?.id === item.id) resetForm()

    await loadItems()
  }

  async function openUploadedFile(item: Resource) {
    if (!supabase || !item.file_path) return

    setOpeningFile(item.id)
    setMessage('Preparing file...')

    try {
      const { data, error } = await supabase.storage
        .from('study-resources')
        .createSignedUrl(item.file_path, 300)

      if (error) throw error

      window.location.assign(data.signedUrl)
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : 'Unable to open file.'
      )
      setOpeningFile(null)
    }
  }

  return (
    <section className="page">
      <Link to="/studio" className="studio-back">
        <ArrowLeft size={16} /> Back to Creator Studio
      </Link>

      <div className="page-heading">
        <div className="eyebrow">CONTENT MANAGEMENT</div>
        <h1>{config.heading}</h1>
        <p>{config.description}</p>
      </div>

      <div className="panel">
        <h2>{editing ? 'Edit resource' : 'Add new resource'}</h2>

        <form className="studio-form" onSubmit={saveResource}>
          <label>
            Title
            <input
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Resource title"
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

          {type === 'note' && (
            <label>
              Week number (optional)
              <input
                type="number"
                min="1"
                max="52"
                value={week}
                onChange={e => setWeek(e.target.value)}
              />
            </label>
          )}

          <label>
            Description
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
              placeholder="Describe this resource"
            />
          </label>

          <label>
            Resource URL (optional if a file is uploaded)
            <input
              type="url"
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="https://..."
            />
          </label>

          <label>
            {editing
              ? 'Replace uploaded file (optional)'
              : 'Upload PDF or image (optional)'}
            <input
              id="resource-file"
              type="file"
              accept=".pdf,image/png,image/jpeg,image/webp"
              onChange={e => setFile(e.target.files?.[0] || null)}
            />
          </label>

          {editing?.file_path && !file && (
            <p>
              The existing uploaded file will be kept unless you select a replacement.
            </p>
          )}

          <button className="primary" type="submit" disabled={saving}>
            <Upload size={16} />
            {saving
              ? 'Saving...'
              : editing
                ? 'Save Changes'
                : config.button}
          </button>

          {editing && (
            <button
              className="outline"
              type="button"
              onClick={resetForm}
              disabled={saving}
            >
              <X size={16} /> Cancel Editing
            </button>
          )}

          {message && <p role="status">{message}</p>}
        </form>
      </div>

      <section className="section">
        <h2>Published resources ({items.length})</h2>

        <div className="resource-grid">
          {items.map(item => (
            <article className="resource-card" key={item.id}>
              <h3>{item.title}</h3>
              <p>{item.subject || 'No subject'} · {item.degree}</p>

              {item.week && <p>Week {item.week}</p>}
              {item.description && <p>{item.description}</p>}

              {item.url && (
                <a href={item.url} target="_blank" rel="noreferrer">
                  Open resource link
                </a>
              )}

              {item.file_path && (
                <button
                  type="button"
                  className="outline"
                  disabled={openingFile === item.id}
                  onClick={() => void openUploadedFile(item)}
                >
                  <ExternalLink size={14} />
                  {openingFile === item.id
                    ? 'Preparing...'
                    : 'Open uploaded file'}
                </button>
              )}

              <button
                type="button"
                className="outline"
                onClick={() => startEditing(item)}
              >
                <Pencil size={16} /> Edit
              </button>

              <button
                type="button"
                className="outline"
                onClick={() => void removeItem(item)}
              >
                <Trash2 size={16} /> Delete
              </button>
            </article>
          ))}
        </div>
      </section>
    </section>
  )
}


import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  Youtube,
  FileText,
  BookOpen,
  GraduationCap,
  Users,
  Layers,
  RefreshCw,
} from 'lucide-react'
import { supabase } from '../lib/supabase'

type Stats = {
  lectures: number
  notes: number
  pastPapers: number
  courses: number
  students: number
  totalResources: number
}

const initialStats: Stats = {
  lectures: 0,
  notes: 0,
  pastPapers: 0,
  courses: 0,
  students: 0,
  totalResources: 0,
}

export function StudioAnalytics() {
  const [stats, setStats] = useState<Stats>(initialStats)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function loadAnalytics() {
    if (!supabase) {
      setError('Supabase is not configured.')
      setLoading(false)
      return
    }

    setLoading(true)
    setError('')

    const [lectures, notes, papers, courses, students, total] =
      await Promise.all([
        supabase.from('study_resources')
          .select('id', { count: 'exact', head: true })
          .eq('type', 'lecture'),

        supabase.from('study_resources')
          .select('id', { count: 'exact', head: true })
          .eq('type', 'note'),

        supabase.from('study_resources')
          .select('id', { count: 'exact', head: true })
          .eq('type', 'past_paper'),

        supabase.from('study_resources')
          .select('id', { count: 'exact', head: true })
          .eq('type', 'course'),

        supabase.from('profiles')
          .select('id', { count: 'exact', head: true })
          .eq('role', 'student'),

        supabase.from('study_resources')
          .select('id', { count: 'exact', head: true }),
      ])

    const firstError =
      lectures.error ||
      notes.error ||
      papers.error ||
      courses.error ||
      students.error ||
      total.error

    if (firstError) {
      setError(firstError.message)
      setLoading(false)
      return
    }

    setStats({
      lectures: lectures.count ?? 0,
      notes: notes.count ?? 0,
      pastPapers: papers.count ?? 0,
      courses: courses.count ?? 0,
      students: students.count ?? 0,
      totalResources: total.count ?? 0,
    })

    setLoading(false)
  }

  useEffect(() => {
    void loadAnalytics()
  }, [])

  const cards = [
    {
      title: 'Lectures',
      value: stats.lectures,
      icon: Youtube,
    },
    {
      title: 'Notes',
      value: stats.notes,
      icon: FileText,
    },
    {
      title: 'Past Papers',
      value: stats.pastPapers,
      icon: BookOpen,
    },
    {
      title: 'Courses',
      value: stats.courses,
      icon: GraduationCap,
    },
    {
      title: 'Students',
      value: stats.students,
      icon: Users,
    },
    {
      title: 'Total Resources',
      value: stats.totalResources,
      icon: Layers,
    },
  ]

  return (
    <section className="page">
      <Link to="/studio" className="studio-back">
        <ArrowLeft size={16} />
        Back to Creator Studio
      </Link>

      <div className="eyebrow">PLATFORM OVERVIEW</div>
      <h1>Analytics</h1>
      <p>Understand your study hub's content and student activity.</p>

      <button
        type="button"
        className="outline"
        onClick={() => void loadAnalytics()}
        disabled={loading}
      >
        <RefreshCw size={16} />
        {loading ? 'Loading...' : 'Refresh statistics'}
      </button>

      {error && (
        <div className="empty-state" role="alert">
          {error}
        </div>
      )}

      {!error && (
        <>
          <div className="resource-grid analytics-grid">
            {cards.map(({ title, value, icon: Icon }) => (
              <article className="resource-card" key={title}>
                <div className="studio-stat-icon">
                  <Icon size={24} />
                </div>

                <p>{title}</p>

                <h2>{loading ? '—' : value}</h2>
              </article>
            ))}
          </div>

          <section className="section">
            <h2>Content distribution</h2>
            <p>
              The counts above are retrieved from your
              Supabase database. Refresh to retrieve the latest values.
            </p>
          </section>
        </>
      )}
    </section>
  )
}

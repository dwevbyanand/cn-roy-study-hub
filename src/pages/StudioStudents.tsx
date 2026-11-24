
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Users, GraduationCap, ShieldCheck } from 'lucide-react'
import { supabase } from '../lib/supabase'

export function StudioStudents() {
  const [students, setStudents] = useState(0)
  const [admins, setAdmins] = useState(0)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    async function loadStats() {
      if (!supabase) {
        setError('Supabase is not configured.')
        setLoading(false)
        return
      }

      const [studentResult, adminResult, totalResult] =
        await Promise.all([
          supabase
            .from('profiles')
            .select('id', { count: 'exact', head: true })
            .eq('role', 'student'),

          supabase
            .from('profiles')
            .select('id', { count: 'exact', head: true })
            .eq('role', 'admin'),

          supabase
            .from('profiles')
            .select('id', { count: 'exact', head: true }),
        ])

      if (!active) return

      const queryError =
        studentResult.error ||
        adminResult.error ||
        totalResult.error

      if (queryError) {
        setError(queryError.message)
      } else {
        setStudents(studentResult.count ?? 0)
        setAdmins(adminResult.count ?? 0)
        setTotal(totalResult.count ?? 0)
      }

      setLoading(false)
    }

    void loadStats()

    return () => {
      active = false
    }
  }, [])

  const cards = [
    {
      title: 'Registered Students',
      value: students,
      description: 'Accounts with student access',
      icon: GraduationCap,
    },
    {
      title: 'Administrators',
      value: admins,
      description: 'Accounts with admin access',
      icon: ShieldCheck,
    },
    {
      title: 'Total Accounts',
      value: total,
      description: 'All registered profiles',
      icon: Users,
    },
  ]

  return (
    <section className="page">
      <Link to="/studio" className="studio-back">
        <ArrowLeft size={16} />
        Back to Creator Studio
      </Link>

      <div className="eyebrow">ADMINISTRATION</div>

      <h1>Students</h1>

      <p>
        Overview of registered accounts on CN Roy Study Hub.
      </p>

      {loading && <p>Loading account statistics...</p>}

      {error && (
        <div className="empty-state" role="alert">
          <p>{error}</p>
        </div>
      )}

      {!loading && !error && (
        <div className="resource-grid studio-stats">
          {cards.map(({ title, value, description, icon: Icon }) => (
            <article className="resource-card" key={title}>
              <div className="studio-stat-icon">
                <Icon size={25} />
              </div>

              <p>{title}</p>

              <h2>{value}</h2>

              <p>{description}</p>
            </article>
          ))}
        </div>
      )}

      <div className="section">
        <h2>Account overview</h2>
        <p>
          These figures are read from your Supabase profiles table.
          Student email addresses and private account information
          are not displayed here.
        </p>
      </div>
    </section>
  )
}


import { NavLink, Outlet } from 'react-router-dom'
import {
  BookOpen, Calculator, FileText, GraduationCap,
  Home, Info, Library, Menu, Youtube, Settings, LogIn
} from 'lucide-react'
import { useState } from 'react'
import { useAdminAccess } from '../lib/useAdminAccess'

const nav = [
  { to: '/', label: 'Overview', icon: Home, end: true },
  { to: '/lectures', label: 'Lectures', icon: Youtube },
  { to: '/ga-solutions', label: 'GA Solutions', icon: BookOpen },
  { to: '/notes', label: 'Notes', icon: FileText },
  { to: '/past-papers', label: 'Past Papers', icon: Library },
  { to: '/calculators', label: 'Calculators', icon: Calculator },
  { to: '/courses', label: 'Courses', icon: GraduationCap },
  { to: '/about', label: 'About', icon: Info },
  { to: '/login', label: 'Login', icon: LogIn },
]

export function Layout() {
  const [open, setOpen] = useState(false)
  const { isAdmin, loading } = useAdminAccess()

  return (
    <div className="app-shell">
      <aside className={open ? 'sidebar sidebar-open' : 'sidebar'}>
        <NavLink to="/" className="brand" onClick={() => setOpen(false)}>
          <b>CN</b>
          <span>CN Roy<small>STUDY HUB</small></span>
        </NavLink>

        <nav aria-label="Main navigation">
          {nav.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => setOpen(false)}
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        {!loading && isAdmin && (
          <NavLink
            to="/studio"
            className="studio-link"
            onClick={() => setOpen(false)}
          >
            <Settings size={18} />
            Creator Studio
          </NavLink>
        )}

        <a
          className="studio-link"
          href="https://www.youtube.com/@cn-roy/videos"
          target="_blank"
          rel="noreferrer"
        >
          <Youtube size={18} />
          YouTube channel
        </a>
      </aside>

      <div className="content-shell">
        <header className="topbar">
          <button
            className="menu-button"
            onClick={() => setOpen(v => !v)}
            aria-label="Toggle navigation"
          >
            <Menu />
          </button>

          <span>CN Roy <em>/</em> <strong>Study Hub</strong></span>

          <a
            className="outline"
            href="https://www.youtube.com/@cn-roy/videos"
            target="_blank"
            rel="noreferrer"
          >
            <Youtube size={16} /> @cn-roy
          </a>
        </header>

        <main><Outlet /></main>

        <footer>
          © CN Roy <span>Independent student resource</span>
        </footer>
      </div>
    </div>
  )
}

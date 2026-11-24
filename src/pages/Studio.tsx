
import { Link } from 'react-router-dom'
import {
  BookOpen,
  FileText,
  Youtube,
  GraduationCap,
  Users,
  BarChart3,
  ArrowUpRight,
  Library,
  ClipboardList,
} from 'lucide-react'

const modules = [
  {
    title: 'Subjects',
    description: 'Create and organize Foundation subjects.',
    icon: Library,
    path: '/studio/subjects',
  },
  {
    title: 'Lectures',
    description: 'Manage educational videos and YouTube playlists.',
    icon: Youtube,
    path: '/studio/lectures',
  },
  {
    title: 'GA Solutions',
    description: 'Manage graded assignment solutions by subject and week.',
    icon: ClipboardList,
    path: '/studio/ga-solutions',
  },
  {
    title: 'Notes',
    description: 'Upload, organize and manage study notes.',
    icon: FileText,
    path: '/studio/notes',
  },
  {
    title: 'Past Papers',
    description: 'Manage previous-year question papers.',
    icon: BookOpen,
    path: '/studio/past-papers',
  },
  {
    title: 'Courses',
    description: 'Create and manage courses and subjects.',
    icon: GraduationCap,
    path: '/studio/courses',
  },
  {
    title: 'Students',
    description: 'View registered students and their accounts.',
    icon: Users,
    path: '/studio/students',
  },
  {
    title: 'Analytics',
    description: 'View platform statistics and content activity.',
    icon: BarChart3,
    path: '/studio/analytics',
  },
]

export function Studio() {
  return (
    <section className="page studio-dashboard">
      <div className="eyebrow">ADMINISTRATION</div>
      <h1>Creator Studio</h1>
      <p>Manage CN Roy Study Hub content, students and resources.</p>

      <div className="resource-grid studio-modules">
        {modules.map(({ title, description, icon: Icon, path }) => (
          <Link
            to={path}
            className="resource-card studio-module"
            key={title}
          >
            <div className="studio-module-top">
              <Icon size={25} />
              <ArrowUpRight size={19} />
            </div>
            <h3>{title}</h3>
            <p>{description}</p>
          </Link>
        ))}
      </div>
    </section>
  )
}

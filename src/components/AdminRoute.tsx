
import { Navigate } from 'react-router-dom'
import { useAdminAccess } from '../lib/useAdminAccess'

export function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isAdmin, loading } = useAdminAccess()

  if (loading) {
    return <div className="loading-screen">Verifying administrator access...</div>
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}

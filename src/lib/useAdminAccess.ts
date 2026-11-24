
import { useEffect, useState } from 'react'
import { supabase } from './supabase'

export function useAdminAccess() {
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!supabase) {
      setLoading(false)
      return
    }

    const client = supabase
    let active = true

    async function checkAdmin() {
      const {
        data: { user },
        error: authError,
      } = await client.auth.getUser()

      if (authError || !user) {
        if (active) {
          setIsAdmin(false)
          setLoading(false)
        }
        return
      }

      const { data, error } = await client
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle()

      if (active) {
        setIsAdmin(!error && data?.role === 'admin')
        setLoading(false)
      }
    }

    void checkAdmin()

    const { data: listener } = client.auth.onAuthStateChange(
      (event) => {
        if (event === 'TOKEN_REFRESHED') return
        void checkAdmin()
      }
    )

    return () => {
      active = false
      listener.subscription.unsubscribe()
    }
  }, [])

  return { isAdmin, loading }
}


import { useEffect, useState } from 'react'
import { supabase } from './supabase'

export function useAdminAccess() {
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
 const client = supabase

if (!client) {
  setLoading(false)
  return
}
const supabaseClient = client!
    let active = true
    let requestId = 0

    async function checkAdmin(userId: string | null) {
      const currentRequest = ++requestId

      if (!userId) {
        if (active) {
          setIsAdmin(false)
          setLoading(false)
        }
        return
      }

      setLoading(true)

      const { data, error } = await supabaseClient
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .maybeSingle()

      if (!active || currentRequest !== requestId) return

      setIsAdmin(!error && data?.role === 'admin')
      setLoading(false)
    }

    supabaseClient.auth.getSession().then(({ data }) => {
      if (active) {
        void checkAdmin(data.session?.user.id ?? null)
      }
    })

    const { data: listener } =
      supabaseClient.auth.onAuthStateChange((_event, session) => {
        const userId = session?.user.id ?? null

        setTimeout(() => {
          if (active) void checkAdmin(userId)
        }, 0)
      })

    return () => {
      active = false
      listener.subscription.unsubscribe()
    }
  }, [])

  return { isAdmin, loading }
}

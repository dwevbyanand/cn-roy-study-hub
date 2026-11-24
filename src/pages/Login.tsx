
import { supabase } from '../lib/supabase'
import { useState } from 'react'

export function Login() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function signInWithGoogle() {
    if (!supabase) {
      setError('Supabase is not configured.')
      return
    }

    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    }
  }

  return (
    <section className="login-page">
      <div className="login-card">
        <h1>Welcome to CN Roy Study Hub</h1>
        <p>Sign in to access your student account.</p>

        <button onClick={signInWithGoogle} disabled={loading}>
          {loading ? 'Redirecting...' : 'Continue with Google'}
        </button>

        {error && <p role="alert">{error}</p>}
      </div>
    </section>
  )
}

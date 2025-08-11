import { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Loader2 } from 'lucide-react'

export default function AuthCallback() {
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    // Handle OAuth callbacks
    const params = new URLSearchParams(location.search)
    const from = params.get('from') || '/'
    
    // Give some time for auth state to update
    const timer = setTimeout(() => {
      navigate(from, { replace: true })
    }, 2000)

    return () => clearTimeout(timer)
  }, [location, navigate])

  return (
    <div className="min-h-screen flex items-center justify-center bg-camp-light">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin text-camp-orange mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-camp-dark mb-2">
          Completing authentication...
        </h2>
        <p className="text-cool-1">
          You'll be redirected shortly.
        </p>
      </div>
    </div>
  )
}

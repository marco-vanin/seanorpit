import { Navigate } from 'react-router-dom'

/** `*` — any unknown route falls back to home (no dead ends). */
export function NotFoundRoute() {
  return <Navigate to="/" replace />
}

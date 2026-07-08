import { useEffect, useRef, useState } from 'react'
import { searchArtists, type ArtistHit } from '@/lib/itunes'
import { resolveArtistPhoto } from '@/lib/deezer'

export type SearchStatus = 'idle' | 'searching' | 'results' | 'no-results'

/**
 * Per-slot debounced artist search with a last-query-wins token. Yields the live
 * query + results + status, and resolves each result's Deezer face as it lands
 * (placeholder until then). Paused while the slot is `filled`. `reset()` clears
 * the query + results (used after a pick).
 */
export function useArtistSearch({ filled, otherId }: { filled: boolean; otherId?: number }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<ArtistHit[]>([])
  const [status, setStatus] = useState<SearchStatus>('idle')
  const reqId = useRef(0)

  useEffect(() => {
    if (filled) return
    const q = query.trim()
    if (q.length < 2) {
      reqId.current++ // invalidate any in-flight request
      setResults([])
      setStatus('idle')
      return
    }
    const id = ++reqId.current
    setStatus('searching')
    const timer = window.setTimeout(() => {
      searchArtists(q)
        .then((hits) => {
          if (id !== reqId.current) return // stale — a newer query superseded us
          const filtered = hits.filter((h) => h.artistId !== otherId)
          setResults(filtered)
          setStatus(filtered.length ? 'results' : 'no-results')
          // Resolve each result's Deezer face (one batch per settled query) and
          // swap it into the row as it lands — placeholder until then.
          filtered.forEach((hit) => {
            if (hit.photoUrl) return
            resolveArtistPhoto(hit.artistName)
              .then((photo) => {
                if (id !== reqId.current || !photo) return
                setResults((cur) =>
                  cur.map((h) => (h.artistId === hit.artistId ? { ...h, photoUrl: photo } : h)),
                )
              })
              .catch(() => {})
          })
        })
        .catch(() => {
          if (id !== reqId.current) return
          setResults([])
          setStatus('no-results')
        })
    }, 300)
    return () => window.clearTimeout(timer)
  }, [query, filled, otherId])

  const reset = () => {
    reqId.current++
    setQuery('')
    setResults([])
    setStatus('idle')
  }

  return { query, setQuery, results, status, reset }
}

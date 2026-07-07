import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { Button } from '../ui/Button'
import { C, slotColor } from '../../theme'
import { buildCustomMatchup, searchArtists, type ArtistHit } from '../../game/itunes'
import type { Matchup } from '../../game/matchups'
import type { Mode } from '../../game/modes'
import { ModeCards } from './ModeCards'
import { MatchupHeader } from './ModeSelectScreen'

type Phase =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'ready'; matchup: Matchup }

/**
 * Custom-duel builder at `/duel/custom`. Two live search fields (Artiste A / B)
 * each let the player type, pick a real artist from a debounced dropdown, and
 * lock it in as a chip. "Préparer le duel" (enabled once both slots are filled)
 * fetches + filters both catalogs and — on ≥ 8 clean tracks per side — reveals
 * the mode cards. All states are French. The built matchup is session-only; the
 * parent starts + navigates on mode pick.
 */
export function CustomDuelScreen({
  onPlay,
  onBack,
}: {
  onPlay: (matchup: Matchup, mode: Mode) => void
  onBack: () => void
}) {
  const [a, setA] = useState<ArtistHit | undefined>()
  const [b, setB] = useState<ArtistHit | undefined>()
  const [phase, setPhase] = useState<Phase>({ kind: 'idle' })

  const canSubmit = !!a && !!b && phase.kind !== 'loading'

  const handleSubmit = async () => {
    if (!a || !b || phase.kind === 'loading') return
    setPhase({ kind: 'loading' })
    try {
      const result = await buildCustomMatchup(a, b)
      if (result.ok) setPhase({ kind: 'ready', matchup: result.matchup })
      else setPhase({ kind: 'error', message: result.message })
    } catch {
      setPhase({ kind: 'error', message: 'Problème de réseau — réessaie.' })
    }
  }

  const ready = phase.kind === 'ready' ? phase.matchup : null

  return (
    <div style={{ textAlign: 'center', animation: 'floatIn .45s ease both' }}>
      <button
        onClick={onBack}
        aria-label="Retour à l'accueil"
        style={{
          cursor: 'pointer',
          background: 'transparent',
          border: 'none',
          color: C.muted2,
          fontFamily: C.monoFont,
          fontSize: 13,
          letterSpacing: 1,
          marginBottom: 20,
        }}
      >
        ← Accueil
      </button>

      <h1
        style={{
          fontSize: 'clamp(30px, 9vw, 46px)',
          fontWeight: 700,
          lineHeight: 1.05,
          letterSpacing: -1.5,
          margin: '0 0 12px',
        }}
      >
        Créer un duel
      </h1>
      <p
        style={{
          maxWidth: 420,
          margin: '0 auto 30px',
          color: C.muted,
          fontSize: 'clamp(14px, 4vw, 16px)',
          lineHeight: 1.5,
        }}
      >
        Cherche deux artistes et choisis-les. On récupère leurs extraits et on prépare le blindtest.
      </p>

      {ready ? (
        <div style={{ animation: 'floatIn .35s ease both' }}>
          <div
            style={{
              fontFamily: C.monoFont,
              fontSize: 12,
              letterSpacing: 2,
              textTransform: 'uppercase',
              color: C.muted2,
              marginBottom: 14,
            }}
          >
            Duel prêt ✓
          </div>
          <MatchupHeader matchup={ready} />
          <p style={{ margin: '0 auto 28px', color: C.muted, fontSize: 15 }}>
            {ready.songs.length} extraits chargés. Choisis ton mode.
          </p>
          <ModeCards matchup={ready} onSelect={(mode) => onPlay(ready, mode)} />
          <button
            onClick={() => setPhase({ kind: 'idle' })}
            style={{
              cursor: 'pointer',
              background: 'transparent',
              border: 'none',
              color: C.muted3,
              fontFamily: C.monoFont,
              fontSize: 13,
              marginTop: 24,
            }}
          >
            ← Changer d'artistes
          </button>
        </div>
      ) : (
        <div style={{ maxWidth: 420, margin: '0 auto', textAlign: 'left' }}>
          <SearchField
            label="Artiste A"
            accent={slotColor('a')}
            placeholder="ex. Drake"
            selected={a}
            onSelect={setA}
            onClear={() => setA(undefined)}
          />
          <SearchField
            label="Artiste B"
            accent={slotColor('b')}
            placeholder="ex. The Weeknd"
            selected={b}
            onSelect={setB}
            onClear={() => setB(undefined)}
          />

          {phase.kind === 'error' && (
            <div
              role="alert"
              style={{
                background: 'oklch(0.78 0.15 55 / 0.12)',
                border: `1px solid ${C.pit}`,
                borderRadius: 14,
                padding: '14px 16px',
                color: C.text,
                fontSize: 14,
                lineHeight: 1.45,
                margin: '4px 0 20px',
              }}
            >
              {phase.message}
            </div>
          )}

          <div style={{ textAlign: 'center', marginTop: 6 }}>
            <Button
              onClick={handleSubmit}
              disabled={!canSubmit}
              style={{
                width: '100%',
                opacity: canSubmit ? 1 : 0.5,
                cursor: canSubmit ? 'pointer' : 'default',
              }}
            >
              {phase.kind === 'loading' ? 'Préparation du duel…' : 'Préparer le duel'}
            </Button>
          </div>

          {phase.kind === 'loading' && (
            <div
              style={{
                fontFamily: C.monoFont,
                fontSize: 12,
                letterSpacing: 1,
                color: C.muted3,
                textAlign: 'center',
                marginTop: 16,
              }}
            >
              Récupération et filtrage des titres…
            </div>
          )}
        </div>
      )}
    </div>
  )
}

type FieldStatus = 'idle' | 'typing' | 'searching' | 'results' | 'no-results'

/**
 * One artist search slot. Debounced (300ms, ≥ 2 chars) live search with a
 * last-query-wins guard: a per-field request token (ref) is bumped on every
 * keystroke, captured for that search, and results are applied only while the
 * captured token is still the latest — so a slow earlier query can never
 * overwrite a newer one, even though JSONP callbacks can't be aborted.
 * Once a result is tapped the field collapses to a clearable chip.
 */
function SearchField({
  label,
  accent,
  placeholder,
  selected,
  onSelect,
  onClear,
}: {
  label: string
  accent: string
  placeholder: string
  selected?: ArtistHit
  onSelect: (hit: ArtistHit) => void
  onClear: () => void
}) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<ArtistHit[]>([])
  const [status, setStatus] = useState<FieldStatus>('idle')
  // Monotonic per-field token: latest keystroke wins.
  const reqId = useRef(0)

  useEffect(() => {
    // No searching while a chip is locked in.
    if (selected) return
    const q = query.trim()
    if (q.length < 2) {
      // Bump the token to invalidate any in-flight request, clear the dropdown,
      // and cancel the pending debounce (via the cleanup below).
      reqId.current++
      setResults([])
      setStatus(q.length === 0 ? 'idle' : 'typing')
      return
    }
    // This keystroke's token — assigning it now invalidates older in-flight
    // requests the moment the user types again.
    const id = ++reqId.current
    setStatus('searching')
    const timer = window.setTimeout(() => {
      searchArtists(q)
        .then((hits) => {
          if (id !== reqId.current) return // stale — a newer query superseded us
          setResults(hits)
          setStatus(hits.length ? 'results' : 'no-results')
        })
        .catch(() => {
          if (id !== reqId.current) return
          setResults([])
          setStatus('no-results')
        })
    }, 300)
    return () => window.clearTimeout(timer)
  }, [query, selected])

  const handleSelect = (hit: ArtistHit) => {
    reqId.current++ // discard any in-flight
    setResults([])
    setStatus('idle')
    onSelect(hit)
  }

  const handleClear = () => {
    setQuery('')
    setResults([])
    setStatus('idle')
    onClear()
  }

  return (
    <div style={{ marginBottom: 16 }}>
      <span
        style={{
          display: 'block',
          fontFamily: C.monoFont,
          fontSize: 12,
          letterSpacing: 2,
          textTransform: 'uppercase',
          color: accent,
          marginBottom: 8,
        }}
      >
        {label}
      </span>

      {selected ? (
        <Chip hit={selected} accent={accent} onClear={handleClear} />
      ) : (
        <div style={{ position: 'relative' }}>
          <input
            type="text"
            value={query}
            placeholder={placeholder}
            autoComplete="off"
            aria-label={`Rechercher ${label}`}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = accent
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = C.border
            }}
            style={{
              width: '100%',
              boxSizing: 'border-box',
              fontFamily: C.sansFont,
              fontSize: 17,
              color: C.text,
              background: C.surface,
              border: `1.5px solid ${C.border}`,
              borderRadius: 14,
              padding: '14px 16px',
              outline: 'none',
              transition: 'border-color .15s',
            }}
          />

          {status === 'searching' && <Hint>Recherche…</Hint>}
          {status === 'no-results' && <Hint>Aucun artiste trouvé</Hint>}

          {status === 'results' && results.length > 0 && (
            <ul
              role="listbox"
              style={{
                listStyle: 'none',
                margin: '8px 0 0',
                padding: 4,
                background: C.surface2,
                border: `1px solid ${C.border}`,
                borderRadius: 14,
                maxHeight: 280,
                overflowY: 'auto',
              }}
            >
              {results.map((hit) => (
                <li key={hit.artistId}>
                  <button
                    type="button"
                    onClick={() => handleSelect(hit)}
                    style={resultRowStyle}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = C.surface
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent'
                    }}
                  >
                    <Thumb src={hit.artworkUrl} name={hit.artistName} accent={accent} />
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span
                        style={{
                          display: 'block',
                          fontSize: 16,
                          fontWeight: 600,
                          color: C.text,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {hit.artistName}
                      </span>
                      {hit.genre && (
                        <span
                          style={{
                            display: 'block',
                            fontSize: 12,
                            color: C.muted3,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {hit.genre}
                        </span>
                      )}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

/** Selected-artist chip: thumb + name + ✕ to clear and search again. */
function Chip({ hit, accent, onClear }: { hit: ArtistHit; accent: string; onClear: () => void }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        width: '100%',
        boxSizing: 'border-box',
        background: C.surface,
        border: `1.5px solid ${accent}`,
        borderRadius: 14,
        padding: '10px 12px',
      }}
    >
      <Thumb src={hit.artworkUrl} name={hit.artistName} accent={accent} />
      <span
        style={{
          flex: 1,
          minWidth: 0,
          fontSize: 17,
          fontWeight: 600,
          color: C.text,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {hit.artistName}
      </span>
      <button
        type="button"
        onClick={onClear}
        aria-label={`Retirer ${hit.artistName}`}
        style={{
          cursor: 'pointer',
          flexShrink: 0,
          width: 30,
          height: 30,
          borderRadius: '50%',
          border: 'none',
          background: 'transparent',
          color: C.muted2,
          fontSize: 16,
          lineHeight: 1,
        }}
      >
        ✕
      </button>
    </div>
  )
}

/** Artwork thumbnail with a neutral placeholder when missing/broken. */
function Thumb({ src, name, accent }: { src?: string; name: string; accent: string }) {
  const [broken, setBroken] = useState(false)
  const box: CSSProperties = {
    flexShrink: 0,
    width: 44,
    height: 44,
    borderRadius: 10,
    objectFit: 'cover',
    background: C.surface2,
    border: `1px solid ${C.border}`,
  }
  if (!src || broken) {
    return (
      <span
        aria-hidden
        style={{
          ...box,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: C.monoFont,
          fontSize: 18,
          fontWeight: 600,
          color: accent,
        }}
      >
        {name.slice(0, 1).toUpperCase()}
      </span>
    )
  }
  return <img src={src} alt="" style={box} onError={() => setBroken(true)} />
}

/** Small mono hint shown under a field (searching / no-results). */
function Hint({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        fontFamily: C.monoFont,
        fontSize: 12,
        letterSpacing: 1,
        color: C.muted3,
        marginTop: 8,
        paddingLeft: 2,
      }}
    >
      {children}
    </div>
  )
}

const resultRowStyle: CSSProperties = {
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  width: '100%',
  textAlign: 'left',
  background: 'transparent',
  border: 'none',
  borderRadius: 10,
  padding: '8px 10px',
  fontFamily: C.sansFont,
  transition: 'background .12s',
}

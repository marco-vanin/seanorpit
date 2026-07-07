import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { Button } from '../ui/Button'
import { Artwork } from '../ui/Artwork'
import { C, slotColor } from '../../theme'
import { buildCustomMatchup, searchArtists, type ArtistHit } from '../../game/itunes'
import type { Matchup, Side } from '../../game/matchups'
import type { Mode } from '../../game/modes'
import { ModeCards } from './ModeCards'
import { MatchupHeader } from './ModeSelectScreen'

type Phase =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'ready'; matchup: Matchup }

/**
 * Custom-duel builder at `/duel/custom`. A vertical **versus builder**: slot A
 * (green) on top, a central "or", slot B (orange) below. Each empty slot is a
 * tappable "+ Choisir un artiste" that opens an inline debounced search with an
 * artwork dropdown; picking fills the slot with the artist's artwork + name and
 * a ✕ to redo. "Préparer le duel" (enabled once both slots are filled) fetches +
 * filters both catalogs and — on ≥ 8 clean tracks per side — reveals the mode
 * cards. All states are French. The built matchup is session-only; the parent
 * starts + navigates on mode pick.
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
        Choisis deux artistes. On récupère leurs extraits et on prépare le blindtest.
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
        <div style={{ maxWidth: 440, margin: '0 auto', textAlign: 'left' }}>
          <Slot
            side="a"
            selected={a}
            onSelect={setA}
            onClear={() => setA(undefined)}
            placeholder="ex. Drake"
          />
          <OrDivider />
          <Slot
            side="b"
            selected={b}
            onSelect={setB}
            onClear={() => setB(undefined)}
            placeholder="ex. The Weeknd"
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
                margin: '18px 0 20px',
              }}
            >
              {phase.message}
            </div>
          )}

          <div style={{ textAlign: 'center', marginTop: 22 }}>
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

/** The central "or" pill between the two slots. */
function OrDivider() {
  return (
    <div aria-hidden style={{ display: 'flex', justifyContent: 'center', margin: '10px 0' }}>
      <span
        style={{
          fontFamily: C.monoFont,
          fontSize: 13,
          fontWeight: 600,
          color: C.muted5,
          border: `1.5px solid ${C.border2}`,
          borderRadius: 999,
          width: 40,
          height: 40,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        or
      </span>
    </div>
  )
}

type FieldStatus = 'idle' | 'typing' | 'searching' | 'results' | 'no-results'

/**
 * One versus slot. Three states, tinted by its slot color:
 *   • empty  → "+ Choisir un artiste" (tap opens search)
 *   • search → autofocus input + dropdown (Artwork + name + genre)
 *   • filled → Artwork + name + ✕ to clear
 *
 * The search reuses the app's debounced (300ms, ≥ 2 chars) last-query-wins
 * guard verbatim: a per-slot request token (ref) is bumped on every keystroke,
 * captured for that search, and results are applied only while the captured
 * token is still the latest — so a slow earlier query can never overwrite a
 * newer one, even though JSONP callbacks can't be aborted.
 */
function Slot({
  side,
  selected,
  onSelect,
  onClear,
  placeholder,
}: {
  side: Side
  selected?: ArtistHit
  onSelect: (hit: ArtistHit) => void
  onClear: () => void
  placeholder: string
}) {
  const accent = slotColor(side)
  const label = side === 'a' ? 'Artiste A' : 'Artiste B'
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<ArtistHit[]>([])
  const [status, setStatus] = useState<FieldStatus>('idle')
  // Monotonic per-slot token: latest keystroke wins.
  const reqId = useRef(0)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  useEffect(() => {
    // No searching unless the slot is actively in its inline-search state.
    if (selected || !open) return
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
  }, [query, selected, open])

  const closeSearch = () => {
    reqId.current++ // discard any in-flight
    setResults([])
    setStatus('idle')
    setQuery('')
    setOpen(false)
  }

  const handleSelect = (hit: ArtistHit) => {
    reqId.current++ // discard any in-flight
    setResults([])
    setStatus('idle')
    setQuery('')
    setOpen(false)
    onSelect(hit)
  }

  const handleClear = () => {
    onClear()
    closeSearch()
  }

  // ── filled ────────────────────────────────────────────────────────────────
  if (selected) {
    return (
      <div style={{ marginBottom: 0 }}>
        <SlotLabel accent={accent}>{label}</SlotLabel>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            width: '100%',
            boxSizing: 'border-box',
            background: `color-mix(in oklab, ${accent} 8%, ${C.surface})`,
            border: `1.5px solid ${accent}`,
            borderRadius: 16,
            padding: '14px 16px',
          }}
        >
          <Artwork src={selected.artworkUrl} name={selected.artistName} color={accent} size={56} />
          <span
            style={{
              flex: 1,
              minWidth: 0,
              fontSize: 19,
              fontWeight: 600,
              color: C.text,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {selected.artistName}
          </span>
          <button
            type="button"
            onClick={handleClear}
            aria-label={`Retirer ${selected.artistName}`}
            style={{
              cursor: 'pointer',
              flexShrink: 0,
              width: 32,
              height: 32,
              borderRadius: '50%',
              border: `1px solid ${C.border}`,
              background: 'transparent',
              color: C.muted2,
              fontSize: 15,
              lineHeight: 1,
            }}
          >
            ✕
          </button>
        </div>
      </div>
    )
  }

  // ── empty ─────────────────────────────────────────────────────────────────
  if (!open) {
    return (
      <div style={{ marginBottom: 0 }}>
        <SlotLabel accent={accent}>{label}</SlotLabel>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={`Choisir ${label}`}
          style={{
            cursor: 'pointer',
            width: '100%',
            boxSizing: 'border-box',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            fontFamily: C.sansFont,
            fontSize: 17,
            fontWeight: 500,
            color: C.muted,
            background: `color-mix(in oklab, ${accent} 5%, ${C.surface})`,
            border: `1.5px dashed color-mix(in oklab, ${accent} 55%, ${C.border})`,
            borderRadius: 16,
            padding: '18px 18px',
            transition: 'border-color .15s, background .15s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = accent
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = `color-mix(in oklab, ${accent} 55%, ${C.border})`
          }}
        >
          <span style={{ color: accent, fontSize: 22, fontWeight: 600, lineHeight: 1 }}>+</span>
          Choisir un artiste
        </button>
      </div>
    )
  }

  // ── search ────────────────────────────────────────────────────────────────
  return (
    <div style={{ marginBottom: 0 }}>
      <SlotLabel accent={accent}>{label}</SlotLabel>
      <div style={{ position: 'relative' }}>
        <input
          ref={inputRef}
          type="text"
          value={query}
          placeholder={placeholder}
          autoComplete="off"
          aria-label={`Rechercher ${label}`}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') closeSearch()
          }}
          onBlur={closeSearch}
          style={{
            width: '100%',
            boxSizing: 'border-box',
            fontFamily: C.sansFont,
            fontSize: 17,
            color: C.text,
            background: C.surface,
            border: `1.5px solid ${accent}`,
            borderRadius: 16,
            padding: '16px 46px 16px 16px',
            outline: 'none',
          }}
        />
        <button
          type="button"
          aria-label="Annuler la recherche"
          // Prevent the input's blur from firing before the click resolves.
          onMouseDown={(e) => e.preventDefault()}
          onClick={closeSearch}
          style={{
            position: 'absolute',
            top: '50%',
            right: 10,
            transform: 'translateY(-50%)',
            cursor: 'pointer',
            width: 28,
            height: 28,
            borderRadius: '50%',
            border: 'none',
            background: 'transparent',
            color: C.muted2,
            fontSize: 14,
            lineHeight: 1,
          }}
        >
          ✕
        </button>

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
              borderRadius: 16,
              maxHeight: 320,
              overflowY: 'auto',
            }}
          >
            {results.map((hit) => (
              <li key={hit.artistId}>
                <button
                  type="button"
                  // Keep the input focused until the pick resolves.
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleSelect(hit)}
                  style={resultRowStyle}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = C.surface
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent'
                  }}
                >
                  <Artwork src={hit.artworkUrl} name={hit.artistName} color={accent} size={44} />
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
                          color: C.muted2,
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
    </div>
  )
}

/** Uppercase mono slot label in the slot's accent color. */
function SlotLabel({ accent, children }: { accent: string; children: ReactNode }) {
  return (
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
      {children}
    </span>
  )
}

/** Small mono hint shown under a field (searching / no-results). */
function Hint({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        fontFamily: C.monoFont,
        fontSize: 12,
        letterSpacing: 1,
        color: C.muted2,
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
  borderRadius: 12,
  padding: '8px 10px',
  fontFamily: C.sansFont,
  transition: 'background .12s',
}

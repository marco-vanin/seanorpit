import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
  type RefObject,
} from 'react'
import { Button } from '../ui/Button'
import { Artwork } from '../ui/Artwork'
import { C, slotColor } from '../../theme'
import { buildCustomMatchup, searchArtists, type ArtistHit } from '../../game/itunes'
import type { Matchup, Side } from '../../game/matchups'
import type { Mode } from '../../game/modes'
import { ModeCards } from './ModeCards'
import { MatchupHeader } from './ModeSelectScreen'
import suggestedData from '../../game/suggested.json'

/** Curated suggestion pool (real iTunes ids) for quick-pick chips + random duel. */
const SUGGESTED = suggestedData as ArtistHit[]

type Phase =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'ready'; matchup: Matchup }

type Status = 'idle' | 'typing' | 'searching' | 'results' | 'no-results'

/**
 * Custom-duel builder at `/duel/custom` — "Compose ton duel". A wide (760px)
 * two-column versus layout: artist A (green) left, an "or" badge center, artist
 * B (orange) right. Each column, inline: a filled chip (artwork + name + ✕), an
 * open search (input + debounced results), or a closed state (a "+ Choisir un
 * artiste" button + quick-pick chips). "🎲 Duel au hasard" fills both from the
 * suggestion pool. "Préparer le duel" (both filled) fetches + filters both
 * catalogs and — on ≥ 8 clean tracks per side — reveals the mode cards. All
 * French; the built matchup is session-only.
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

  // Only one slot searches at a time. Shared query/results with a last-query-wins
  // token so a slow earlier request can never overwrite a newer one.
  const [openSlot, setOpenSlot] = useState<Side | null>(null)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<ArtistHit[]>([])
  const [status, setStatus] = useState<Status>('idle')
  const reqId = useRef(0)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (openSlot) inputRef.current?.focus()
  }, [openSlot])

  useEffect(() => {
    if (!openSlot) return
    const q = query.trim()
    if (q.length < 2) {
      reqId.current++ // invalidate any in-flight request
      setResults([])
      setStatus(q.length === 0 ? 'idle' : 'typing')
      return
    }
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
  }, [query, openSlot])

  const other = (side: Side) => (side === 'a' ? b : a)
  const setSide = (side: Side, hit?: ArtistHit) => (side === 'a' ? setA(hit) : setB(hit))
  const clearError = () => setPhase((p) => (p.kind === 'error' ? { kind: 'idle' } : p))

  const openFor = (side: Side) => {
    reqId.current++
    setResults([])
    setStatus('idle')
    setQuery('')
    setOpenSlot(side)
    clearError()
  }
  const closeSlot = () => {
    reqId.current++
    setResults([])
    setStatus('idle')
    setQuery('')
    setOpenSlot(null)
  }
  const pick = (side: Side, hit: ArtistHit) => {
    setSide(side, hit)
    closeSlot()
    clearError()
  }
  const clear = (side: Side) => setSide(side, undefined)

  const randomDuel = () => {
    const pool = [...SUGGESTED]
    const ra = pool.splice(Math.floor(Math.random() * pool.length), 1)[0]
    const rb = pool[Math.floor(Math.random() * pool.length)]
    setA(ra)
    setB(rb)
    closeSlot()
    clearError()
  }

  const canSubmit = !!a && !!b && phase.kind !== 'loading'
  const bothReady = !!a && !!b

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
      <button onClick={onBack} aria-label="Retour à l'accueil" style={backStyle}>
        ← Accueil
      </button>

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
            style={{ ...backStyle, marginTop: 24, marginBottom: 0 }}
          >
            ← Changer d'artistes
          </button>
        </div>
      ) : (
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          <div style={{ marginBottom: 28 }}>
            <h1
              style={{
                fontSize: 'clamp(32px, 9vw, 48px)',
                fontWeight: 700,
                letterSpacing: -1.5,
                margin: '0 0 10px',
              }}
            >
              Compose ton duel
            </h1>
            <p
              style={{
                maxWidth: 380,
                margin: '0 auto',
                color: C.muted2,
                fontSize: 'clamp(14px, 4vw, 16px)',
                lineHeight: 1.5,
              }}
            >
              Choisis deux artistes. On récupère leurs extraits et on lance le blindtest.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr auto 1fr',
              gap: 16,
              alignItems: 'start',
              textAlign: 'left',
            }}
          >
            <ArtistSlot
              side="a"
              selected={a}
              open={openSlot === 'a'}
              placeholder="ex. Drake, Rihanna…"
              query={query}
              status={status}
              results={results.filter((r) => r.artistId !== other('a')?.artistId)}
              quick={SUGGESTED.filter((s) => s.artistId !== other('a')?.artistId).slice(0, 5)}
              inputRef={openSlot === 'a' ? inputRef : undefined}
              onOpen={() => openFor('a')}
              onQuery={setQuery}
              onCancel={closeSlot}
              onPick={(hit) => pick('a', hit)}
              onClear={() => clear('a')}
            />

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span
                style={{
                  fontFamily: C.monoFont,
                  fontSize: 14,
                  fontWeight: 600,
                  color: bothReady ? C.gold : C.muted5,
                  border: `1.5px solid ${bothReady ? C.gold : C.border2}`,
                  borderRadius: 999,
                  width: 48,
                  height: 48,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  transition: 'color .2s, border-color .2s',
                  marginTop: 28,
                }}
              >
                or
              </span>
            </div>

            <ArtistSlot
              side="b"
              selected={b}
              open={openSlot === 'b'}
              placeholder="ex. The Weeknd, Beyoncé…"
              query={query}
              status={status}
              results={results.filter((r) => r.artistId !== other('b')?.artistId)}
              quick={SUGGESTED.filter((s) => s.artistId !== other('b')?.artistId).slice(0, 5)}
              inputRef={openSlot === 'b' ? inputRef : undefined}
              onOpen={() => openFor('b')}
              onQuery={setQuery}
              onCancel={closeSlot}
              onPick={(hit) => pick('b', hit)}
              onClear={() => clear('b')}
            />
          </div>

          {phase.kind === 'error' && (
            <div
              role="alert"
              style={{
                background: 'color-mix(in oklab, var(--pit) 12%, transparent)',
                border: `1px solid ${C.pit}`,
                borderRadius: 14,
                padding: '14px 16px',
                color: C.text,
                fontSize: 14,
                lineHeight: 1.45,
                margin: '20px 0 0',
              }}
            >
              {phase.message}
            </div>
          )}

          <Button
            onClick={handleSubmit}
            disabled={!canSubmit}
            style={{
              width: '100%',
              marginTop: 24,
              opacity: canSubmit ? 1 : 0.5,
              cursor: canSubmit ? 'pointer' : 'default',
            }}
          >
            {phase.kind === 'loading' ? 'Préparation du duel…' : 'Préparer le duel'}
          </Button>
          <button
            onClick={randomDuel}
            disabled={phase.kind === 'loading'}
            style={{
              cursor: phase.kind === 'loading' ? 'default' : 'pointer',
              width: '100%',
              marginTop: 10,
              background: 'transparent',
              border: 'none',
              color: C.muted2,
              fontFamily: C.monoFont,
              fontSize: 13,
              letterSpacing: 1,
            }}
          >
            🎲 Duel au hasard
          </button>

          {phase.kind === 'loading' && (
            <div
              style={{
                fontFamily: C.monoFont,
                fontSize: 12,
                letterSpacing: 1,
                color: C.muted3,
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

/**
 * One artist column. Three inline states, tinted by its slot color:
 *   • filled → artwork + name + ✕
 *   • open   → autofocus input + debounced results (artwork + name + genre) + Annuler
 *   • closed → "+ Choisir un artiste" + quick-pick chips
 * Search state (query/results/status/last-query-wins) is owned by the parent and
 * passed in; this component is presentational.
 */
function ArtistSlot({
  side,
  selected,
  open,
  placeholder,
  query,
  status,
  results,
  quick,
  inputRef,
  onOpen,
  onQuery,
  onCancel,
  onPick,
  onClear,
}: {
  side: Side
  selected?: ArtistHit
  open: boolean
  placeholder: string
  query: string
  status: Status
  results: ArtistHit[]
  quick: ArtistHit[]
  inputRef?: RefObject<HTMLInputElement>
  onOpen: () => void
  onQuery: (q: string) => void
  onCancel: () => void
  onPick: (hit: ArtistHit) => void
  onClear: () => void
}) {
  const accent = slotColor(side)
  const label = side === 'a' ? 'Artiste A' : 'Artiste B'

  // ── filled ──────────────────────────────────────────────────────────────────
  if (selected) {
    return (
      <div>
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
            padding: '12px 14px',
          }}
        >
          <Artwork src={selected.artworkUrl} name={selected.artistName} color={accent} size={52} />
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
            onClick={onClear}
            aria-label={`Retirer ${selected.artistName}`}
            style={clearBtnStyle}
          >
            ✕
          </button>
        </div>
      </div>
    )
  }

  // ── open (search) ────────────────────────────────────────────────────────────
  if (open) {
    return (
      <div>
        <SlotLabel accent={accent}>{label}</SlotLabel>
        <input
          ref={inputRef}
          type="text"
          value={query}
          placeholder={placeholder}
          autoComplete="off"
          aria-label={`Rechercher ${label}`}
          onChange={(e) => onQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') onCancel()
          }}
          style={{
            width: '100%',
            boxSizing: 'border-box',
            fontFamily: C.sansFont,
            fontSize: 17,
            color: C.text,
            background: C.surface,
            border: `1.5px solid ${accent}`,
            borderRadius: 16,
            padding: '15px 16px',
            outline: 'none',
          }}
        />

        {status === 'searching' && <Hint>Recherche…</Hint>}
        {status === 'no-results' && <Hint>Aucun artiste trouvé</Hint>}

        {status === 'results' &&
          results.map((hit) => (
            <button
              key={hit.artistId}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => onPick(hit)}
              style={resultRowStyle}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = C.surface2
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent'
              }}
            >
              <Artwork src={hit.artworkUrl} name={hit.artistName} color={accent} size={40} />
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={rowNameStyle}>{hit.artistName}</span>
                {hit.genre && <span style={rowGenreStyle}>{hit.genre}</span>}
              </span>
            </button>
          ))}

        <button type="button" onClick={onCancel} style={cancelStyle}>
          Annuler
        </button>
      </div>
    )
  }

  // ── closed (choose + quick picks) ─────────────────────────────────────────────
  return (
    <div>
      <SlotLabel accent={accent}>{label}</SlotLabel>
      <button
        type="button"
        onClick={onOpen}
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
          padding: '17px 18px',
          transition: 'border-color .15s',
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

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginTop: 10 }}>
        {quick.map((hit) => (
          <button
            key={hit.artistId}
            type="button"
            onClick={() => onPick(hit)}
            aria-label={`Choisir ${hit.artistName}`}
            style={chipStyle}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = accent
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = C.border
            }}
          >
            <Artwork
              src={hit.artworkUrl}
              name={hit.artistName}
              color={accent}
              size={20}
              radius={999}
            />
            {hit.artistName}
          </button>
        ))}
      </div>
    </div>
  )
}

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

const backStyle: CSSProperties = {
  cursor: 'pointer',
  background: 'transparent',
  border: 'none',
  color: C.muted2,
  fontFamily: C.monoFont,
  fontSize: 13,
  letterSpacing: 1,
  marginBottom: 24,
}

const clearBtnStyle: CSSProperties = {
  cursor: 'pointer',
  flexShrink: 0,
  width: 32,
  height: 32,
  borderRadius: '50%',
  border: `1px solid ${C.border2}`,
  background: 'transparent',
  color: C.muted2,
  fontSize: 14,
  lineHeight: 1,
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
  padding: '9px 10px',
  marginTop: 4,
  fontFamily: C.sansFont,
  transition: 'background .12s',
}

const rowNameStyle: CSSProperties = {
  display: 'block',
  fontSize: 16,
  fontWeight: 600,
  color: C.text,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
}

const rowGenreStyle: CSSProperties = {
  display: 'block',
  fontSize: 12,
  color: C.muted2,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
}

const cancelStyle: CSSProperties = {
  cursor: 'pointer',
  background: 'transparent',
  border: 'none',
  color: C.muted2,
  fontFamily: C.monoFont,
  fontSize: 12,
  marginTop: 8,
}

const chipStyle: CSSProperties = {
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 7,
  background: C.surface,
  border: `1px solid ${C.border}`,
  borderRadius: 999,
  padding: '5px 12px 5px 6px',
  fontFamily: C.sansFont,
  fontSize: 13,
  color: C.muted,
  transition: 'border-color .15s',
}

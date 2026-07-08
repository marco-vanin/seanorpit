import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { Button } from '../ui/Button'
import { Artwork } from '../ui/Artwork'
import { C, slotColor } from '../../theme'
import { buildCustomMatchup, searchArtists, type ArtistHit } from '../../game/itunes'
import { resolveArtistPhoto } from '../../game/deezer'
import { duelShareUrl, shareDuel } from '../../game/share'
import type { Matchup, Side } from '../../game/matchups'
import type { Mode } from '../../game/modes'
import { ModeCards } from './ModeCards'
import { MatchupHeader } from './ModeSelectScreen'
import suggestedData from '../../game/suggested.json'

/** Curated suggestion pool (real ids + photos) for the random duel. */
const SUGGESTED = suggestedData as ArtistHit[]

type Phase =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'ready'; matchup: Matchup }

/**
 * Custom-duel builder at `/duel/custom` — "Compose ton duel". Two tall search
 * cards side by side (A / "or" / B): each holds an always-visible artist search
 * (photo results) that becomes a square photo tile once picked. "🎲 Duel au
 * hasard" fills both from the suggestion pool; "Préparer le duel" fetches +
 * filters both catalogs and — on ≥ 8 clean tracks per side — reveals the mode
 * cards (`DuelReady`). All French; the built matchup is session-only.
 */
export function CustomDuelScreen({ onPlay }: { onPlay: (matchup: Matchup, mode: Mode) => void }) {
  const [a, setA] = useState<ArtistHit | undefined>()
  const [b, setB] = useState<ArtistHit | undefined>()
  const [phase, setPhase] = useState<Phase>({ kind: 'idle' })

  const clearError = () => setPhase((p) => (p.kind === 'error' ? { kind: 'idle' } : p))
  const selectA = (hit?: ArtistHit) => {
    setA(hit)
    clearError()
  }
  const selectB = (hit?: ArtistHit) => {
    setB(hit)
    clearError()
  }

  const randomDuel = () => {
    const pool = [...SUGGESTED]
    const ra = pool.splice(Math.floor(Math.random() * pool.length), 1)[0]
    const rb = pool[Math.floor(Math.random() * pool.length)]
    setA(ra)
    setB(rb)
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

  if (ready) {
    return (
      <DuelReady
        matchup={ready}
        onSelect={(mode) => onPlay(ready, mode)}
        onBack={() => setPhase({ kind: 'idle' })}
        backLabel="← Changer d'artistes"
      />
    )
  }

  return (
    <div style={{ animation: 'floatIn .45s ease both', maxWidth: 880, margin: '0 auto' }}>
      <div style={{ marginBottom: 26 }}>
        <h1
          style={{
            fontSize: 'clamp(30px, 6vw, 42px)',
            fontWeight: 700,
            letterSpacing: -1.5,
            margin: '0 0 8px',
          }}
        >
          Compose ton duel
        </h1>
        <p
          style={{
            margin: 0,
            color: C.muted,
            fontSize: 'clamp(14px, 4vw, 16px)',
            lineHeight: 1.5,
            maxWidth: 560,
          }}
        >
          Cherche deux artistes — on récupère leurs extraits et on prépare le blindtest.
        </p>
      </div>

      <div className="duel-slots">
        <SlotCard
          side="a"
          selected={a}
          onSelect={selectA}
          otherId={b?.artistId}
          examples="ex. Drake, Shakira, Kendrick Lamar…"
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
            }}
          >
            or
          </span>
        </div>

        <SlotCard
          side="b"
          selected={b}
          onSelect={selectB}
          otherId={a?.artistId}
          examples="ex. The Weeknd, Beyoncé, Dua Lipa…"
        />
      </div>

      {phase.kind === 'error' && (
        <div
          role="alert"
          style={{
            background: 'color-mix(in oklab, var(--bad) 12%, transparent)',
            border: `1px solid ${C.bad}`,
            borderRadius: 14,
            padding: '14px 16px',
            color: C.text,
            fontSize: 14,
            lineHeight: 1.45,
            margin: '18px 0 0',
          }}
        >
          {phase.message}
        </div>
      )}

      {/* actions: random visible left, primary aligned end */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          marginTop: 20,
          flexWrap: 'wrap',
        }}
      >
        <button
          onClick={randomDuel}
          disabled={phase.kind === 'loading'}
          style={{
            cursor: phase.kind === 'loading' ? 'default' : 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 9,
            background: C.surface,
            border: `1.5px solid ${C.border2}`,
            color: C.text,
            fontFamily: C.sansFont,
            fontSize: 15,
            fontWeight: 600,
            padding: '14px 22px',
            borderRadius: 12,
            transition: 'border-color .15s, background .15s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = C.gold
            e.currentTarget.style.background = 'var(--surface-hover)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = C.border2
            e.currentTarget.style.background = C.surface
          }}
        >
          <span aria-hidden style={{ fontSize: 17 }}>
            🎲
          </span>{' '}
          Duel au hasard
        </button>

        <Button
          onClick={handleSubmit}
          disabled={!canSubmit}
          style={{
            opacity: canSubmit ? 1 : 0.5,
            cursor: canSubmit ? 'pointer' : 'default',
            marginLeft: 'auto',
            padding: '15px 32px',
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
            marginTop: 14,
          }}
        >
          Récupération et filtrage des titres…
        </div>
      )}
    </div>
  )
}

/**
 * The "Duel prêt ✓" preview — shared by the builder's ready state and the
 * shared-duel recipient route so both are visually identical: header + track
 * count + mode cards + a "Partager ce duel" action (copies the link + "Lien
 * copié" toast) + a back control. Share is hidden for curated matchups (no ids).
 */
export function DuelReady({
  matchup,
  onSelect,
  onBack,
  backLabel,
}: {
  matchup: Matchup
  onSelect: (mode: Mode) => void
  onBack?: () => void
  backLabel?: string
}) {
  const [copied, setCopied] = useState(false)
  const timerRef = useRef<number | null>(null)
  useEffect(() => () => void (timerRef.current && window.clearTimeout(timerRef.current)), [])

  const canShare = duelShareUrl(matchup) !== null

  const handleShare = async () => {
    const outcome = await shareDuel(matchup)
    if (outcome === 'copied') {
      setCopied(true)
      if (timerRef.current) window.clearTimeout(timerRef.current)
      timerRef.current = window.setTimeout(() => setCopied(false), 2200)
    }
  }

  return (
    <div style={{ textAlign: 'center', animation: 'floatIn .35s ease both' }}>
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
      <MatchupHeader matchup={matchup} />
      <p style={{ margin: '0 auto 28px', color: C.muted, fontSize: 15 }}>
        {matchup.songs.length} extraits chargés. Choisis ton mode.
      </p>
      <ModeCards matchup={matchup} onSelect={onSelect} />

      {canShare && (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 18 }}>
          <Button
            onClick={handleShare}
            style={{ background: 'transparent', color: C.text, border: `1.5px solid ${C.border2}` }}
          >
            🔗 Partager ce duel
          </Button>
        </div>
      )}
      <div
        aria-live="polite"
        style={{
          fontFamily: C.monoFont,
          fontSize: 12,
          color: C.slotA,
          marginTop: 10,
          height: 16,
          opacity: copied ? 1 : 0,
          transition: 'opacity .2s',
        }}
      >
        ✓ Lien copié
      </div>

      {onBack && backLabel && (
        <button onClick={onBack} style={{ ...backStyle, marginTop: 14, marginBottom: 0 }}>
          {backLabel}
        </button>
      )}
    </div>
  )
}

/**
 * One artist column — a tall card, tinted by its slot color. Empty: an
 * always-visible search input over a 🎤 prompt / photo results / "no results".
 * Filled: a square photo tile (name + slot badge + ✕). Each card owns its own
 * debounced search with a last-query-wins token, and resolves the Deezer face
 * for its results + its pick.
 */
function SlotCard({
  side,
  selected,
  onSelect,
  otherId,
  examples,
}: {
  side: Side
  selected?: ArtistHit
  onSelect: (hit?: ArtistHit) => void
  otherId?: number
  examples: string
}) {
  const accent = slotColor(side)
  const brightVar = side === 'a' ? 'var(--slot-a-bright)' : 'var(--slot-b-bright)'
  const label = side === 'a' ? 'Artiste A' : 'Artiste B'
  const badgeChar = side === 'a' ? 'A' : 'B'

  const [query, setQuery] = useState('')
  const [results, setResults] = useState<ArtistHit[]>([])
  const [status, setStatus] = useState<'idle' | 'searching' | 'results' | 'no-results'>('idle')
  const reqId = useRef(0)

  useEffect(() => {
    if (selected) return
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
  }, [query, selected, otherId])

  const pick = (hit: ArtistHit) => {
    reqId.current++
    setQuery('')
    setResults([])
    setStatus('idle')
    onSelect(hit)
    // Ensure the filled tile has a face even if the row's photo hadn't landed.
    if (!hit.photoUrl) {
      resolveArtistPhoto(hit.artistName)
        .then((photo) => {
          if (photo) onSelect({ ...hit, photoUrl: photo })
        })
        .catch(() => {})
    }
  }

  return (
    <div
      style={{
        background: C.surface,
        border: `1.5px solid color-mix(in oklab, ${accent} 32%, ${C.border})`,
        borderRadius: 20,
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        minHeight: 360,
        minWidth: 0,
        overflow: 'hidden',
      }}
    >
      <span
        style={{
          fontFamily: C.monoFont,
          fontSize: 12,
          letterSpacing: 2,
          textTransform: 'uppercase',
          color: brightVar,
        }}
      >
        {label}
      </span>

      {selected ? (
        <>
          <div
            style={{
              position: 'relative',
              borderRadius: 14,
              overflow: 'hidden',
              aspectRatio: '1 / 1',
            }}
          >
            <Artwork
              src={selected.photoUrl}
              name={selected.artistName}
              color={accent}
              size={200}
              radius={0}
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                border: 'none',
              }}
            />
            <div
              aria-hidden
              style={{
                position: 'absolute',
                inset: 0,
                background:
                  'linear-gradient(180deg, rgba(12,13,17,0) 45%, rgba(12,13,17,0.85) 100%)',
              }}
            />
            <span
              style={{
                position: 'absolute',
                left: 14,
                bottom: 14,
                right: 14,
                fontSize: 'clamp(18px, 4vw, 24px)',
                fontWeight: 700,
                letterSpacing: -0.5,
                color: '#f2f3f7',
                textShadow: '0 1px 12px rgba(0,0,0,0.7)',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                overflowWrap: 'anywhere',
              }}
            >
              {selected.artistName}
            </span>
            <span
              aria-hidden
              style={{
                position: 'absolute',
                top: 12,
                left: 12,
                fontFamily: C.monoFont,
                fontSize: 12,
                fontWeight: 700,
                color: '#fff',
                background: accent,
                borderRadius: 8,
                padding: '3px 9px',
              }}
            >
              {badgeChar}
            </span>
            <button
              onClick={() => onSelect(undefined)}
              aria-label="Changer d'artiste"
              style={{
                cursor: 'pointer',
                position: 'absolute',
                top: 10,
                right: 10,
                width: 32,
                height: 32,
                borderRadius: '50%',
                border: 'none',
                background: 'rgba(12,13,17,0.62)',
                color: '#fff',
                fontSize: 14,
                lineHeight: 1,
              }}
            >
              ✕
            </button>
          </div>
          <div
            style={{
              color: C.muted,
              fontSize: 13,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {selected.genre}
          </div>
        </>
      ) : (
        <>
          <div style={{ position: 'relative' }}>
            <span
              aria-hidden
              style={{
                position: 'absolute',
                left: 13,
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: 15,
                opacity: 0.65,
              }}
            >
              🔍
            </span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher un artiste…"
              aria-label={`Rechercher ${label}`}
              autoComplete="off"
              style={{
                width: '100%',
                boxSizing: 'border-box',
                fontFamily: C.sansFont,
                fontSize: 16,
                color: C.text,
                background: C.bg,
                border: `1.5px solid ${C.border2}`,
                borderRadius: 12,
                padding: '13px 14px 13px 38px',
                outline: 'none',
                transition: 'border-color .15s',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = accent
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = C.border2
              }}
            />
          </div>

          {status === 'idle' && (
            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                color: C.muted,
                textAlign: 'center',
                padding: 10,
              }}
            >
              <span aria-hidden style={{ fontSize: 22, opacity: 0.7 }}>
                🎤
              </span>
              <span style={{ fontSize: 14, fontWeight: 500 }}>Tape le nom d'un artiste</span>
              <span style={{ fontSize: 12, color: C.dim }}>{examples}</span>
            </div>
          )}
          {status === 'searching' && <SlotHint>Recherche…</SlotHint>}
          {status === 'no-results' && <SlotHint>Aucun artiste trouvé</SlotHint>}
          {status === 'results' && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
                overflowY: 'auto',
                maxHeight: 250,
              }}
            >
              {results.map((hit) => (
                <button
                  key={hit.artistId}
                  type="button"
                  onClick={() => pick(hit)}
                  style={resultRowStyle}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--surface-hover)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent'
                  }}
                >
                  <Artwork
                    src={hit.photoUrl}
                    name={hit.artistName}
                    color={accent}
                    size={40}
                    radius={9}
                  />
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={rowNameStyle}>{hit.artistName}</span>
                    {hit.genre && <span style={rowGenreStyle}>{hit.genre}</span>}
                  </span>
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

/** Centered mono hint that fills the empty card (searching / no-results). */
function SlotHint({ children }: { children: string }) {
  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: C.muted,
        fontFamily: C.monoFont,
        fontSize: 13,
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
  color: C.muted,
  fontFamily: C.monoFont,
  fontSize: 13,
  letterSpacing: 1,
  padding: 0,
  marginBottom: 22,
}

const resultRowStyle: CSSProperties = {
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  width: '100%',
  minWidth: 0,
  textAlign: 'left',
  background: 'transparent',
  border: 'none',
  borderRadius: 10,
  padding: '8px 10px',
  fontFamily: C.sansFont,
  transition: 'background .12s',
}

const rowNameStyle: CSSProperties = {
  display: 'block',
  fontSize: 15,
  fontWeight: 600,
  color: C.text,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
}

const rowGenreStyle: CSSProperties = {
  display: 'block',
  fontSize: 12,
  color: C.muted,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
}

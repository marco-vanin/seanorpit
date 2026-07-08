import { Artwork } from '@/components/ui/Artwork'
import { slotColor } from '@/utils/colors'
import { resolveArtistPhoto } from '@/lib/deezer'
import type { ArtistHit } from '@/lib/itunes'
import type { Side } from '@/types'
import { useArtistSearch } from '../hooks/useArtistSearch'

/**
 * One artist column — a tall card, tinted by its slot color. Empty: an
 * always-visible search input over a 🎤 prompt / photo results / "no results".
 * Filled: a square photo tile (name + slot badge + ✕). Each card owns its own
 * debounced search (via `useArtistSearch`) and resolves the Deezer face for its
 * pick.
 */
export function SlotCard({
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

  const { query, setQuery, results, status, reset } = useArtistSearch({
    filled: !!selected,
    otherId,
  })

  const pick = (hit: ArtistHit) => {
    reset()
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
      className="flex min-h-[360px] min-w-0 flex-col gap-3 overflow-hidden rounded-[20px] bg-surface p-4"
      style={{ border: `1.5px solid color-mix(in oklab, ${accent} 32%, var(--border))` }}
    >
      <span className="font-mono text-[12px] tracking-[2px] uppercase" style={{ color: brightVar }}>
        {label}
      </span>

      {selected ? (
        <>
          <div className="relative aspect-square overflow-hidden rounded-[14px]">
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
              className="absolute inset-0 bg-[linear-gradient(180deg,rgba(12,13,17,0)_45%,rgba(12,13,17,0.85)_100%)]"
            />
            <span className="absolute right-[14px] bottom-[14px] left-[14px] line-clamp-2 text-[clamp(18px,4vw,24px)] font-bold tracking-[-0.5px] text-[#f2f3f7] [overflow-wrap:anywhere] [text-shadow:0_1px_12px_rgba(0,0,0,0.7)]">
              {selected.artistName}
            </span>
            <span
              aria-hidden
              className="absolute top-3 left-3 rounded-lg px-[9px] py-[3px] font-mono text-[12px] font-bold text-white"
              style={{ background: accent }}
            >
              {badgeChar}
            </span>
            <button
              onClick={() => onSelect(undefined)}
              aria-label="Changer d'artiste"
              className="absolute top-[10px] right-[10px] size-8 cursor-pointer rounded-full border-none bg-[rgba(12,13,17,0.62)] text-[14px] leading-none text-white"
            >
              ✕
            </button>
          </div>
          <div className="truncate text-[13px] text-muted">{selected.genre}</div>
        </>
      ) : (
        <>
          <div className="relative">
            <span
              aria-hidden
              className="absolute top-1/2 left-[13px] -translate-y-1/2 text-[15px] opacity-[0.65]"
            >
              🔍
            </span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher un artiste…"
              aria-label={`Rechercher ${label}`}
              autoComplete="off"
              className="box-border w-full rounded-[12px] border-[1.5px] border-border-2 bg-bg py-[13px] pr-[14px] pl-[38px] font-sans text-[16px] text-text outline-none transition-[border-color] duration-150"
              onFocus={(e) => {
                e.currentTarget.style.borderColor = accent
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-2)'
              }}
            />
          </div>

          {status === 'idle' && (
            <div className="flex flex-1 flex-col items-center justify-center gap-1.5 p-2.5 text-center text-muted">
              <span aria-hidden className="text-[22px] opacity-70">
                🎤
              </span>
              <span className="text-[14px] font-medium">Tape le nom d'un artiste</span>
              <span className="text-[12px] text-dim">{examples}</span>
            </div>
          )}
          {status === 'searching' && <SlotHint>Recherche…</SlotHint>}
          {status === 'no-results' && <SlotHint>Aucun artiste trouvé</SlotHint>}
          {status === 'results' && (
            <div className="flex max-h-[250px] flex-col gap-0.5 overflow-y-auto">
              {results.map((hit) => (
                <button
                  key={hit.artistId}
                  type="button"
                  onClick={() => pick(hit)}
                  className="flex w-full min-w-0 cursor-pointer items-center gap-3 rounded-[10px] border-none bg-transparent px-[10px] py-2 text-left font-sans transition-[background] duration-[120ms] hover:bg-[var(--surface-hover)]"
                >
                  <Artwork
                    src={hit.photoUrl}
                    name={hit.artistName}
                    color={accent}
                    size={40}
                    radius={9}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] font-semibold text-text">
                      {hit.artistName}
                    </span>
                    {hit.genre && (
                      <span className="block truncate text-[12px] text-muted">{hit.genre}</span>
                    )}
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
    <div className="flex flex-1 items-center justify-center font-mono text-[13px] text-muted">
      {children}
    </div>
  )
}

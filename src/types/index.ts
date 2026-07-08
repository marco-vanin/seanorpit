/**
 * Shared domain types. Both the `duel` and `game` features depend on these
 * (a `Matchup`, a `Mode`, a `Side`), so they live in the pure leaf `types`
 * layer — never inside a feature — to keep the feature graph acyclic.
 */

/** A slot in a matchup: A (green) vs B (orange). */
export type Side = 'a' | 'b'

export interface ArtistSide {
  name: string
  /** Optional accent override; defaults to the slot accent (A green / B orange). */
  color?: string
  /** Artist photo (Deezer, resolved by name; curated: build-time), if resolved. */
  image?: string
  /** iTunes artist id — set for custom sides so the duel can be shared as a stateless link. */
  artistId?: number
}

export interface Song {
  title: string
  side: Side
  /** Meta line: year (· album for curated). */
  meta?: string
  previewUrl?: string
}

export interface Matchup {
  id: string
  source: 'curated' | 'custom'
  a: ArtistSide
  b: ArtistSide
  songs: Song[]
}

export type ModeKey = 'classique' | 'mortsubite'

export interface Mode {
  key: ModeKey
  /** URL param under /jouer/:mode */
  slug: string
  /** Display name (French) */
  label: string
  /** One-line card rule (French) */
  rule: string
  /** Short mono badge on the mode card (e.g. "10 titres" / "Sans filet"). */
  badge: string
  /** Longer card description (French). */
  blurb: string
  /** Emoji icon */
  icon: string
  /** Fixed round length, or 'endless' for the shuffled full pool */
  questions: number | 'endless'
  timerSeconds: number
  /** Mort subite: the first wrong/timeout answer ends the run. */
  endOnWrong: boolean
}

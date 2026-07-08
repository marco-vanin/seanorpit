import { C } from '../theme'
import matchupsData from './matchups.data.json'
import previews from './previews.json'
import photos from './photos.json'

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

interface RawSong {
  t: string
  side: Side
  m?: string
}
interface RawMatchup {
  id: string
  a: ArtistSide
  b: ArtistSide
  songs: RawSong[]
}

/** Build-time preview map, keyed { [matchupId]: { [title]: previewUrl } }. */
const PREVIEWS = previews as Record<string, Record<string, string>>

/** Build-time artist-photo map (Deezer), keyed { [matchupId]: { a?, b? } }. */
const PHOTOS = photos as Record<string, { a?: string; b?: string }>

/** Slot accent for a side: matchup override, else A = green, B = orange. */
export function sideColor(matchup: Matchup, side: Side): string {
  return matchup[side].color ?? (side === 'a' ? C.slotA : C.slotB)
}

function buildCurated(raw: RawMatchup): Matchup {
  const previewMap = PREVIEWS[raw.id] ?? {}
  const photo = PHOTOS[raw.id] ?? {}
  return {
    id: raw.id,
    source: 'curated',
    a: { ...raw.a, image: raw.a.image ?? photo.a },
    b: { ...raw.b, image: raw.b.image ?? photo.b },
    songs: raw.songs.map((s) => ({
      title: s.t,
      side: s.side,
      meta: s.m,
      previewUrl: previewMap[s.t],
    })),
  }
}

/** Curated matchups shipped at launch, ordered: seanpit, rihbey, guettacalvin. */
export const CURATED: Matchup[] = (matchupsData as RawMatchup[]).map(buildCurated)

/** Resolve a curated matchup by id, or undefined if unknown. */
export function matchupById(id: string): Matchup | undefined {
  return CURATED.find((m) => m.id === id)
}

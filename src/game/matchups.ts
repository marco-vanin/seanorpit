import { C } from '../theme'
import matchupsData from './matchups.data.json'
import previews from './previews.json'
import artwork from './artwork.json'

/** A slot in a matchup: A (green) vs B (orange). */
export type Side = 'a' | 'b'

export interface ArtistSide {
  name: string
  /** Optional accent override; defaults to the slot accent (A green / B orange). */
  color?: string
  /** Representative album artwork (curated: build-time; custom: selected hit), if resolved. */
  image?: string
}

/**
 * Rewrite an iTunes artwork URL's `…/{NxN}bb.jpg` size segment (e.g. `100x100`)
 * to `{size}x{size}`. Any URL that doesn't match the iTunes pattern is returned
 * unchanged — safe to call on arbitrary strings.
 */
export function upscaleArtwork(url: string, size = 600): string {
  return url.replace(/\/\d+x\d+bb\./, `/${size}x${size}bb.`)
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

/** Build-time artwork map, keyed { [matchupId]: { a?, b? } } (upscaled 600). */
const ARTWORK = artwork as Record<string, { a?: string; b?: string }>

/** Slot accent for a side: matchup override, else A = green, B = orange. */
export function sideColor(matchup: Matchup, side: Side): string {
  return matchup[side].color ?? (side === 'a' ? C.sean : C.pit)
}

function buildCurated(raw: RawMatchup): Matchup {
  const previewMap = PREVIEWS[raw.id] ?? {}
  const art = ARTWORK[raw.id] ?? {}
  return {
    id: raw.id,
    source: 'curated',
    a: { ...raw.a, image: raw.a.image ?? art.a },
    b: { ...raw.b, image: raw.b.image ?? art.b },
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

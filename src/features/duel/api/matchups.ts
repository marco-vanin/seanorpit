import type { ArtistSide, Matchup, Side } from '@/types'
import matchupsData from './matchups.data.json'
import previews from './previews.json'
import photos from './photos.json'

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

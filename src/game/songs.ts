export type ArtistKey = 'sean' | 'pit'

export interface Song {
  /** Track title */
  t: string
  /** Artist key */
  a: ArtistKey
  /** Meta line: year · album */
  m: string
}

/** Full name for an artist key. */
export const ARTIST_NAME: Record<ArtistKey, string> = {
  sean: 'Sean Paul',
  pit: 'Pitbull',
}

import songsData from './songs.data.json'

/**
 * Track pool for the blindtest — the single source of truth is
 * `songs.data.json` (shared with `scripts/fetch-previews.mjs`). Add or remove
 * tracks there, then re-run `npm run fetch:previews` to refresh the clips.
 */
export const SONGS: readonly Song[] = songsData as readonly Song[]

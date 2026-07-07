import type { Matchup, Side, Song } from './matchups'
import { upscaleArtwork } from './matchups'

/**
 * Live custom-duel builder over the iTunes Search/Lookup API.
 *
 * `itunes.apple.com` sends no CORS headers, so every request goes through JSONP:
 * we inject a <script> with a unique `&callback=`, resolve when the callback
 * fires, and reject on script error or timeout — always removing the script tag
 * and window callback afterwards so nothing leaks.
 */

const ENDPOINT = 'https://itunes.apple.com'

interface RawTrack {
  wrapperType?: string
  kind?: string
  trackName?: string
  artistId?: number
  artistName?: string
  previewUrl?: string
  releaseDate?: string
  primaryGenreName?: string
  artworkUrl100?: string
}

interface SearchResponse {
  results?: RawTrack[]
}
interface LookupResponse {
  results?: RawTrack[]
}

/** A selectable artist surfaced from a song search (deduped by `artistId`). */
export interface ArtistHit {
  artistId: number
  artistName: string
  genre?: string
  artworkUrl?: string
}

let jsonpCounter = 0

/**
 * JSONP GET. Appends `&callback=<unique>`, registers that callback on `window`,
 * resolves on invocation, rejects on `<script>` error or after `timeoutMs`.
 * The script tag and window callback are ALWAYS cleaned up (in a `finally`)
 * regardless of which path settles.
 */
export function jsonp<T>(url: string, timeoutMs = 8000): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const w = window as unknown as Record<string, unknown>
    const cbName = `__itunes_jsonp_cb_${Date.now()}_${jsonpCounter++}_${Math.floor(
      Math.random() * 1e6,
    )}`
    const script = document.createElement('script')
    let settled = false
    let timer = 0

    const cleanup = () => {
      if (timer) window.clearTimeout(timer)
      delete w[cbName]
      if (script.parentNode) script.parentNode.removeChild(script)
    }

    /** Settle once; guarantee cleanup via `finally`. */
    const settle = (run: () => void) => {
      if (settled) return
      settled = true
      try {
        run()
      } finally {
        cleanup()
      }
    }

    w[cbName] = (data: T) => settle(() => resolve(data))
    script.onerror = () => settle(() => reject(new Error('jsonp-network')))
    timer = window.setTimeout(() => settle(() => reject(new Error('jsonp-timeout'))), timeoutMs)

    const sep = url.includes('?') ? '&' : '?'
    script.src = `${url}${sep}callback=${cbName}`
    document.head.appendChild(script)
  })
}

/**
 * Live artist search for the custom-duel builder. Queries iTunes song search
 * (`entity=song`) — the `musicArtist` entity carries no artwork, so we mine a
 * representative track for each artist instead — then dedupes by `artistId`
 * (first occurrence wins, supplying name + genre + artwork). Results whose name
 * equals or starts with the query (case-insensitive) rank first; capped at 8.
 *
 * Guard: a term under 2 non-space chars resolves to `[]` with no request.
 *
 * `searchArtists` never rejects on the empty-term guard; a network/timeout
 * error still rejects (the caller treats a rejection as "no results" for that
 * keystroke). Callers pass their own last-query-wins token — this function is
 * stateless.
 */
export async function searchArtists(term: string): Promise<ArtistHit[]> {
  const q = term.trim()
  if (q.length < 2) return []

  const url = `${ENDPOINT}/search?term=${encodeURIComponent(q)}&entity=song&limit=25&country=US`
  const data = await jsonp<SearchResponse>(url)
  const results = data.results ?? []

  const byId = new Map<number, ArtistHit>()
  for (const r of results) {
    if (r.artistId == null || !r.artistName) continue
    if (byId.has(r.artistId)) continue // preserve first occurrence
    byId.set(r.artistId, {
      artistId: r.artistId,
      artistName: r.artistName,
      // Upscale the 100px thumb so dropdown rows + filled slots stay crisp.
      artworkUrl: r.artworkUrl100 ? upscaleArtwork(r.artworkUrl100, 300) : undefined,
      genre: r.primaryGenreName || undefined,
    })
  }

  const qLC = q.toLowerCase()
  const hits = [...byId.values()]
  // Stable rank: exact/prefix name matches first, iTunes order otherwise.
  hits.sort((x, y) => rankName(x.artistName, qLC) - rankName(y.artistName, qLC))
  return hits.slice(0, 8)
}

/** Lower rank sorts first: 0 = exact, 1 = prefix, 2 = other. */
function rankName(name: string, qLC: string): number {
  const n = name.toLowerCase()
  if (n === qLC) return 0
  if (n.startsWith(qLC)) return 1
  return 2
}

/** The artist's song catalog (the leading artist object is dropped). */
export async function songsForArtist(artistId: number): Promise<RawTrack[]> {
  const url = `${ENDPOINT}/lookup?id=${artistId}&entity=song&limit=200&country=US`
  const data = await jsonp<LookupResponse>(url)
  const results = data.results ?? []
  // The first entry is the artist wrapper; keep only actual tracks.
  return results.filter((r) => r.kind === 'song' || r.wrapperType === 'track')
}

const BANNED = [
  'remix',
  'live',
  'karaoke',
  'instrumental',
  'version',
  'edit',
  'sped up',
  'slowed',
  'mix',
]

const lower = (s: string | undefined) => (s || '').toLowerCase()

/** Base title: strip (…)/[…]/- … suffixes, punctuation, lowercase — for dedupe. */
function baseTitle(title: string | undefined): string {
  return lower(title)
    .replace(/\(.*?\)/g, '')
    .replace(/\[.*?\]/g, '')
    .replace(/\s-\s.*$/, '')
    .replace(/[^a-z0-9]/g, '')
}

/**
 * Filter one artist's catalog for the blindtest, knowing the opponent's resolved
 * name. Keeps a track only if it has a preview, isn't a remix/live/edit/etc,
 * doesn't leak the opponent's name, has the target as its primary artist, and is
 * the first survivor for its normalized base title. `meta` = release year.
 */
function filterTracks(
  tracks: RawTrack[],
  targetName: string,
  opponentName: string,
  side: Side,
): Song[] {
  const targetLC = lower(targetName)
  const oppLC = lower(opponentName)
  const seen = new Set<string>()
  const out: Song[] = []

  for (const tr of tracks) {
    if (!tr.previewUrl) continue
    const trackLC = lower(tr.trackName)
    if (BANNED.some((w) => trackLC.includes(w))) continue
    // Feat-leak: the opponent's name must not appear in title or artist.
    if (oppLC && (trackLC.includes(oppLC) || lower(tr.artistName).includes(oppLC))) continue
    // Primary artist must be the target (drop collabs where target is a guest).
    if (!lower(tr.artistName).startsWith(targetLC)) continue
    const base = baseTitle(tr.trackName)
    if (!base || seen.has(base)) continue
    seen.add(base)
    const meta = tr.releaseDate ? tr.releaseDate.slice(0, 4) : undefined
    out.push({ title: tr.trackName ?? '', side, meta, previewUrl: tr.previewUrl })
  }
  return out
}

function shuffle<T>(arr: readonly T[]): T[] {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export type BuildResult =
  | { ok: true; matchup: Matchup }
  | {
      ok: false
      reason: 'not-enough' | 'network'
      which?: 'a' | 'b' | 'both'
      message: string
    }

/** Minimum clean tracks required per side. */
export const MIN_TRACKS = 8
/** Cap on tracks kept per side before shuffling into the pool. */
const CAP_PER_SIDE = 12

/**
 * Fetch + filter both selected artists' catalogs and assemble an in-memory
 * custom `Matchup` if each side clears the ≥ 8 clean-track floor. The artists
 * are already chosen (via `searchArtists`), so there is no top-match guessing
 * and no `not-found` case — only `not-enough` (naming the short side) and
 * `network`. Failures return a French `message`.
 */
export async function buildCustomMatchup(a: ArtistHit, b: ArtistHit): Promise<BuildResult> {
  let ta: RawTrack[]
  let tb: RawTrack[]
  try {
    ;[ta, tb] = await Promise.all([songsForArtist(a.artistId), songsForArtist(b.artistId)])
  } catch {
    return { ok: false, reason: 'network', message: 'Problème de réseau — réessaie.' }
  }

  const songsA = filterTracks(ta, a.artistName, b.artistName, 'a')
  const songsB = filterTracks(tb, b.artistName, a.artistName, 'b')
  const shortA = songsA.length < MIN_TRACKS
  const shortB = songsB.length < MIN_TRACKS

  if (shortA && shortB)
    return {
      ok: false,
      reason: 'not-enough',
      which: 'both',
      message: `Pas assez d'extraits pour « ${a.artistName} » et « ${b.artistName} ».`,
    }
  if (shortA)
    return {
      ok: false,
      reason: 'not-enough',
      which: 'a',
      message: `Pas assez d'extraits pour « ${a.artistName} ».`,
    }
  if (shortB)
    return {
      ok: false,
      reason: 'not-enough',
      which: 'b',
      message: `Pas assez d'extraits pour « ${b.artistName} ».`,
    }

  const pickA = shuffle(songsA).slice(0, CAP_PER_SIDE)
  const pickB = shuffle(songsB).slice(0, CAP_PER_SIDE)
  const songs = shuffle([...pickA, ...pickB])

  return {
    ok: true,
    matchup: {
      id: 'custom',
      source: 'custom',
      a: { name: a.artistName, image: a.artworkUrl ? upscaleArtwork(a.artworkUrl) : undefined },
      b: { name: b.artistName, image: b.artworkUrl ? upscaleArtwork(b.artworkUrl) : undefined },
      songs,
    },
  }
}

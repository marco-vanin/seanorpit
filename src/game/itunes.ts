import type { Matchup, Side, Song } from './matchups'
import { jsonp } from './jsonp'
import { resolveArtistPhoto } from './deezer'

/**
 * Live custom-duel builder over the iTunes Search/Lookup API.
 *
 * `itunes.apple.com` sends no CORS headers, so every request goes through JSONP
 * (see `./jsonp`). iTunes supplies search results, previews, and shared-link
 * ids; artist PHOTOS come from Deezer (`./deezer`), resolved by name — iTunes
 * album art is no longer rendered anywhere.
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
}

interface SearchResponse {
  results?: RawTrack[]
}
interface LookupResponse {
  results?: RawTrack[]
}

/**
 * A selectable artist surfaced from a song search (deduped by `artistId`).
 * `photoUrl` is a Deezer artist photo — NOT populated by search (dropdown rows
 * stay placeholder); it's resolved on selection, and carried by quick-pick
 * suggestions from `suggested.json`.
 */
export interface ArtistHit {
  artistId: number
  artistName: string
  genre?: string
  photoUrl?: string
}

/**
 * Live artist search for the custom-duel builder. Queries iTunes song search
 * (`entity=song`) — the `musicArtist` entity is thin, so we mine tracks — then
 * dedupes by `artistId` (first occurrence wins, supplying name + genre).
 * Dropdown rows show the initial-letter placeholder; the Deezer photo resolves
 * only on selection. Results whose name equals or starts with the query
 * (case-insensitive) rank first; capped at 8.
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

/**
 * Resolve a single artist from its iTunes id (for the shared-duel recipient
 * flow). Looks up `id` with `entity=song`: the response leads with an `artist`
 * wrapper (reliable name + genre) followed by song rows.
 *
 * - name + genre come from the leading `wrapperType === 'artist'` object. A
 *   song's own `artistName` may be a collaborator, so it is NOT used for the
 *   name. If the artist object is absent → `null`.
 * - the photo is resolved downstream (Deezer, by name) in `buildCustomMatchup`.
 */
export async function resolveArtistById(id: number): Promise<ArtistHit | null> {
  const url = `${ENDPOINT}/lookup?id=${id}&entity=song&limit=5&country=US`
  const data = await jsonp<LookupResponse>(url)
  const results = data.results ?? []

  const artist = results.find((r) => r.wrapperType === 'artist')
  if (!artist || !artist.artistName) return null

  return {
    artistId: id,
    artistName: artist.artistName,
    genre: artist.primaryGenreName || undefined,
  }
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
      reason: 'not-enough' | 'network' | 'not-found'
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

  // Resolve both artist photos from Deezer in parallel. Each is wrapped so a
  // rejection (or a miss) becomes `undefined` → the placeholder; a photo miss
  // NEVER fails the build (the ≥ 8-track fairness above is independent). An
  // already-carried `photoUrl` (quick-pick suggestions) short-circuits the fetch.
  const safePhoto = (name: string) => resolveArtistPhoto(name).catch(() => undefined)
  const [pa, pb] = await Promise.all([
    a.photoUrl ? Promise.resolve(a.photoUrl) : safePhoto(a.artistName),
    b.photoUrl ? Promise.resolve(b.photoUrl) : safePhoto(b.artistName),
  ])

  return {
    ok: true,
    matchup: {
      id: 'custom',
      source: 'custom',
      a: {
        name: a.artistName,
        image: pa,
        artistId: a.artistId,
      },
      b: {
        name: b.artistName,
        image: pb,
        artistId: b.artistId,
      },
      songs,
    },
  }
}

/**
 * Recipient-side builder for a shared duel: resolve both artist ids in parallel,
 * then reuse `buildCustomMatchup` (same catalog filter + ≥ 8 fairness). If either
 * id fails to resolve → `not-found`; otherwise the usual `not-enough` / `network`
 * / success. A network/timeout in `resolveArtistById` rejects and is treated as
 * `network` by the caller.
 */
export async function buildCustomMatchupByIds(idA: number, idB: number): Promise<BuildResult> {
  const [a, b] = await Promise.all([resolveArtistById(idA), resolveArtistById(idB)])
  if (!a || !b) {
    return { ok: false, reason: 'not-found', message: 'Artiste introuvable.' }
  }
  return buildCustomMatchup(a, b)
}

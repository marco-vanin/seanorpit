import { jsonp } from '@/lib/jsonp'

/**
 * Deezer artist-photo resolver (JSONP, no backend).
 *
 * iTunes (our search/preview/shared-link source) carries no artist photos;
 * Deezer's artist search does (`picture_big` / `picture_medium`) and supports
 * JSONP. We resolve a photo BY NAME and use it as the artist `image` everywhere.
 * Failures and default silhouettes resolve to `undefined` → the initial-letter
 * placeholder renders instead (never an album cover, never a broken image).
 */

const ENDPOINT = 'https://api.deezer.com'

interface DeezerArtist {
  picture_big?: string
  picture_medium?: string
}
interface DeezerSearchResponse {
  data?: DeezerArtist[]
}

/**
 * Deezer's default (no-photo) silhouette has an empty image hash, i.e. the URL
 * contains `/artist//`. Treat that — and any absent/empty picture — as "no
 * photo" so we fall back to the placeholder rather than showing a silhouette.
 */
function isRealPhoto(url: string | undefined): url is string {
  return !!url && !url.includes('/artist//')
}

/**
 * Resolve a Deezer artist photo by name. Returns `picture_big || picture_medium`
 * from the top hit, or `undefined` when the name is empty, there's no match, the
 * picture is Deezer's default silhouette, or anything throws. Never rejects.
 */
export async function resolveArtistPhoto(name: string): Promise<string | undefined> {
  const q = name.trim()
  if (!q) return undefined
  try {
    const url = `${ENDPOINT}/search/artist?q=${encodeURIComponent(q)}&limit=1&output=jsonp`
    const data = await jsonp<DeezerSearchResponse>(url)
    const artist = data.data?.[0]
    if (!artist) return undefined
    const photo = artist.picture_big || artist.picture_medium
    return isRealPhoto(photo) ? photo : undefined
  } catch {
    return undefined
  }
}

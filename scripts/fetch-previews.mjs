#!/usr/bin/env node
/**
 * Build-time data fetcher for the blindtest. Runs in Node (no browser CORS /
 * JSONP constraints), throttled at 200ms between calls. Writes three files:
 *
 *   src/features/duel/previews.json   { [matchupId]: { [title]: previewUrl } }  (iTunes)
 *   src/features/duel/photos.json     { [matchupId]: { a?, b? } }               (Deezer)
 *   src/features/duel/suggested.json  ArtistHit[] with photoUrl                 (Deezer)
 *
 * iTunes supplies the 30s preview clips; Deezer supplies real ARTIST PHOTOS
 * (resolved by name) — iTunes album art is no longer used anywhere.
 *
 * Re-run any time:  npm run fetch:previews
 */
import { readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const OUT = resolve(here, '../src/features/duel/previews.json')
const PHOTOS_OUT = resolve(here, '../src/features/duel/photos.json')
const SUGGESTED_OUT = resolve(here, '../src/features/duel/suggested.json')

// Single source of truth, shared with src/features/duel/matchups.ts.
const MATCHUPS = JSON.parse(
  await readFile(resolve(here, '../src/features/duel/matchups.data.json'), 'utf8'),
)
const SUGGESTED = JSON.parse(await readFile(SUGGESTED_OUT, 'utf8'))

const norm = (s) => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '')
const sleep = () => new Promise((r) => setTimeout(r, 200))

async function search(term) {
  const url =
    'https://itunes.apple.com/search?media=music&entity=song&limit=10&country=US&term=' +
    encodeURIComponent(term)
  const res = await fetch(url, { headers: { 'User-Agent': 'seanvspit/0.1 (blindtest)' } })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const body = await res.json()
  return body.results ?? []
}

function pickBest(results, artist, title) {
  const a = artist.toLowerCase()
  const t = norm(title)
  const scored = results
    .filter((r) => r.previewUrl)
    .map((r) => {
      let score = 0
      if ((r.artistName || '').toLowerCase().includes(a)) score += 3
      const tn = norm(r.trackName)
      if (tn === t) score += 3
      else if (tn.includes(t) || t.includes(tn)) score += 2
      return { r, score }
    })
    .filter((x) => x.score > 0)
    .sort((x, y) => y.score - x.score)
  return scored.length ? scored[0].r : null
}

/**
 * Resolve a Deezer artist photo by name (Node, plain JSON — no JSONP). Returns
 * `picture_big` from the top hit, unless it's empty or Deezer's default
 * silhouette (URL contains `/artist//`) → `undefined`. Never throws.
 */
async function deezerPhoto(name) {
  try {
    const url = 'https://api.deezer.com/search/artist?q=' + encodeURIComponent(name) + '&limit=1'
    const res = await fetch(url, { headers: { 'User-Agent': 'seanvspit/0.1 (blindtest)' } })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const body = await res.json()
    const pic = body.data?.[0]?.picture_big
    if (!pic || pic.includes('/artist//')) return undefined
    return pic
  } catch (e) {
    console.warn(`  ✗ deezer photo: ${name}: ${e.message}`)
    return undefined
  }
}

// ── iTunes previews + Deezer curated photos ──────────────────────────────────
const out = {}
const photosOut = {}
const summary = []
for (const matchup of MATCHUPS) {
  const artistFor = { a: matchup.a.name, b: matchup.b.name }
  const bucket = {}
  let ok = 0
  for (const s of matchup.songs) {
    const artist = artistFor[s.side]
    try {
      const results = await search(`${artist} ${s.t}`)
      const hit = pickBest(results, artist, s.t)
      if (hit?.previewUrl) {
        bucket[s.t] = hit.previewUrl
        ok++
        console.log(`✓ [${matchup.id}] ${artist} — ${s.t}  →  ${hit.trackName} (${hit.artistName})`)
      } else {
        console.warn(`✗ [${matchup.id}] no preview: ${artist} — ${s.t}`)
      }
    } catch (e) {
      console.warn(`✗ [${matchup.id}] error: ${artist} — ${s.t}: ${e.message}`)
    }
    await sleep()
  }
  out[matchup.id] = bucket

  // One Deezer photo lookup per side (by artist name).
  const pa = await deezerPhoto(matchup.a.name)
  await sleep()
  const pb = await deezerPhoto(matchup.b.name)
  await sleep()
  const photo = {}
  if (pa) photo.a = pa
  if (pb) photo.b = pb
  photosOut[matchup.id] = photo

  summary.push(
    `${matchup.id}: ${ok}/${matchup.songs.length} previews · photo a:${pa ? '✓' : '✗'} b:${
      pb ? '✓' : '✗'
    }`,
  )
}

// ── Deezer photos for the suggestion pool ────────────────────────────────────
const suggestedOut = []
const suggestedSummary = []
for (const s of SUGGESTED) {
  const photoUrl = await deezerPhoto(s.artistName)
  await sleep()
  const entry = { artistId: s.artistId, artistName: s.artistName }
  if (s.genre) entry.genre = s.genre
  if (photoUrl) entry.photoUrl = photoUrl
  suggestedOut.push(entry)
  suggestedSummary.push(`${s.artistName}: photo ${photoUrl ? '✓' : '✗'}`)
}

await writeFile(OUT, JSON.stringify(out, null, 2) + '\n')
await writeFile(PHOTOS_OUT, JSON.stringify(photosOut, null, 2) + '\n')
await writeFile(SUGGESTED_OUT, JSON.stringify(suggestedOut, null, 2) + '\n')

console.log(`\nWrote previews  → ${OUT}`)
console.log(`Wrote photos    → ${PHOTOS_OUT}`)
console.log(`Wrote suggested → ${SUGGESTED_OUT}`)
console.log('\nCurated matchups:')
for (const line of summary) console.log(`  ${line}`)
console.log('\nSuggestion pool:')
for (const line of suggestedSummary) console.log(`  ${line}`)

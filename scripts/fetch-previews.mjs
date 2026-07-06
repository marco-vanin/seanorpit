#!/usr/bin/env node
/**
 * Resolve a 30-second preview clip for every track via the iTunes Search API
 * and write src/game/previews.json ({ [title]: previewUrl }).
 *
 * Runs in Node so there's no browser CORS constraint. The resulting previewUrl
 * values are Apple-CDN audio files that play fine in an <audio> element.
 *
 * Re-run any time:  npm run fetch:previews
 */
import { writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const OUT = resolve(here, '../src/game/previews.json')

// Keep this list in sync with src/game/songs.ts (title + artist key).
const SONGS = [
  { t: 'Temperature', a: 'sean' },
  { t: 'Get Busy', a: 'sean' },
  { t: 'Gimme the Light', a: 'sean' },
  { t: "We Be Burnin'", a: 'sean' },
  { t: 'Like Glue', a: 'sean' },
  { t: 'Give It Up to Me', a: 'sean' },
  { t: "She Doesn't Mind", a: 'sean' },
  { t: 'Got 2 Luv U', a: 'sean' },
  { t: 'So Fine', a: 'sean' },
  { t: "Ever Blazin'", a: 'sean' },
  { t: 'Timber', a: 'pit' },
  { t: 'Give Me Everything', a: 'pit' },
  { t: 'International Love', a: 'pit' },
  { t: 'Hotel Room Service', a: 'pit' },
  { t: 'I Know You Want Me', a: 'pit' },
  { t: 'Fireball', a: 'pit' },
  { t: 'Feel This Moment', a: 'pit' },
  { t: 'Rain Over Me', a: 'pit' },
  { t: 'Time of Our Lives', a: 'pit' },
  { t: "Don't Stop the Party", a: 'pit' },
]

const ARTIST = { sean: 'Sean Paul', pit: 'Pitbull' }
const norm = (s) => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '')

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

const out = {}
let ok = 0
for (const s of SONGS) {
  const artist = ARTIST[s.a]
  try {
    const results = await search(`${artist} ${s.t}`)
    const hit = pickBest(results, artist, s.t)
    if (hit?.previewUrl) {
      out[s.t] = hit.previewUrl
      ok++
      console.log(`✓ ${artist} — ${s.t}  →  ${hit.trackName} (${hit.artistName})`)
    } else {
      console.warn(`✗ no preview: ${artist} — ${s.t}`)
    }
  } catch (e) {
    console.warn(`✗ error: ${artist} — ${s.t}: ${e.message}`)
  }
  await new Promise((r) => setTimeout(r, 200))
}

await writeFile(OUT, JSON.stringify(out, null, 2) + '\n')
console.log(`\nWrote ${ok}/${SONGS.length} previews → ${OUT}`)

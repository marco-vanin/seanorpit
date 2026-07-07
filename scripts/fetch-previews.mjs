#!/usr/bin/env node
/**
 * Resolve a 30-second preview clip for every curated track via the iTunes
 * Search API and write src/game/previews.json keyed by matchup:
 *   { [matchupId]: { [title]: previewUrl } }
 *
 * Runs in Node so there's no browser CORS constraint. The resulting previewUrl
 * values are Apple-CDN audio files that play fine in an <audio> element.
 *
 * Re-run any time:  npm run fetch:previews
 */
import { readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const OUT = resolve(here, '../src/game/previews.json')
const ART_OUT = resolve(here, '../src/game/artwork.json')

/** Rewrite the iTunes `…/{NxN}bb.jpg` size segment (mirror of upscaleArtwork). */
const upscaleArtwork = (url, size = 600) =>
  url ? url.replace(/\/\d+x\d+bb\./, `/${size}x${size}bb.`) : url

// Single source of truth, shared with src/game/matchups.ts.
const MATCHUPS = JSON.parse(await readFile(resolve(here, '../src/game/matchups.data.json'), 'utf8'))

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
const artOut = {}
const summary = []
for (const matchup of MATCHUPS) {
  const artistFor = { a: matchup.a.name, b: matchup.b.name }
  const bucket = {}
  // First successful hit's artwork per side becomes that artist's image.
  const art = {}
  let ok = 0
  for (const s of matchup.songs) {
    const artist = artistFor[s.side]
    try {
      const results = await search(`${artist} ${s.t}`)
      const hit = pickBest(results, artist, s.t)
      if (hit?.previewUrl) {
        bucket[s.t] = hit.previewUrl
        ok++
        // Capture the representative artwork for this side (no extra API call).
        if (!art[s.side] && hit.artworkUrl100) art[s.side] = upscaleArtwork(hit.artworkUrl100)
        console.log(`✓ [${matchup.id}] ${artist} — ${s.t}  →  ${hit.trackName} (${hit.artistName})`)
      } else {
        console.warn(`✗ [${matchup.id}] no preview: ${artist} — ${s.t}`)
      }
    } catch (e) {
      console.warn(`✗ [${matchup.id}] error: ${artist} — ${s.t}: ${e.message}`)
    }
    await new Promise((r) => setTimeout(r, 200))
  }
  out[matchup.id] = bucket
  artOut[matchup.id] = art
  const gotA = art.a ? '✓' : '✗'
  const gotB = art.b ? '✓' : '✗'
  summary.push(
    `${matchup.id}: ${ok}/${matchup.songs.length} previews · artwork a:${gotA} b:${gotB}`,
  )
}

await writeFile(OUT, JSON.stringify(out, null, 2) + '\n')
await writeFile(ART_OUT, JSON.stringify(artOut, null, 2) + '\n')
console.log(`\nWrote previews → ${OUT}`)
console.log(`Wrote artwork  → ${ART_OUT}`)
for (const line of summary) console.log(`  ${line}`)

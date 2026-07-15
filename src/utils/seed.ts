/**
 * Deterministic seeding primitives for the daily challenge. Pure, dependency-
 * free and stable across sessions/machines — the same input always yields the
 * same output, so every player gets the identical "Duel du jour" for a date.
 */

/**
 * Deterministic 32-bit unsigned hash of a string (FNV-1a). Same input ⇒ same
 * output; used to seed the daily pick + song order from a `YYYY-MM-DD` key.
 */
export function hashStr(s: string): number {
  let h = 0x811c9dc5 // FNV offset basis
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    // FNV prime multiply via shifts to stay in 32-bit range.
    h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0
  }
  return h >>> 0
}

/** Seeded PRNG (mulberry32) returning a float in `[0, 1)`. Deterministic. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * Fisher–Yates shuffle driven by `mulberry32(seed)`. Pure and non-mutating —
 * the same `(arr, seed)` always produces the same order.
 */
export function seededShuffle<T>(arr: readonly T[], seed: number): T[] {
  const a = arr.slice()
  const rng = mulberry32(seed)
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

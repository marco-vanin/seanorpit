/**
 * Daily-challenge picker. Deterministic from a `YYYY-MM-DD` date key: the same
 * date yields the same curated duel + the same song order for everyone, with no
 * backend. Lives in the `duel` feature because it reads `CURATED`.
 */
import type { Matchup } from '@/types'
import { hashStr, seededShuffle } from '@/utils/seed'
import { CURATED } from './matchups'

/** The curated duel featured for a given date. Pure; never throws. */
export function dailyMatchup(dateKey: string): Matchup {
  return CURATED[hashStr(dateKey) % CURATED.length]
}

/**
 * Deterministic song order for the daily: a date-seeded shuffle of the song
 * indices, sliced to `min(questions, songs.length)`. Mirrors `orderFor`'s
 * Classique slice, but seeded — same date ⇒ same order.
 */
export function dailyOrder(matchup: Matchup, dateKey: string, questions: number): number[] {
  const indices = matchup.songs.map((_, i) => i)
  const shuffled = seededShuffle(indices, hashStr(dateKey + '#order'))
  return shuffled.slice(0, Math.min(questions, matchup.songs.length))
}

/**
 * Daily-challenge persistence over localStorage, keyed from `@/config`. Lives in
 * the shared `lib` layer (next to `stats.ts`) so both the `duel` feature (the
 * DailyCard reads it) and the `game` engine (records on finish) can use it
 * without a cross-feature edge. All reads/writes are guarded — a missing or
 * corrupt value is treated as "never played".
 */
import { STORAGE_KEYS } from '@/config'

/** Derived daily state for the home card. */
export interface DailyState {
  /** Whether today's daily has already been completed (hard lock). */
  playedToday: boolean
  /** Today's recorded score/total, or null if not played today. */
  todayScore: number | null
  todayTotal: number | null
  /** Current, gap-aware streak (0 once a day has been missed). */
  streak: number
  /** Best daily streak ever reached. */
  best: number
  /** A live streak (last = yesterday) exists but today isn't played yet. */
  atRisk: boolean
}

interface StoredResult {
  date: string
  score: number
  total: number
}

// ── Date helpers (local calendar date; NOT UTC) ─────────────────────────────

/** Local `YYYY-MM-DD` for the current moment. */
export function todayKey(): string {
  return formatKey(new Date())
}

function formatKey(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** The local calendar day before `dateKey`, as a `YYYY-MM-DD` string. */
function yesterday(dateKey: string): string {
  const [y, m, d] = dateKey.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  date.setDate(date.getDate() - 1)
  return formatKey(date)
}

/** French short date, e.g. "15 juil" (fr-FR, no year). */
export function formatDayMonth(dateKey: string): string {
  const [y, m, d] = dateKey.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' })
    .format(date)
    .replace('.', '')
}

// ── Guarded raw reads ───────────────────────────────────────────────────────

function readStr(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function readInt(key: string): number {
  try {
    return parseInt(localStorage.getItem(key) || '0', 10) || 0
  } catch {
    return 0
  }
}

function readResult(): StoredResult | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.dailyResult)
    if (!raw) return null
    const parsed = JSON.parse(raw) as StoredResult
    if (typeof parsed?.date !== 'string') return null
    return parsed
  } catch {
    return null
  }
}

// ── Public API ──────────────────────────────────────────────────────────────

/** Derive the current daily state from the four `bd_daily_*` keys. */
export function readDaily(): DailyState {
  const today = todayKey()
  const last = readStr(STORAGE_KEYS.dailyLast)
  const storedStreak = readInt(STORAGE_KEYS.dailyStreak)
  const best = readInt(STORAGE_KEYS.dailyBest)
  const result = readResult()

  const playedToday = last === today
  const liveYesterday = last === yesterday(today)
  // The streak survives only if the last play was today or yesterday.
  const streak = playedToday || liveYesterday ? storedStreak : 0
  const atRisk = !playedToday && storedStreak >= 1 && liveYesterday

  const hasToday = result?.date === today
  return {
    playedToday,
    todayScore: hasToday ? result!.score : null,
    todayTotal: hasToday ? result!.total : null,
    streak,
    best,
    atRisk,
  }
}

/**
 * Record a completed daily for `dateKey`. Idempotent per date: re-recording the
 * same day is a no-op (the hard-lock guard). +1 on a consecutive day, resets to
 * 1 otherwise; best is preserved.
 */
export function recordDaily(dateKey: string, score: number, total: number): void {
  try {
    const last = readStr(STORAGE_KEYS.dailyLast)
    if (last === dateKey) return // already recorded today — no-op

    const storedStreak = readInt(STORAGE_KEYS.dailyStreak)
    const best = readInt(STORAGE_KEYS.dailyBest)
    const newStreak = last === yesterday(dateKey) ? storedStreak + 1 : 1

    localStorage.setItem(STORAGE_KEYS.dailyLast, dateKey)
    localStorage.setItem(STORAGE_KEYS.dailyStreak, String(newStreak))
    localStorage.setItem(STORAGE_KEYS.dailyBest, String(Math.max(best, newStreak)))
    localStorage.setItem(
      STORAGE_KEYS.dailyResult,
      JSON.stringify({ date: dateKey, score, total } satisfies StoredResult),
    )
  } catch {
    /* ignore — private mode / storage disabled */
  }
}

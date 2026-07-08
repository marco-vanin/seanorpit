import type { Matchup } from '@/types'

/**
 * Stateless share link for a custom duel: the two artists' iTunes ids in the
 * path (`/duel/<idA>/<idB>`). No server, no saved duels — the recipient
 * re-resolves both ids and rebuilds the matchup. Returns `null` for curated
 * matchups (no `artistId`s), so the share button stays hidden there.
 */
export function duelShareUrl(matchup: Matchup): string | null {
  const idA = matchup.a.artistId
  const idB = matchup.b.artistId
  if (idA == null || idB == null) return null
  return `${window.location.origin}/duel/${idA}/${idB}`
}

/** Whether the link made it to the clipboard, so the caller can toast on 'copied'. */
export type ShareOutcome = 'copied' | 'unavailable'

/**
 * Copy a custom duel's share **link** — just the URL, no preamble — to the
 * clipboard. Deliberately NOT the Web Share API: no native "share on…" sheet,
 * just a clean copy + a "Lien copié" toast from the caller. `'unavailable'` when
 * the duel has no link (curated) or the clipboard is blocked. Needs a user
 * gesture (call from a button click).
 */
export async function shareDuel(matchup: Matchup): Promise<ShareOutcome> {
  const url = duelShareUrl(matchup)
  if (!url || !navigator.clipboard?.writeText) return 'unavailable'
  try {
    await navigator.clipboard.writeText(url)
    return 'copied'
  } catch {
    return 'unavailable'
  }
}

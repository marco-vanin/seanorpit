export interface Grade {
  label: string
  color: string
}

/** Round accuracy as a 0–100 integer. */
export function accuracyPct(score: number, total: number): number {
  return total > 0 ? Math.round((score / total) * 100) : 0
}

/**
 * French grade + accent color for a given accuracy. Deliberately artist-neutral
 * so it fits any duel (custom included), not just the two artists.
 */
export function gradeFor(accuracy: number): Grade {
  if (accuracy >= 90) return { label: 'Oreille en or 🏆', color: 'var(--slot-a)' }
  if (accuracy >= 70) return { label: 'Oreille affûtée 🎧', color: 'var(--slot-a)' }
  if (accuracy >= 50) return { label: 'Pas mal — la moitié dans le mille.', color: 'var(--gold)' }
  return { label: 'À retravailler — retente ta chance.', color: 'var(--muted)' }
}

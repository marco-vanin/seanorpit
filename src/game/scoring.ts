import { C } from '../theme'

export interface Grade {
  label: string
  color: string
}

/** Round accuracy as a 0–100 integer. */
export function accuracyPct(score: number, total: number): number {
  return total > 0 ? Math.round((score / total) * 100) : 0
}

/** French grade + accent color for a given accuracy. */
export function gradeFor(accuracy: number): Grade {
  if (accuracy >= 90) return { label: 'Expert Worldwide certifié 🌎', color: C.sean }
  if (accuracy >= 70)
    return { label: 'Oreille affûtée — tu connais tes classiques.', color: C.sean }
  if (accuracy >= 50) return { label: 'Solide. La moitié du dancefloor est à toi.', color: C.gold }
  return { label: 'Pas ton style — retente ta chance.', color: C.muted }
}

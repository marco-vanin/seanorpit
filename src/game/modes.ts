/**
 * Game modes — one config map, one engine. Each mode carries its own round
 * length, timer, run-end rule, and localStorage best key. The engine
 * (`useGame`) reads these off the active mode; nothing about a mode is
 * hardcoded elsewhere.
 */

export type ModeKey = 'classique' | 'mortsubite'

export interface Mode {
  key: ModeKey
  /** URL param under /jouer/:mode */
  slug: string
  /** Display name (French) */
  label: string
  /** One-line card rule (French) */
  rule: string
  /** Short mono badge on the mode card (e.g. "10 titres" / "Sans filet"). */
  badge: string
  /** Longer card description (French). */
  blurb: string
  /** Emoji icon */
  icon: string
  /** Fixed round length, or 'endless' for the shuffled full pool */
  questions: number | 'endless'
  timerSeconds: number
  /** Mort subite: the first wrong/timeout answer ends the run. */
  endOnWrong: boolean
  /** localStorage key holding this mode's best. */
  bestKey: string
}

export const MODES: Record<ModeKey, Mode> = {
  classique: {
    key: 'classique',
    slug: 'classique',
    label: 'Classique',
    rule: '10 titres · 30 s par titre',
    badge: '10 titres',
    blurb: 'Le format de référence. Écoute, tranche, vise le sans-faute sur dix extraits.',
    icon: '🎧',
    questions: 10,
    timerSeconds: 30,
    endOnWrong: false,
    bestKey: 'spvp_best_classique',
  },
  mortsubite: {
    key: 'mortsubite',
    slug: 'mort-subite',
    label: 'Mort subite',
    rule: 'Une erreur et c’est terminé',
    badge: 'Sans filet',
    blurb: 'Une seule erreur et la manche s’arrête net. Jusqu’où tiendra ta série ?',
    icon: '💀',
    questions: 'endless',
    timerSeconds: 30,
    endOnWrong: true,
    bestKey: 'spvp_best_mortsubite',
  },
}

/** Ordered list for the home hub: Classique, Mort subite. */
export const MODE_LIST: Mode[] = [MODES.classique, MODES.mortsubite]

/** Resolve a URL slug to its mode, or undefined if unknown. */
export function modeBySlug(slug: string): Mode | undefined {
  return MODE_LIST.find((m) => m.slug === slug)
}

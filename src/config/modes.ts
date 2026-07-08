/**
 * Game modes — one config map, one engine. Each mode carries its own round
 * length, timer, and run-end rule. The engine (`useGame`) reads these off the
 * active mode; nothing about a mode is hardcoded elsewhere. Shared config
 * (mode-select in `duel` renders the list; play in `game` consumes the config),
 * so it lives in the leaf `config` layer, not a feature.
 */
import type { Mode, ModeKey } from '@/types'

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
  },
}

/** Ordered list for the home hub: Classique, Mort subite. */
export const MODE_LIST: Mode[] = [MODES.classique, MODES.mortsubite]

/** Resolve a URL slug to its mode, or undefined if unknown. */
export function modeBySlug(slug: string): Mode | undefined {
  return MODE_LIST.find((m) => m.slug === slug)
}

/**
 * Light/dark theme mode: persistence + application to <html>.
 *
 * The active mode is written to `<html data-theme="…">`, which flips the CSS
 * custom properties defined in `src/index.css`. Default is dark (the original
 * look). Applied in `main.tsx` before React renders so there is no flash.
 */
export type ThemeMode = 'dark' | 'light'

const THEME_KEY = 'bd_theme'

/** Read the saved mode, defaulting to dark. Safe if storage is unavailable. */
export function readTheme(): ThemeMode {
  try {
    return localStorage.getItem(THEME_KEY) === 'light' ? 'light' : 'dark'
  } catch {
    return 'dark'
  }
}

/** Apply a mode to <html> and persist it. */
export function applyTheme(mode: ThemeMode): void {
  document.documentElement.setAttribute('data-theme', mode)
  try {
    localStorage.setItem(THEME_KEY, mode)
  } catch {
    /* storage unavailable — the attribute still themes this session */
  }
}

/**
 * Shared JSONP GET helper.
 *
 * Some music APIs (iTunes, Deezer) send no CORS headers, so requests go through
 * JSONP: we inject a `<script>` with a unique `&callback=`, resolve when that
 * callback fires, and reject on script error or timeout — always removing the
 * script tag and window callback afterwards so nothing leaks.
 */

let jsonpCounter = 0

/**
 * JSONP GET. Appends `&callback=<unique>`, registers that callback on `window`,
 * resolves on invocation, rejects on `<script>` error or after `timeoutMs`.
 * The script tag and window callback are ALWAYS cleaned up (in a `finally`)
 * regardless of which path settles.
 */
export function jsonp<T>(url: string, timeoutMs = 8000): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const w = window as unknown as Record<string, unknown>
    const cbName = `__jsonp_cb_${Date.now()}_${jsonpCounter++}_${Math.floor(Math.random() * 1e6)}`
    const script = document.createElement('script')
    let settled = false
    let timer = 0

    const cleanup = () => {
      if (timer) window.clearTimeout(timer)
      delete w[cbName]
      if (script.parentNode) script.parentNode.removeChild(script)
    }

    /** Settle once; guarantee cleanup via `finally`. */
    const settle = (run: () => void) => {
      if (settled) return
      settled = true
      try {
        run()
      } finally {
        cleanup()
      }
    }

    w[cbName] = (data: T) => settle(() => resolve(data))
    script.onerror = () => settle(() => reject(new Error('jsonp-network')))
    timer = window.setTimeout(() => settle(() => reject(new Error('jsonp-timeout'))), timeoutMs)

    const sep = url.includes('?') ? '&' : '?'
    script.src = `${url}${sep}callback=${cbName}`
    document.head.appendChild(script)
  })
}

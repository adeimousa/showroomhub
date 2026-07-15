'use client'

import { useSyncExternalStore, useCallback, useEffect } from 'react'
import { Lang, LANGS, translate } from '@/lib/i18n'

const STORAGE_KEY = 'showroomhub.lang'

// In-module subscriber registry. We notify these directly on setLang so the
// change re-renders in the SAME tab — the native `storage` event only fires in
// OTHER tabs, so relying on it (even a synthetic dispatch) is unreliable.
const listeners = new Set<() => void>()

function emitChange() {
  listeners.forEach((cb) => cb())
}

function subscribe(cb: () => void) {
  listeners.add(cb)
  // Still listen for the native event so other tabs stay in sync.
  if (typeof window !== 'undefined') window.addEventListener('storage', cb)
  return () => {
    listeners.delete(cb)
    if (typeof window !== 'undefined') window.removeEventListener('storage', cb)
  }
}

function getSnapshot(): string {
  if (typeof window === 'undefined') return 'he'
  return localStorage.getItem(STORAGE_KEY) || 'he'
}

function getServerSnapshot(): string {
  return 'he'
}

export function useI18n() {
  // useSyncExternalStore is the React-recommended way to read from localStorage.
  // It hydrates automatically on the client without the cascading-render warning.
  const langRaw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  const lang = (['en', 'ar', 'he'].includes(langRaw) ? langRaw : 'he') as Lang

  const setLang = useCallback((l: Lang) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, l)
      // Notify same-tab subscribers directly (the native `storage` event does
      // not fire in the tab that made the change).
      emitChange()
    }
  }, [])

  // Update <html lang> and dir whenever lang changes
  useEffect(() => {
    if (typeof document === 'undefined') return
    const meta = LANGS.find((l) => l.code === lang)
    if (meta) {
      document.documentElement.lang = lang
      document.documentElement.dir = meta.dir
    }
  }, [lang])

  const t = useCallback(
    (key: string, fallback?: string, vars?: Record<string, string | number>) => translate(lang, key, fallback, vars),
    [lang]
  )

  const isRTL = lang === 'ar' || lang === 'he'

  return { lang, setLang, t, isRTL, dir: isRTL ? 'rtl' : 'ltr' }
}

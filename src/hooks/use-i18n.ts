'use client'

import { useSyncExternalStore, useCallback, useEffect } from 'react'
import { Lang, LANGS, translate } from '@/lib/i18n'

const STORAGE_KEY = 'showroomhub.lang'

// Empty subscription — we don't need cross-tab sync for this demo
function subscribe(cb: () => void) {
  if (typeof window === 'undefined') return () => {}
  window.addEventListener('storage', cb)
  return () => window.removeEventListener('storage', cb)
}

function getSnapshot(): string {
  if (typeof window === 'undefined') return 'en'
  return localStorage.getItem(STORAGE_KEY) || 'en'
}

function getServerSnapshot(): string {
  return 'en'
}

export function useI18n() {
  // useSyncExternalStore is the React-recommended way to read from localStorage.
  // It hydrates automatically on the client without the cascading-render warning.
  const langRaw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  const lang = (['en', 'ar', 'he'].includes(langRaw) ? langRaw : 'en') as Lang

  const setLang = useCallback((l: Lang) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, l)
      // Manually trigger the storage event so same-tab listeners update
      window.dispatchEvent(new StorageEvent('storage', { key: STORAGE_KEY, newValue: l }))
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

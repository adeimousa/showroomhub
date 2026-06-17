import { Lang } from '@/lib/i18n'

/**
 * Get a localized field from an object that has parallel fields like
 *   name / nameAr / nameHe
 *   description / descriptionAr / descriptionHe
 *
 * Falls back to English if the localized version is missing or empty.
 */
export function loc(obj: any, field: string, lang: Lang): string {
  if (!obj) return ''
  const ar = obj[`${field}Ar`]
  const he = obj[`${field}He`]
  const en = obj[field]
  if (lang === 'ar' && typeof ar === 'string' && ar.trim()) return ar
  if (lang === 'he' && typeof he === 'string' && he.trim()) return he
  return en || ''
}

/**
 * Same as loc() but returns all 3 values — useful for forms / debugging.
 */
export function locAll(obj: any, field: string): { en: string; ar: string; he: string } {
  if (!obj) return { en: '', ar: '', he: '' }
  return {
    en: obj[field] || '',
    ar: obj[`${field}Ar`] || '',
    he: obj[`${field}He`] || '',
  }
}

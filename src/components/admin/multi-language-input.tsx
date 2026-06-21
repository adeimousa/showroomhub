'use client'

/**
 * MultiLanguageInput
 *
 * Renders 3 stacked input/textarea fields for English, Arabic, and Hebrew.
 * The EN field is required; AR and HE are optional with a "falls back to English"
 * hint shown when empty.
 *
 * Used in Product / Category / Hero Slide / Tenant admin forms so the admin
 * can enter content in all 3 languages at once.
 */

import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

type Lang = 'en' | 'ar' | 'he'

const LANG_META: Record<Lang, { label: string; native: string; flag: string; dir: 'ltr' | 'rtl' }> = {
  en: { label: 'English',  native: 'English',  flag: '🇬🇧', dir: 'ltr' },
  ar: { label: 'Arabic',   native: 'العربية',   flag: '🇸🇦', dir: 'rtl' },
  he: { label: 'Hebrew',   native: 'עברית',    flag: '🇮🇱', dir: 'rtl' },
}

type Props = {
  label: string
  /** Base field name (without Ar/He suffix). E.g. "name" → reads name, nameAr, nameHe */
  field: string
  /** Initial values for EN / AR / HE */
  values: { en: string; ar: string; he: string }
  /** Called whenever any of the 3 fields change */
  onChange: (values: { en: string; ar: string; he: string }) => void
  /** Use textarea instead of input */
  multiline?: boolean
  rows?: number
  /** Mark EN as required */
  required?: boolean
  /** Placeholder for the EN field */
  placeholder?: string
  /** Hint shown below the label */
  hint?: string
}

export function MultiLanguageInput({
  label, field, values, onChange, multiline, rows = 2, required, placeholder, hint,
}: Props) {
  const handleEN = (v: string) => onChange({ ...values, en: v })
  const handleAR = (v: string) => onChange({ ...values, ar: v })
  const handleHE = (v: string) => onChange({ ...values, he: v })

  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium">
        {label} {required && <span className="text-rose-500">*</span>}
      </Label>
      {hint && <p className="text-[10px] text-muted-foreground -mt-1">{hint}</p>}

      {/* English (required) */}
      <LangRow
        lang="en"
        value={values.en}
        onChange={handleEN}
        multiline={multiline}
        rows={rows}
        placeholder={placeholder}
        required={required}
      />

      {/* Arabic */}
      <LangRow
        lang="ar"
        value={values.ar}
        onChange={handleAR}
        multiline={multiline}
        rows={rows}
        placeholder={values.en || placeholder}
        fallback={values.en}
      />

      {/* Hebrew */}
      <LangRow
        lang="he"
        value={values.he}
        onChange={handleHE}
        multiline={multiline}
        rows={rows}
        placeholder={values.en || placeholder}
        fallback={values.en}
      />
    </div>
  )
}

function LangRow({
  lang, value, onChange, multiline, rows, placeholder, required, fallback,
}: {
  lang: Lang
  value: string
  onChange: (v: string) => void
  multiline?: boolean
  rows?: number
  placeholder?: string
  required?: boolean
  fallback?: string
}) {
  const meta = LANG_META[lang]
  const isFallback = !value?.trim() && !!fallback

  return (
    <div className="grid grid-cols-[auto_1fr] gap-2 items-start">
      <div className="flex items-center gap-1.5 pt-2 px-2 rounded-md bg-slate-50 border border-slate-200 h-9">
        <span className="text-base leading-none">{meta.flag}</span>
        <span className="text-[10px] font-medium text-muted-foreground">{lang.toUpperCase()}</span>
      </div>
      <div className="space-y-1">
        {multiline ? (
          <Textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            rows={rows}
            placeholder={placeholder}
            required={required}
            dir={meta.dir}
            className={cn(meta.dir === 'rtl' && 'text-right')}
          />
        ) : (
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            required={required}
            dir={meta.dir}
            className={cn(meta.dir === 'rtl' && 'text-right')}
          />
        )}
        {isFallback && (
          <p className="text-[10px] text-amber-600 flex items-center gap-1">
            <span className="h-1 w-1 rounded-full bg-amber-500" />
            Empty — will fall back to English in the storefront
          </p>
        )}
      </div>
    </div>
  )
}

'use client'

import { useI18n } from '@/hooks/use-i18n'
import { loc as locHelper } from '@/lib/loc'

/**
 * Shown when a tenant's store is paused or suspended.
 * The tenant name is shown (localized), but NO mention of ShowroomHub.
 */
export function StoreStatus({ tenant }: { tenant: any }) {
  const { t, lang, isRTL } = useI18n()
  const loc = (obj: any, field: string = 'name') => locHelper(obj, field, lang)

  if (tenant.status === 'PAUSED') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">⏸️</div>
          <h1 className="text-xl font-bold mb-2">{t('store.paused')}</h1>
          <p className="text-sm text-muted-foreground mb-4">{t('store.pausedMsg')}</p>
          <p className="text-xs text-muted-foreground">{loc(tenant)}</p>
        </div>
      </div>
    )
  }

  if (tenant.status === 'SUSPENDED') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">🚫</div>
          <h1 className="text-xl font-bold mb-2">{t('store.suspended')}</h1>
          <p className="text-sm text-muted-foreground mb-4">{t('store.suspendedMsg')}</p>
        </div>
      </div>
    )
  }

  return null
}

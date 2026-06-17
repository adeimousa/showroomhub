'use client'

import { useQuery } from '@tanstack/react-query'
import { useI18n } from '@/hooks/use-i18n'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Building2, CheckCircle2, PauseCircle, DollarSign, AlertTriangle, ArrowRight, Palette } from 'lucide-react'
import { cn } from '@/lib/utils'

type TenantRow = {
  id: string
  name: string
  slug: string
  status: string
  plan: string
  layout: { id: string; name: string; category: string } | null
  _count: { products: number; payments: number; users: number }
  createdAt: string
}

type PaymentRow = {
  id: string
  amount: number
  currency: string
  period: string
  status: string
  tenant: { id: string; name: string; slug: string }
}

export function OverviewTab({ onNavigate }: { onNavigate: (k: string) => void }) {
  const { t, lang } = useI18n()

  const tenantsQ = useQuery<{ tenants: TenantRow[] }>({
    queryKey: ['tenants'],
    queryFn: async () => {
      const r = await fetch('/api/tenants')
      if (!r.ok) throw new Error('failed')
      return r.json()
    },
  })

  const paymentsQ = useQuery<{ payments: PaymentRow[] }>({
    queryKey: ['payments'],
    queryFn: async () => {
      const r = await fetch('/api/payments')
      if (!r.ok) throw new Error('failed')
      return r.json()
    },
  })

  const layoutsQ = useQuery<{ layouts: any[] }>({
    queryKey: ['layouts'],
    queryFn: async () => {
      const r = await fetch('/api/layouts')
      if (!r.ok) throw new Error('failed')
      return r.json()
    },
  })

  const tenants = tenantsQ.data?.tenants ?? []
  const payments = paymentsQ.data?.payments ?? []
  const layouts = layoutsQ.data?.layouts ?? []

  const activeCount = tenants.filter((t) => t.status === 'ACTIVE').length
  const pausedCount = tenants.filter((t) => t.status === 'PAUSED').length

  const year = new Date().getFullYear()
  const collected = payments
    .filter((p) => p.status === 'PAID')
    .reduce((sum, p) => sum + p.amount, 0)
  const outstanding = payments
    .filter((p) => p.status !== 'PAID')
    .reduce((sum, p) => sum + p.amount, 0)

  // Layout usage counts
  const usageMap = new Map<string, number>()
  for (const t of tenants) {
    if (t.layout) usageMap.set(t.layout.name, (usageMap.get(t.layout.name) || 0) + 1)
  }
  const usage = Array.from(usageMap.entries()).sort((a, b) => b[1] - a[1])

  const fmtDate = (s: string) => new Date(s).toLocaleDateString(lang === 'ar' ? 'ar-EG' : lang === 'he' ? 'he-IL' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' })

  const stats = [
    { label: t('overview.totalTenants'),   value: tenants.length,  icon: Building2,     color: 'bg-rose-100 text-rose-700' },
    { label: t('overview.activeTenants'),  value: activeCount,     icon: CheckCircle2,  color: 'bg-emerald-100 text-emerald-700' },
    { label: t('overview.pausedTenants'),  value: pausedCount,     icon: PauseCircle,   color: 'bg-amber-100 text-amber-700' },
    { label: t('overview.totalRevenue'),   value: `$${collected.toLocaleString()}`, icon: DollarSign,    color: 'bg-violet-100 text-violet-700' },
    { label: t('overview.outstanding'),    value: `$${outstanding.toLocaleString()}`, icon: AlertTriangle, color: 'bg-orange-100 text-orange-700' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('overview.title')}</h1>
          <p className="text-sm text-muted-foreground">{t('brand.tagline')}</p>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {tenantsQ.isLoading || paymentsQ.isLoading
          ? Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)
          : stats.map((s) => {
              const Icon = s.icon
              return (
                <Card key={s.label} className="border-slate-200">
                  <CardContent className="p-4">
                    <div className={cn('h-9 w-9 rounded-lg flex items-center justify-center mb-3', s.color)}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="text-2xl font-bold">{s.value}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
                  </CardContent>
                </Card>
              )
            })}
      </div>

      {/* Quick actions */}
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-base">{t('overview.quickActions')}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button onClick={() => onNavigate('tenants')} className="gap-1.5 bg-rose-600 hover:bg-rose-700">
            <Building2 className="h-4 w-4" />
            {t('overview.addTenant')}
          </Button>
          <Button onClick={() => onNavigate('layouts')} variant="outline" className="gap-1.5">
            <Palette className="h-4 w-4" />
            {t('overview.browseLayouts')}
          </Button>
          <Button onClick={() => onNavigate('payments')} variant="outline" className="gap-1.5">
            <DollarSign className="h-4 w-4" />
            {t('overview.viewPayments')}
          </Button>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent tenants */}
        <Card className="border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{t('overview.recentTenants')}</CardTitle>
            <CardDescription>{tenants.length} {t('nav.tenants').toLowerCase()}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 max-h-80 overflow-y-auto">
            {tenantsQ.isLoading ? (
              Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-lg" />)
            ) : tenants.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center py-8">{t('common.noResults')}</div>
            ) : (
              tenants.slice(0, 6).map((tn) => (
                <div key={tn.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors">
                  <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-base shrink-0">
                    🏢
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{tn.name}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {tn.layout?.name || 'No layout'} · {tn._count.products} products
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn(
                      'text-[10px]',
                      tn.status === 'ACTIVE' && 'border-emerald-200 bg-emerald-50 text-emerald-700',
                      tn.status === 'PAUSED' && 'border-amber-200 bg-amber-50 text-amber-700',
                      tn.status === 'SUSPENDED' && 'border-rose-200 bg-rose-50 text-rose-700'
                    )}
                  >
                    {tn.status}
                  </Badge>
                </div>
              ))
            )}
            <Button variant="ghost" size="sm" className="w-full mt-2" onClick={() => onNavigate('tenants')}>
              {t('nav.tenants')} <ArrowRight className="h-3 w-3" />
            </Button>
          </CardContent>
        </Card>

        {/* Layout usage */}
        <Card className="border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{t('overview.layoutUsage')}</CardTitle>
            <CardDescription>{layouts.length} {t('nav.layouts').toLowerCase()}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 max-h-80 overflow-y-auto">
            {layoutsQ.isLoading ? (
              Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-8 rounded-lg" />)
            ) : usage.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center py-8">No layouts assigned yet</div>
            ) : (
              usage.slice(0, 8).map(([name, count]) => {
                const total = tenants.length || 1
                const pct = Math.round((count / total) * 100)
                return (
                  <div key={name} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium truncate">{name}</span>
                      <span className="text-muted-foreground">{count}</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-amber-400 to-rose-500" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })
            )}
            <Button variant="ghost" size="sm" className="w-full mt-2" onClick={() => onNavigate('layouts')}>
              {t('nav.layouts')} <ArrowRight className="h-3 w-3" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useI18n } from '@/hooks/use-i18n'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Save, RotateCcw, Loader2, Palette, ExternalLink, Info } from 'lucide-react'

type Layout = {
  id: string
  name: string
  category: string
  premium: boolean
  primaryColor: string
  accentColor: string
  bgColor: string
  textColor: string
  fontHeading: string
  fontBody: string
  borderRadius: number
  headerStyle: string
  heroStyle: string
  productGrid: string
  footerStyle: string
}

type Tenant = {
  id: string
  name: string
  slug: string
  themePrimary: string
  themeAccent: string
  themeBg: string
  themeFont: string
  rtl: boolean
  layoutId: string | null
  layout: Layout | null
}

const FONT_OPTIONS = [
  'Inter', 'DM Sans', 'Space Grotesk', 'Lora', 'Playfair Display',
  'Merriweather', 'Archivo', 'Fraunces', 'Plus Jakarta Sans',
  'JetBrains Mono', 'Cormorant Garamond', 'Lato',
]

export function ThemeTab() {
  const { t } = useI18n()
  const qc = useQueryClient()

  const tenantQ = useQuery<{ tenants: Tenant[] }>({
    queryKey: ['my-tenant'],
    queryFn: async () => {
      const r = await fetch('/api/tenants')
      if (!r.ok) throw new Error('failed')
      return r.json()
    },
  })

  const tenant = tenantQ.data?.tenants?.[0]
  const layout = tenant?.layout

  // Initialize theme state from tenant once loaded. Using `key` on the wrapper
  // would also work, but the tenant data arrives async, so we lazily initialize.
  const [primary, setPrimary]   = useState(tenant?.themePrimary  || '#0f766e')
  const [accent, setAccent]     = useState(tenant?.themeAccent   || '#f59e0b')
  const [bg, setBg]             = useState(tenant?.themeBg       || '#ffffff')
  const [font, setFont]         = useState(tenant?.themeFont     || 'Inter')
  const [rtl, setRtl]           = useState(tenant?.rtl           || false)
  const [initialized, setInitialized] = useState(false)

  // One-time sync when tenant data first arrives
  if (tenant && !initialized) {
    setPrimary(tenant.themePrimary)
    setAccent(tenant.themeAccent)
    setBg(tenant.themeBg)
    setFont(tenant.themeFont)
    setRtl(tenant.rtl)
    setInitialized(true)
  }

  const saveMut = useMutation({
    mutationFn: async (data: any) => {
      const r = await fetch(`/api/tenants/${tenant!.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
      const j = await r.json()
      if (!r.ok) throw new Error(j.error || 'failed')
      return j
    },
    onSuccess: () => {
      toast.success(t('theme.saved'))
      qc.invalidateQueries({ queryKey: ['my-tenant'] })
    },
    onError: (e: any) => toast.error(e.message || t('toast.error')),
  })

  const resetToLayout = () => {
    if (!layout) {
      toast.error('No layout assigned — ask the platform admin to assign one.')
      return
    }
    setPrimary(layout.primaryColor)
    setAccent(layout.accentColor)
    setBg(layout.bgColor)
    setFont(layout.fontBody)
    toast.success(t('theme.resetDone'))
  }

  const handleSave = () => {
    saveMut.mutate({
      themePrimary: primary,
      themeAccent: accent,
      themeBg: bg,
      themeFont: font,
      rtl,
    })
  }

  if (tenantQ.isLoading) return <Skeleton className="h-96 rounded-xl" />
  if (!tenant) return <div className="text-center py-12 text-muted-foreground">No tenant on this account.</div>

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t('theme.title')}</h1>
        <p className="text-sm text-muted-foreground">{t('theme.subtitle')}</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Form */}
        <Card className="lg:col-span-2 border-slate-200">
          <CardHeader>
            <CardTitle className="text-base">{t('theme.title')}</CardTitle>
            <CardDescription>{t('theme.subtitle')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Color pickers */}
            <div className="grid sm:grid-cols-3 gap-3">
              <ColorField label={t('theme.primary')}   value={primary} onChange={setPrimary} />
              <ColorField label={t('theme.accent')}    value={accent}  onChange={setAccent} />
              <ColorField label={t('theme.background')} value={bg}     onChange={setBg} />
            </div>

            {/* Font */}
            <div className="space-y-1.5">
              <Label>{t('theme.font')}</Label>
              <Select value={font} onValueChange={setFont}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {FONT_OPTIONS.map((f) => (
                    <SelectItem key={f} value={f}>{f}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* RTL */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
              <div>
                <Label htmlFor="rtl" className="text-sm font-medium">{t('theme.rtl')}</Label>
                <p className="text-xs text-muted-foreground">For Arabic / Hebrew storefronts</p>
              </div>
              <Switch id="rtl" checked={rtl} onCheckedChange={setRtl} />
            </div>

            {/* Action buttons */}
            <div className="flex gap-2 pt-2">
              <Button onClick={handleSave} disabled={saveMut.isPending} className="gap-1.5 bg-emerald-600 hover:bg-emerald-700">
                {saveMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {t('theme.save')}
              </Button>
              <Button onClick={resetToLayout} variant="outline" className="gap-1.5">
                <RotateCcw className="h-4 w-4" />
                {t('theme.reset')}
              </Button>
              <Button
                variant="outline"
                className="gap-1.5 ml-auto"
                onClick={() => window.open(`/?view=site&slug=${encodeURIComponent(tenant.slug)}`, '_blank')}
              >
                <ExternalLink className="h-4 w-4" />
                {t('common.preview')}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Right — assigned layout + live preview */}
        <div className="space-y-4">
          {/* Assigned layout */}
          <Card className="border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-1.5">
                <Info className="h-4 w-4" />
                {t('theme.assignedLayout')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {layout ? (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium">{layout.name}</span>
                    {layout.premium && (
                      <Badge variant="outline" className="text-[10px] text-amber-700 border-amber-300 bg-amber-50">
                        Premium
                      </Badge>
                    )}
                  </div>
                  <Badge variant="secondary" className="text-[10px]">{layout.category}</Badge>
                  <div className="mt-3 grid grid-cols-2 gap-1 text-[10px]">
                    {[
                      ['Header', layout.headerStyle],
                      ['Hero', layout.heroStyle],
                      ['Grid', layout.productGrid],
                      ['Footer', layout.footerStyle],
                      ['Border R', `${layout.borderRadius}px`],
                      ['Heading', layout.fontHeading],
                    ].map(([k, v]) => (
                      <div key={k} className="flex justify-between p-1.5 rounded bg-slate-50">
                        <span className="text-muted-foreground">{k}</span>
                        <span className="font-medium truncate ml-1">{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">
                  No layout assigned. Contact the platform admin to assign one.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Live preview */}
          <Card className="border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-1.5">
                <Palette className="h-4 w-4" />
                {t('common.preview')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className="rounded-lg overflow-hidden border"
                style={{ background: bg, color: primary, fontFamily: `var(--font-${font.toLowerCase().replace(/\s/g, '-')})` }}
                dir={rtl ? 'rtl' : 'ltr'}
              >
                <div className="px-3 py-2 flex items-center justify-between text-xs" style={{ background: primary, color: '#fff' }}>
                  <span className="font-bold">{tenant.name}</span>
                  <span className="opacity-80 text-[10px]">Shop · About</span>
                </div>
                <div className="p-4 text-center">
                  <div className="text-sm font-bold mb-0.5">Beautiful Living</div>
                  <div className="text-[10px] opacity-60 mb-2">Crafted for you</div>
                  <div className="inline-block px-2 py-1 text-[10px] font-medium text-white" style={{ background: accent, borderRadius: 6 }}>
                    Shop Now
                  </div>
                </div>
                <div className="p-2 grid grid-cols-3 gap-1">
                  {['🛋️', '🪑', '🛏️'].map((e, i) => (
                    <div key={i} className="p-2 text-center" style={{ background: primary + '08', borderRadius: 6 }}>
                      <div className="text-lg">{e}</div>
                      <div className="text-[9px] font-medium">${(i + 1) * 199}</div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <div className="flex gap-2 items-center">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-12 rounded-md border border-slate-200 cursor-pointer bg-white p-1"
        />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="font-mono text-xs"
        />
      </div>
    </div>
  )
}

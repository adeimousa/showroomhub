'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useI18n } from '@/hooks/use-i18n'
import { toast } from 'sonner'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Search, Sparkles, Crown, Check, ExternalLink, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

type Layout = {
  id: string
  name: string
  category: string
  description: string
  premium: boolean
  headerStyle: string
  heroStyle: string
  productGrid: string
  footerStyle: string
  primaryColor: string
  accentColor: string
  bgColor: string
  textColor: string
  fontHeading: string
  fontBody: string
  borderRadius: number
  animation: string
  _count?: { tenants: number }
}

type Tenant = {
  id: string
  name: string
  slug: string
  layoutId: string | null
}

const CATEGORIES = ['MODERN', 'LUXURY', 'MINIMAL', 'CREATIVE', 'CLASSIC'] as const

export function LayoutsTab() {
  const { t } = useI18n()
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<string>('ALL')
  const [assignLayout, setAssignLayout] = useState<Layout | null>(null)
  const [previewLayout, setPreviewLayout] = useState<Layout | null>(null)
  const [selectedTenant, setSelectedTenant] = useState<string>('')

  const layoutsQ = useQuery<{ layouts: Layout[] }>({
    queryKey: ['layouts'],
    queryFn: async () => {
      const r = await fetch('/api/layouts')
      if (!r.ok) throw new Error('failed')
      return r.json()
    },
  })
  const tenantsQ = useQuery<{ tenants: Tenant[] }>({
    queryKey: ['tenants'],
    queryFn: async () => {
      const r = await fetch('/api/tenants')
      if (!r.ok) throw new Error('failed')
      return r.json()
    },
  })

  const layouts = layoutsQ.data?.layouts ?? []
  const tenants = tenantsQ.data?.tenants ?? []

  const filtered = layouts.filter((l) => {
    const matchesSearch = !search || l.name.toLowerCase().includes(search.toLowerCase()) || l.description.toLowerCase().includes(search.toLowerCase())
    const matchesCat = category === 'ALL' || l.category === category
    return matchesSearch && matchesCat
  })

  const assignMutation = useMutation({
    mutationFn: async ({ tenantId, layoutId }: { tenantId: string; layoutId: string }) => {
      const r = await fetch(`/api/tenants/${tenantId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ layoutId }) })
      const j = await r.json()
      if (!r.ok) throw new Error(j.error || 'failed')
      return j
    },
    onSuccess: () => {
      toast.success(t('tenants.layoutAssigned'))
      qc.invalidateQueries({ queryKey: ['tenants'] })
      setAssignLayout(null)
      setSelectedTenant('')
    },
    onError: (e: any) => toast.error(e.message || t('toast.error')),
  })

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t('layouts.title')}</h1>
        <p className="text-sm text-muted-foreground">{t('layouts.subtitle')}</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('layouts.search')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-1">
          <Button
            variant={category === 'ALL' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setCategory('ALL')}
            className={category === 'ALL' ? 'bg-rose-600 hover:bg-rose-700' : ''}
          >
            {t('layouts.allCategories')}
          </Button>
          {CATEGORIES.map((c) => (
            <Button
              key={c}
              variant={category === c ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCategory(c)}
              className={category === c ? 'bg-rose-600 hover:bg-rose-700' : ''}
            >
              {t(`layouts.category.${c}`)}
            </Button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {layoutsQ.isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Sparkles className="h-10 w-10 mx-auto mb-3 opacity-40" />
          {t('common.noResults')}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((l) => (
            <LayoutCard
              key={l.id}
              layout={l}
              onAssign={() => setAssignLayout(l)}
              onPreview={() => setPreviewLayout(l)}
            />
          ))}
        </div>
      )}

      {/* Assign-to-tenant dialog */}
      <Dialog open={!!assignLayout} onOpenChange={(o) => { if (!o) { setAssignLayout(null); setSelectedTenant('') } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('layouts.assignTo')}</DialogTitle>
            <DialogDescription>
              {assignLayout?.name} · {assignLayout ? t(`layouts.category.${assignLayout.category}`) : ''}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Pick a tenant to assign this layout to. The tenant's storefront will immediately use this layout's colors, typography, and structure.
            </p>
            <Select value={selectedTenant} onValueChange={setSelectedTenant}>
              <SelectTrigger><SelectValue placeholder="Select tenant" /></SelectTrigger>
              <SelectContent>
                {tenants.map((tn) => (
                  <SelectItem key={tn.id} value={tn.id}>
                    {tn.name} {tn.layoutId === assignLayout?.id ? '✓' : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedTenant && (() => {
              const tn = tenants.find((x) => x.id === selectedTenant)
              if (!tn) return null
              const alreadyAssigned = tn.layoutId === assignLayout?.id
              return (
                <div className={cn('p-2 rounded text-xs', alreadyAssigned ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700')}>
                  {alreadyAssigned
                    ? 'This tenant is already using this layout.'
                    : 'This will replace the tenant\'s current layout.'}
                </div>
              )
            })()}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setAssignLayout(null); setSelectedTenant('') }}>
              {t('common.cancel')}
            </Button>
            <Button
              disabled={!selectedTenant || assignMutation.isPending}
              onClick={() => assignLayout && selectedTenant && assignMutation.mutate({ tenantId: selectedTenant, layoutId: assignLayout.id })}
              className="bg-rose-600 hover:bg-rose-700"
            >
              {assignMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              {t('layouts.assigned')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview dialog */}
      <Dialog open={!!previewLayout} onOpenChange={(o) => !o && setPreviewLayout(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {previewLayout?.name}
              {previewLayout?.premium && (
                <Badge variant="outline" className="text-amber-700 border-amber-300 bg-amber-50">
                  <Crown className="h-3 w-3 mr-1" />
                  {t('layouts.premium')}
                </Badge>
              )}
            </DialogTitle>
            <DialogDescription>{previewLayout?.description}</DialogDescription>
          </DialogHeader>
          {previewLayout && (
            <div className="space-y-4">
              {/* Mini live preview */}
              <div
                className="rounded-lg overflow-hidden border"
                style={{
                  background: previewLayout.bgColor,
                  color: previewLayout.textColor,
                  fontFamily: `var(--font-${previewLayout.fontBody.toLowerCase().replace(/\s/g, '-')})`,
                }}
                dir="ltr"
              >
                {/* Header */}
                <div
                  className="px-4 py-3 flex items-center justify-between text-sm"
                  style={{
                    background: previewLayout.headerStyle === 'minimal-bar' ? previewLayout.primaryColor : 'transparent',
                    color: previewLayout.headerStyle === 'minimal-bar' ? '#fff' : previewLayout.textColor,
                  }}
                >
                  <div className="font-bold" style={{ fontFamily: `var(--font-${previewLayout.fontHeading.toLowerCase().replace(/\s/g, '-')})` }}>
                    {previewLayout.name}
                  </div>
                  <div className="flex gap-3 text-xs opacity-80">
                    <span>Home</span><span>Shop</span><span>About</span>
                  </div>
                </div>
                {/* Hero */}
                <div
                  className="p-6 text-center"
                  style={{
                    background: `linear-gradient(135deg, ${previewLayout.primaryColor}15, ${previewLayout.accentColor}25)`,
                  }}
                >
                  <div
                    className="text-2xl font-bold mb-1"
                    style={{
                      fontFamily: `var(--font-${previewLayout.fontHeading.toLowerCase().replace(/\s/g, '-')})`,
                      color: previewLayout.primaryColor,
                    }}
                  >
                    Beautiful Furniture
                  </div>
                  <div className="text-xs opacity-70">Crafted for modern living</div>
                  <div
                    className="inline-block mt-3 px-3 py-1 text-xs font-medium"
                    style={{
                      background: previewLayout.accentColor,
                      color: '#fff',
                      borderRadius: previewLayout.borderRadius,
                    }}
                  >
                    Shop Now
                  </div>
                </div>
                {/* Product grid */}
                <div className="p-4 grid grid-cols-3 gap-2">
                  {['🛋️', '🪑', '🛏️'].map((emoji, i) => (
                    <div
                      key={i}
                      className="p-3 text-center"
                      style={{
                        background: previewLayout.textColor + '08',
                        borderRadius: previewLayout.borderRadius,
                      }}
                    >
                      <div className="text-2xl mb-1">{emoji}</div>
                      <div className="text-xs font-medium">Product {i + 1}</div>
                      <div className="text-[10px] opacity-60">${(i + 1) * 199}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Specs */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  ['Category', previewLayout.category],
                  ['Header', previewLayout.headerStyle],
                  ['Hero', previewLayout.heroStyle],
                  ['Product Grid', previewLayout.productGrid],
                  ['Footer', previewLayout.footerStyle],
                  ['Heading Font', previewLayout.fontHeading],
                  ['Body Font', previewLayout.fontBody],
                  ['Border Radius', `${previewLayout.borderRadius}px`],
                  ['Animation', previewLayout.animation],
                  ['In use', `${previewLayout._count?.tenants ?? 0} tenants`],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between p-2 rounded bg-slate-50">
                    <span className="text-muted-foreground">{k}</span>
                    <span className="font-medium">{v}</span>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <div className="flex-1">
                  <div className="text-xs text-muted-foreground mb-1">Primary</div>
                  <div className="h-8 rounded" style={{ background: previewLayout.primaryColor }} />
                </div>
                <div className="flex-1">
                  <div className="text-xs text-muted-foreground mb-1">Accent</div>
                  <div className="h-8 rounded" style={{ background: previewLayout.accentColor }} />
                </div>
                <div className="flex-1">
                  <div className="text-xs text-muted-foreground mb-1">Background</div>
                  <div className="h-8 rounded border" style={{ background: previewLayout.bgColor }} />
                </div>
                <div className="flex-1">
                  <div className="text-xs text-muted-foreground mb-1">Text</div>
                  <div className="h-8 rounded" style={{ background: previewLayout.textColor }} />
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    if (previewLayout) {
                      // Open the demo furniture store with this layout's colors by simulating assignment
                      window.open(`/?view=site&slug=demo-furniture`, '_blank')
                    }
                  }}
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  See live demo
                </Button>
                <Button
                  className="bg-rose-600 hover:bg-rose-700"
                  onClick={() => {
                    if (previewLayout) {
                      setAssignLayout(previewLayout)
                      setPreviewLayout(null)
                    }
                  }}
                >
                  {t('layouts.assignTo')}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ----- Layout Card -----

function LayoutCard({
  layout,
  onAssign,
  onPreview,
}: {
  layout: Layout
  onAssign: () => void
  onPreview: () => void
}) {
  const { t } = useI18n()
  const [hovered, setHovered] = useState(false)

  return (
    <Card
      className="overflow-hidden border-slate-200 transition-all hover:shadow-lg cursor-pointer group"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onPreview}
    >
      {/* Thumbnail preview */}
      <div
        className="relative h-40 overflow-hidden"
        style={{ background: layout.bgColor, color: layout.textColor }}
      >
        {/* Header bar */}
        <div
          className="px-3 py-2 flex items-center justify-between text-[10px]"
          style={{
            background: layout.headerStyle === 'minimal-bar' ? layout.primaryColor : 'transparent',
            color: layout.headerStyle === 'minimal-bar' ? '#fff' : layout.textColor,
          }}
        >
          <div
            className="font-bold"
            style={{ fontFamily: `var(--font-${layout.fontHeading.toLowerCase().replace(/\s/g, '-')})` }}
          >
            {layout.name.split(' ')[0]}
          </div>
          {layout.headerStyle === 'split-nav' && (
            <div className="flex gap-1.5 opacity-70">
              <span>Home</span><span>Shop</span>
            </div>
          )}
          {layout.headerStyle === 'centered-logo' && (
            <div className="opacity-50 text-[8px]">menu</div>
          )}
        </div>

        {/* Hero */}
        <div
          className="px-3 py-3"
          style={{
            background: `linear-gradient(135deg, ${layout.primaryColor}10, ${layout.accentColor}20)`,
            height: 'calc(100% - 28px)',
          }}
        >
          {layout.heroStyle === 'split-image' && (
            <div className="flex gap-2 h-full">
              <div className="flex-1 flex flex-col justify-center">
                <div
                  className="text-xs font-bold leading-tight mb-1"
                  style={{ fontFamily: `var(--font-${layout.fontHeading.toLowerCase().replace(/\s/g, '-')})`, color: layout.primaryColor }}
                >
                  Modern Furniture
                </div>
                <div className="text-[8px] opacity-60 mb-1">Crafted for living</div>
                <div
                  className="inline-block self-start px-1.5 py-0.5 text-[7px] font-medium text-white"
                  style={{ background: layout.accentColor, borderRadius: layout.borderRadius / 2 }}
                >
                  Shop →
                </div>
              </div>
              <div
                className="w-1/3 flex items-center justify-center text-2xl"
                style={{ background: layout.accentColor + '30', borderRadius: layout.borderRadius }}
              >
                🛋️
              </div>
            </div>
          )}
          {layout.heroStyle === 'full-bleed' && (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <div
                className="text-sm font-bold leading-tight"
                style={{ fontFamily: `var(--font-${layout.fontHeading.toLowerCase().replace(/\s/g, '-')})`, color: layout.primaryColor }}
              >
                Beautiful Living Spaces
              </div>
              <div className="text-[8px] opacity-60 mt-0.5">Crafted for living</div>
            </div>
          )}
          {layout.heroStyle === 'carousel' && (
            <div className="h-full flex flex-col justify-center">
              <div className="flex gap-1 mb-1.5">
                {['🛋️', '🪑', '🛏️'].map((e, i) => (
                  <div
                    key={i}
                    className="flex-1 h-8 flex items-center justify-center text-sm"
                    style={{ background: layout.accentColor + '30', borderRadius: layout.borderRadius / 2 }}
                  >
                    {e}
                  </div>
                ))}
              </div>
              <div
                className="text-[10px] font-bold"
                style={{ color: layout.primaryColor }}
              >
                Featured Collection →
              </div>
            </div>
          )}
          {layout.heroStyle === 'grid-cells' && (
            <div className="grid grid-cols-2 gap-1 h-full">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="flex items-center justify-center text-[8px] font-medium"
                  style={{
                    background: i % 2 === 0 ? layout.primaryColor + '20' : layout.accentColor + '20',
                    color: layout.primaryColor,
                    borderRadius: layout.borderRadius / 3,
                  }}
                >
                  {i === 1 ? 'NEW' : i === 2 ? 'SALE' : i === 3 ? 'TREND' : 'HOT'}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Hover overlay */}
        <div className={cn(
          'absolute inset-0 bg-black/50 flex items-center justify-center gap-2 transition-opacity',
          hovered ? 'opacity-100' : 'opacity-0'
        )}>
          <Button size="sm" variant="secondary" onClick={(e) => { e.stopPropagation(); onPreview() }}>
            Preview
          </Button>
          <Button size="sm" onClick={(e) => { e.stopPropagation(); onAssign() }} className="bg-rose-600 hover:bg-rose-700">
            {t('layouts.assignTo')}
          </Button>
        </div>
      </div>

      <CardContent className="p-3">
        <div className="flex items-start justify-between gap-2 mb-1">
          <div className="font-medium text-sm truncate">{layout.name}</div>
          {layout.premium && (
            <Badge variant="outline" className="text-[9px] text-amber-700 border-amber-300 bg-amber-50 shrink-0">
              <Crown className="h-2.5 w-2.5 mr-0.5" />
              {t('layouts.premium')}
            </Badge>
          )}
        </div>
        <div className="text-[10px] text-muted-foreground line-clamp-2 mb-2">
          {layout.description}
        </div>
        <div className="flex items-center justify-between">
          <Badge variant="secondary" className="text-[9px]">
            {t(`layouts.category.${layout.category}`)}
          </Badge>
          {(layout._count?.tenants ?? 0) > 0 && (
            <span className="text-[10px] text-muted-foreground">
              {layout._count?.tenants} {t('layouts.used')}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

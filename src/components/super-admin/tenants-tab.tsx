'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useI18n } from '@/hooks/use-i18n'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { MultiLanguageInput } from '@/components/admin/multi-language-input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import { Plus, Search, MoreVertical, Pencil, Trash2, Pause, Play, ExternalLink, Loader2, Building2 } from 'lucide-react'
import { cn } from '@/lib/utils'

type Layout = { id: string; name: string; category: string; premium: boolean }
type Tenant = {
  id: string
  name: string
  nameAr: string | null
  nameHe: string | null
  slug: string
  email: string
  phone: string | null
  whatsappNumber: string | null
  whatsappPrefill: string | null
  ownerName: string | null
  ownerEmail: string | null
  ownerPhone: string | null
  validUntil: string | null
  customDomains: string | null
  description: string | null
  descriptionAr: string | null
  descriptionHe: string | null
  status: string
  plan: string
  layoutId: string | null
  layout: Layout | null
  _count: { products: number; payments: number; users: number }
  createdAt: string
}

const PLANS = ['BASIC', 'PRO', 'PREMIUM']
const STATUSES = ['ACTIVE', 'PAUSED', 'SUSPENDED']

export function TenantsTab() {
  const { t, lang } = useI18n()
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [createOpen, setCreateOpen] = useState(false)
  const [editTenant, setEditTenant] = useState<Tenant | null>(null)
  const [deleteTenant, setDeleteTenant] = useState<Tenant | null>(null)
  const [viewSiteSlug, setViewSiteSlug] = useState<string | null>(null)

  const tenantsQ = useQuery<{ tenants: Tenant[] }>({
    queryKey: ['tenants'],
    queryFn: async () => {
      const r = await fetch('/api/tenants')
      if (!r.ok) throw new Error('failed')
      return r.json()
    },
  })
  const layoutsQ = useQuery<{ layouts: Layout[] }>({
    queryKey: ['layouts'],
    queryFn: async () => {
      const r = await fetch('/api/layouts')
      if (!r.ok) throw new Error('failed')
      return r.json()
    },
  })

  const tenants = tenantsQ.data?.tenants ?? []
  const layouts = layoutsQ.data?.layouts ?? []

  const filtered = tenants.filter((t) => {
    const matchesSearch = !search || t.name.toLowerCase().includes(search.toLowerCase()) || t.slug.includes(search.toLowerCase()) || t.email.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const r = await fetch('/api/tenants', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
      const j = await r.json()
      if (!r.ok) throw new Error(j.error || 'failed')
      return j
    },
    onSuccess: () => {
      toast.success(t('tenants.created'))
      qc.invalidateQueries({ queryKey: ['tenants'] })
      setCreateOpen(false)
    },
    onError: (e: any) => toast.error(e.message || t('toast.error')),
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const r = await fetch(`/api/tenants/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
      const j = await r.json()
      if (!r.ok) throw new Error(j.error || 'failed')
      return j
    },
    onSuccess: (_d, vars) => {
      // Custom success message based on what was changed
      if (vars.data.status === 'PAUSED') toast.success(t('tenants.paused'))
      else if (vars.data.status === 'ACTIVE') toast.success(t('tenants.resumed'))
      else if (vars.data.layoutId !== undefined) toast.success(t('tenants.layoutAssigned'))
      else toast.success(t('tenants.updated'))
      qc.invalidateQueries({ queryKey: ['tenants'] })
      setEditTenant(null)
    },
    onError: (e: any) => toast.error(e.message || t('toast.error')),
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const r = await fetch(`/api/tenants/${id}`, { method: 'DELETE' })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) throw new Error(j.error || 'failed')
      return j
    },
    onSuccess: () => {
      toast.success(t('tenants.deleted'))
      qc.invalidateQueries({ queryKey: ['tenants'] })
      qc.invalidateQueries({ queryKey: ['payments'] })
      setDeleteTenant(null)
    },
    onError: (e: any) => toast.error(e.message || t('toast.error')),
  })

  const fmtDate = (s: string) => new Date(s).toLocaleDateString(lang === 'ar' ? 'ar-EG' : lang === 'he' ? 'he-IL' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' })

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('tenants.title')}</h1>
          <p className="text-sm text-muted-foreground">{tenants.length} {t('nav.tenants').toLowerCase()}</p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="gap-1.5 bg-rose-600 hover:bg-rose-700">
          <Plus className="h-4 w-4" />
          {t('tenants.add')}
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('common.search')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder={t('common.status')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">{t('common.all')}</SelectItem>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card className="border-slate-200">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr className="text-left text-xs text-muted-foreground">
                  <th className="px-4 py-3 font-medium">{t('common.name')}</th>
                  <th className="px-4 py-3 font-medium hidden lg:table-cell">Owner</th>
                  <th className="px-4 py-3 font-medium">{t('common.status')}</th>
                  <th className="px-4 py-3 font-medium">{t('common.plan')}</th>
                  <th className="px-4 py-3 font-medium hidden xl:table-cell">Valid Until</th>
                  <th className="px-4 py-3 font-medium hidden 2xl:table-cell">{t('common.layout')}</th>
                  <th className="px-4 py-3 font-medium hidden md:table-cell">{t('common.created')}</th>
                  <th className="px-4 py-3 font-medium text-right">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {tenantsQ.isLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i} className="border-b border-slate-100">
                      <td colSpan={8} className="px-4 py-3"><Skeleton className="h-8" /></td>
                    </tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">
                      <Building2 className="h-8 w-8 mx-auto mb-2 opacity-40" />
                      {t('tenants.empty')}
                    </td>
                  </tr>
                ) : (
                  filtered.map((tn) => (
                    <tr key={tn.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-base shrink-0">
                            🏢
                          </div>
                          <div className="min-w-0">
                            <div className="font-medium truncate">{tn.name}</div>
                            <div className="text-xs text-muted-foreground truncate">{tn.slug} · {tn.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        {tn.ownerName ? (
                          <div className="flex flex-col">
                            <span className="text-xs font-medium truncate max-w-[150px]">{tn.ownerName}</span>
                            {tn.ownerEmail && (
                              <span className="text-[10px] text-muted-foreground truncate max-w-[150px]">{tn.ownerEmail}</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-[10px]',
                            tn.status === 'ACTIVE' && 'border-emerald-200 bg-emerald-50 text-emerald-700',
                            tn.status === 'PAUSED' && 'border-amber-200 bg-amber-50 text-amber-700',
                            tn.status === 'SUSPENDED' && 'border-rose-200 bg-rose-50 text-rose-700',
                          )}
                        >
                          {tn.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="secondary" className="text-[10px]">{tn.plan}</Badge>
                      </td>
                      <td className="px-4 py-3 hidden xl:table-cell">
                        {tn.validUntil ? (
                          (() => {
                            const validDate = new Date(tn.validUntil)
                            const today = new Date()
                            const daysUntilExpiry = Math.floor((validDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
                            const isExpired = daysUntilExpiry < 0
                            const isExpiringSoon = daysUntilExpiry >= 0 && daysUntilExpiry <= 30

                            return (
                              <div className="flex flex-col">
                                <span className={cn(
                                  "text-xs font-medium",
                                  isExpired && "text-rose-600",
                                  isExpiringSoon && "text-amber-600"
                                )}>
                                  {fmtDate(tn.validUntil)}
                                </span>
                                {isExpired && <span className="text-[10px] text-rose-600">Expired</span>}
                                {isExpiringSoon && !isExpired && <span className="text-[10px] text-amber-600">{daysUntilExpiry} days left</span>}
                              </div>
                            )
                          })()
                        ) : (
                          <span className="text-xs text-muted-foreground">Not set</span>
                        )}
                      </td>
                      <td className="px-4 py-3 hidden xl:table-cell">
                        {tn.layout ? (
                          <div className="flex flex-col">
                            <span className="text-xs font-medium truncate max-w-[160px]">{tn.layout.name}</span>
                            <span className="text-[10px] text-muted-foreground">{tn.layout.category}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">{t('common.none')}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell text-xs text-muted-foreground">
                        {fmtDate(tn.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuLabel>{t('common.actions')}</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => setEditTenant(tn)}>
                              <Pencil className="h-3.5 w-3.5" />
                              {t('common.edit')}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setViewSiteSlug(tn.slug)}>
                              <ExternalLink className="h-3.5 w-3.5" />
                              {t('tenants.viewSite')}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => updateMutation.mutate({ id: tn.id, data: { status: tn.status === 'PAUSED' ? 'ACTIVE' : 'PAUSED' } })}
                            >
                              {tn.status === 'PAUSED' ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
                              {tn.status === 'PAUSED' ? t('tenants.resume') : t('tenants.pause')}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => setDeleteTenant(tn)}
                              className="text-rose-600 focus:text-rose-700"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              {t('common.delete')}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Create dialog */}
      <TenantFormDialog
        key={`create-${createOpen}`}
        open={createOpen}
        onOpenChange={setCreateOpen}
        layouts={layouts}
        submitting={createMutation.isPending}
        onSubmit={(data) => createMutation.mutate(data)}
        title={t('tenants.add')}
      />

      {/* Edit dialog */}
      <TenantFormDialog
        key={`edit-${editTenant?.id ?? 'none'}`}
        open={!!editTenant}
        onOpenChange={(o) => !o && setEditTenant(null)}
        layouts={layouts}
        initial={editTenant || undefined}
        submitting={updateMutation.isPending}
        onSubmit={(data) => editTenant && updateMutation.mutate({ id: editTenant.id, data })}
        title={t('tenants.edit')}
      />

      {/* Delete confirm */}
      <AlertDialog open={!!deleteTenant} onOpenChange={(o) => !o && setDeleteTenant(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('tenants.delete')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('tenants.deleteConfirm')}
              {deleteTenant && (
                <div className="mt-2 p-2 rounded bg-slate-100 text-sm font-medium">
                  {deleteTenant.name} ({deleteTenant.slug})
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTenant && deleteMutation.mutate(deleteTenant.id)}
              disabled={deleteMutation.isPending}
              className="bg-rose-600 hover:bg-rose-700"
            >
              {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* View site redirect dialog */}
      <Dialog open={!!viewSiteSlug} onOpenChange={(o) => !o && setViewSiteSlug(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('common.viewSite')}</DialogTitle>
            <DialogDescription>
              {t('common.preview')} · {viewSiteSlug}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Open the public storefront for this tenant in a new tab. The storefront will render with the tenant's currently assigned layout.
            </p>
            <Button
              className="w-full gap-1.5"
              onClick={() => {
                if (viewSiteSlug) window.open(`/?view=site&slug=${encodeURIComponent(viewSiteSlug)}`, '_blank')
              }}
            >
              <ExternalLink className="h-4 w-4" />
              Open storefront
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ----- Tenant form dialog (shared for create + edit) -----

function TenantFormDialog({
  open, onOpenChange, layouts, initial, submitting, onSubmit, title,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  layouts: Layout[]
  initial?: Tenant
  submitting: boolean
  onSubmit: (data: any) => void
  title: string
}) {
  const { t } = useI18n()
  const [name, setName] = useState({
    en: initial?.name || '',
    ar: initial?.nameAr || '',
    he: initial?.nameHe || '',
  })
  const [slug, setSlug] = useState(initial?.slug || '')
  const [phone, setPhone] = useState(initial?.phone || '')
  const [whatsappNumber, setWhatsappNumber] = useState(initial?.whatsappNumber || '')
  const [whatsappPrefill, setWhatsappPrefill] = useState(initial?.whatsappPrefill || '')
  const [ownerName, setOwnerName] = useState(initial?.ownerName || '')
  const [ownerPhone, setOwnerPhone] = useState(initial?.ownerPhone || '')
  const [validUntil, setValidUntil] = useState(() => {
    if (!initial?.validUntil) return ''
    // Convert ISO string to YYYY-MM-DD for input[type="date"]
    return new Date(initial.validUntil).toISOString().split('T')[0]
  })
  const [customDomains, setCustomDomains] = useState(() => {
    try {
      return (JSON.parse(initial?.customDomains || '[]') as string[]).join('\n')
    } catch {
      return ''
    }
  })
  const [description, setDescription] = useState({
    en: initial?.description || '',
    ar: initial?.descriptionAr || '',
    he: initial?.descriptionHe || '',
  })
  const [status, setStatus] = useState(initial?.status || 'ACTIVE')
  const [plan, setPlan] = useState(initial?.plan || 'BASIC')
  const [layoutId, setLayoutId] = useState<string>(initial?.layoutId || 'none')
  const [rtl, setRtl] = useState(false)

  // Sync form when dialog opens or `initial` changes via key-based remount
  // (the parent passes a key based on initial?.id, so this component is fresh
  // every time the dialog opens — useState initializer reads `initial` once.)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.en || !slug) {
      toast.error(t('common.required'))
      return
    }
    onSubmit({
      name: name.en,
      nameAr: name.ar || undefined,
      nameHe: name.he || undefined,
      slug: slug.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
      phone: phone || undefined,
      whatsappNumber: whatsappNumber || undefined,
      whatsappPrefill: whatsappPrefill || undefined,
      ownerName: ownerName || undefined,
      ownerPhone: ownerPhone || undefined,
      validUntil: validUntil ? new Date(validUntil).toISOString() : undefined,
      customDomains: JSON.stringify(
        customDomains
          .split('\n')
          .map((d: string) => d.trim().toLowerCase())
          .filter(Boolean)
      ),
      description: description.en || undefined,
      descriptionAr: description.ar || undefined,
      descriptionHe: description.he || undefined,
      status,
      plan,
      layoutId: layoutId === 'none' ? null : layoutId,
      rtl,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{t('brand.tagline')}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <MultiLanguageInput
            label={t('common.name')}
            field="name"
            values={name}
            onChange={setName}
            required
            placeholder="e.g. Demo Furniture"
          />
          <div className="space-y-1.5">
            <Label htmlFor="t-slug">{t('tenants.slug')} *</Label>
            <Input
              id="t-slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
              placeholder="my-store"
              required
            />
          </div>
          <div className="space-y-1.5">
            <div className="space-y-1.5">
              <Label htmlFor="t-phone">{t('common.phone')}</Label>
              <Input id="t-phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="t-wa">WhatsApp number</Label>
              <Input
                id="t-wa"
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="15551234567"
                inputMode="numeric"
              />
              <p className="text-[10px] text-muted-foreground">Digits only, country code first. Used for cart checkout.</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="t-wa-pre">Order message intro</Label>
              <Input
                id="t-wa-pre"
                value={whatsappPrefill}
                onChange={(e) => setWhatsappPrefill(e.target.value)}
                placeholder="Hi! I'd like to order:"
              />
              <p className="text-[10px] text-muted-foreground">First line of the WhatsApp order message.</p>
            </div>
          </div>
          {/* Tenant Owner Information */}
          <div className="space-y-3 p-3 rounded-lg bg-slate-50 border border-slate-200">
            <div className="font-medium text-sm">Tenant Owner Information</div>
            <div className="space-y-1.5">
              <Label htmlFor="t-owner-name">Owner Name</Label>
              <Input
                id="t-owner-name"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                placeholder="John Doe"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="t-owner-phone">Owner Phone</Label>
              <Input
                id="t-owner-phone"
                value={ownerPhone}
                onChange={(e) => setOwnerPhone(e.target.value)}
                placeholder="+1234567890"
              />
            </div>
          </div>
          {/* Subscription Validity */}
          <div className="space-y-3 p-3 rounded-lg bg-amber-50 border border-amber-200">
            <div className="font-medium text-sm">Subscription Validity</div>
            <div className="space-y-1.5">
              <Label htmlFor="t-valid-until">Valid Until</Label>
              <div className="flex gap-2">
                <Input
                  id="t-valid-until"
                  type="date"
                  value={validUntil}
                  onChange={(e) => setValidUntil(e.target.value)}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const baseDate = validUntil ? new Date(validUntil) : new Date()
                    const newDate = new Date(baseDate)
                    newDate.setFullYear(newDate.getFullYear() + 1)
                    setValidUntil(newDate.toISOString().split('T')[0])
                  }}
                  className="shrink-0 gap-1.5"
                >
                  <Plus className="h-3.5 w-3.5" />
                  +1 Year
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground">
                Set the subscription expiry date. Use "+1 Year" to extend from the current valid date (or today if not set).
              </p>
            </div>
          </div>
          {/* Custom domains — one per line */}
          <div className="space-y-1.5">
            <Label htmlFor="t-domains">Custom domains</Label>
            <Textarea
              id="t-domains"
              value={customDomains}
              onChange={(e) => setCustomDomains(e.target.value)}
              rows={2}
              placeholder={"velvetnight.com\nwww.velvetnight.com"}
            />
            <p className="text-[10px] text-muted-foreground">
              One domain per line. The tenant must point a CNAME record at your Vercel deployment
              for each domain, and you must add each domain in the Vercel dashboard.
            </p>
          </div>
          <MultiLanguageInput
            label={t('common.description')}
            field="description"
            values={description}
            onChange={setDescription}
            multiline
            rows={3}
            placeholder="A short paragraph about this store…"
          />
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label>{t('common.status')}</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>{t('common.plan')}</Label>
              <Select value={plan} onValueChange={setPlan}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PLANS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>{t('common.layout')}</Label>
              <Select value={layoutId} onValueChange={setLayoutId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent className="max-h-72">
                  <SelectItem value="none">{t('common.none')}</SelectItem>
                  {layouts.map((l) => (
                    <SelectItem key={l.id} value={l.id}>
                      {l.name} · {l.category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
            <div>
              <Label htmlFor="t-rtl" className="text-sm font-medium">{t('theme.rtl')}</Label>
              <p className="text-xs text-muted-foreground">Arabic / Hebrew storefronts use RTL by default.</p>
            </div>
            <Switch id="t-rtl" checked={rtl} onCheckedChange={setRtl} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={submitting} className="bg-rose-600 hover:bg-rose-700">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {initial ? t('common.save') : t('common.create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

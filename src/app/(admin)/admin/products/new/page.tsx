'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useI18n } from '@/hooks/use-i18n'
import { toast } from 'sonner'
import { DashboardShell, NavItem } from '@/components/dashboard-shell'
import { Package, FolderTree, Images, Palette, MessageCircle, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { MultiLanguageInput } from '@/components/admin/multi-language-input'
import { MultiImageUpload } from '@/components/admin/multi-image-upload'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { ArrowLeft, Loader2, Star } from 'lucide-react'

type Category = { id: string; name: string; icon: string | null }

const STATUSES = ['ACTIVE', 'DRAFT', 'ARCHIVED']

export default function NewProductPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session } = useSession()
  const { t } = useI18n()
  const qc = useQueryClient()

  // Helper to preserve search params when navigating back
  const getBackUrl = () => {
    const params = new URLSearchParams(searchParams.toString())
    return `/admin${params.toString() ? `?${params.toString()}` : ''}`
  }

  // Fetch tenant info for dashboard shell
  const tenantQ = useQuery<{ tenants: any[] }>({
    queryKey: ['my-tenant'],
    queryFn: async () => {
      const r = await fetch('/api/tenants')
      if (!r.ok) throw new Error('failed')
      return r.json()
    },
  })
  const myTenant = tenantQ.data?.tenants?.[0]
  const tenantName = myTenant?.name

  const navItems: NavItem[] = [
    { key: 'products',    label: t('nav.products'),    icon: Package },
    { key: 'categories',  label: t('nav.categories'),  icon: FolderTree },
    { key: 'heroSlides',  label: t('nav.heroSlides'),  icon: Images },
    { key: 'theme',       label: t('nav.theme'),       icon: Palette },
    { key: 'contact',     label: t('nav.contact'),     icon: MessageCircle },
  ]

  const handleViewSite = () => {
    if (myTenant?.slug) {
      const url = new URL(window.location.href)
      const host = url.searchParams.get('host')
      if (host) {
        window.open(`/?host=${encodeURIComponent(host)}`, '_blank')
      } else {
        window.open(`/?view=site&slug=${encodeURIComponent(myTenant.slug)}`, '_blank')
      }
    }
  }

  const [name, setName] = useState({ en: '', ar: '', he: '' })
  const [description, setDescription] = useState({ en: '', ar: '', he: '' })
  const [price, setPrice] = useState('')
  const [compareAt, setCompareAt] = useState('')
  const [sku, setSku] = useState('')
  const [stock, setStock] = useState('0')
  const [images, setImages] = useState<string[]>([])
  const [categoryId, setCategoryId] = useState<string>('none')
  const [featured, setFeatured] = useState(false)
  const [status, setStatus] = useState('ACTIVE')

  // Fetch categories
  const catsQ = useQuery<{ categories: Category[] }>({
    queryKey: ['categories'],
    queryFn: async () => {
      const r = await fetch('/api/categories')
      if (!r.ok) throw new Error('failed')
      return r.json()
    },
  })

  const categories = catsQ.data?.categories ?? []

  const createMut = useMutation({
    mutationFn: async (data: any) => {
      const r = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const j = await r.json()
      if (!r.ok) throw new Error(j.error || 'failed')
      return j
    },
    onSuccess: () => {
      toast.success(t('products.created'))
      qc.invalidateQueries({ queryKey: ['products'] })
      router.push(getBackUrl())
    },
    onError: (e: any) => toast.error(e.message || t('toast.error')),
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.en || !price) {
      toast.error(t('common.required'))
      return
    }
    createMut.mutate({
      name: name.en,
      nameAr: name.ar || undefined,
      nameHe: name.he || undefined,
      description: description.en || undefined,
      descriptionAr: description.ar || undefined,
      descriptionHe: description.he || undefined,
      price: Number(price),
      compareAt: compareAt ? Number(compareAt) : null,
      sku: sku || undefined,
      stock: Number(stock || 0),
      images: JSON.stringify(images),
      image: images[0] || '📦', // Backward compat: set first image as main image
      categoryId: categoryId === 'none' ? null : categoryId,
      featured,
      status,
    })
  }

  const renderContent = () => {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button onClick={() => router.push(getBackUrl())} variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              {t('common.back')}
            </Button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{t('products.add')}</h1>
              <p className="text-sm text-muted-foreground">Create a new product</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>{t('products.details')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Images upload */}
              <MultiImageUpload
                value={images}
                onChange={setImages}
                label={t('common.image')}
                maxImages={5}
                aspectRatio="1/1"
              />

              <MultiLanguageInput
                label={t('common.name')}
                field="name"
                values={name}
                onChange={setName}
                required
                placeholder="e.g. Velvet Lounge Sofa"
              />

              <MultiLanguageInput
                label={t('common.description')}
                field="description"
                values={description}
                onChange={setDescription}
                multiline
                rows={3}
                placeholder="Materials, dimensions, story behind the piece…"
              />

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="p-price">{t('common.price')} *</Label>
                  <Input id="p-price" type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="p-compare">{t('products.compareAt')}</Label>
                  <Input id="p-compare" type="number" min="0" step="0.01" value={compareAt} onChange={(e) => setCompareAt(e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="p-sku">{t('common.sku')}</Label>
                  <Input id="p-sku" value={sku} onChange={(e) => setSku(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="p-stock">{t('common.stock')}</Label>
                  <Input id="p-stock" type="number" min="0" value={stock} onChange={(e) => setStock(e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>{t('common.category')}</Label>
                  <Select value={categoryId} onValueChange={setCategoryId}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">{t('common.none')}</SelectItem>
                      {categories.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>{t('common.status')}</Label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STATUSES.map((s) => <SelectItem key={s} value={s}>{t(`products.status.${s}` as any)}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
                <div>
                  <Label htmlFor="p-featured" className="text-sm font-medium flex items-center gap-1">
                    <Star className="h-3.5 w-3.5" />
                    {t('products.featured')}
                  </Label>
                  <p className="text-xs text-muted-foreground">Show on storefront home</p>
                </div>
                <Switch id="p-featured" checked={featured} onCheckedChange={setFeatured} />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => router.push(getBackUrl())} disabled={createMut.isPending}>
                  {t('common.cancel')}
                </Button>
                <Button type="submit" disabled={createMut.isPending} className="bg-emerald-600 hover:bg-emerald-700">
                  {createMut.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  {t('common.create')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    )
  }

  return (
    <DashboardShell
      role="CLIENT_ADMIN"
      user={{
        name: session?.user?.name,
        email: session?.user?.email,
        tenantName,
      }}
      navItems={navItems}
      activeKey="products"
      onChange={(key) => {
        if (key !== 'products') {
          router.push(getBackUrl())
        }
      }}
      headerAccent="from-emerald-500 to-amber-500"
    >
      <div className="space-y-4">
        {myTenant?.slug && (
          <div className="flex justify-end">
            <Button onClick={handleViewSite} variant="outline" size="sm" className="gap-1.5">
              <ExternalLink className="h-3.5 w-3.5" />
              {t('common.viewSite')}
            </Button>
          </div>
        )}
        {renderContent()}
      </div>
    </DashboardShell>
  )
}

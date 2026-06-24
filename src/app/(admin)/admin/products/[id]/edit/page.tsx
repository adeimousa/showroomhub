'use client'

import { useEffect, useState, Suspense } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
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
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { ArrowLeft, Loader2, Trash2 } from 'lucide-react'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

type Category = { id: string; name: string; icon: string | null }
type Product = {
  id: string
  name: string
  nameAr: string | null
  nameHe: string | null
  description: string | null
  descriptionAr: string | null
  descriptionHe: string | null
  price: number
  compareAt: number | null
  sku: string | null
  stock: number
  image: string | null
  images: string
  featured: boolean
  status: string
  category: Category | null
}

const STATUSES = ['ACTIVE', 'DRAFT', 'ARCHIVED']

function EditProductPageContent() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session } = useSession()
  const { t } = useI18n()
  const qc = useQueryClient()
  const productId = params.id as string

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
      // Use the preview URL with slug for development/testing
      const url = new URL(window.location.href)
      const host = url.searchParams.get('host')
      if (host) {
        // If we have a host param, use it to view the live site
        window.open(`/?host=${encodeURIComponent(host)}`, '_blank')
      } else {
        // Fallback to slug-based preview
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
  const [status, setStatus] = useState('ACTIVE')
  const [deleteOpen, setDeleteOpen] = useState(false)

  // Fetch product
  const productQ = useQuery<{ product: Product }>({
    queryKey: ['product', productId],
    queryFn: async () => {
      const r = await fetch(`/api/products/${productId}`)
      if (!r.ok) throw new Error('Failed to fetch product')
      return r.json()
    },
    enabled: !!productId,
  })

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
  const product = productQ.data?.product

  // Populate form when product loads
  useEffect(() => {
    if (product) {
      setName({ en: product.name || '', ar: product.nameAr || '', he: product.nameHe || '' })
      setDescription({ en: product.description || '', ar: product.descriptionAr || '', he: product.descriptionHe || '' })
      setPrice(String(product.price))
      setCompareAt(product.compareAt ? String(product.compareAt) : '')
      setSku(product.sku || '')
      setStock(String(product.stock))

      // Parse images from JSON, with backward compatibility for old image field
      try {
        const parsedImages = JSON.parse(product.images || '[]')
        if (parsedImages.length > 0) {
          setImages(parsedImages)
        } else if (product.image) {
          // Backward compat: if no images but has old image field, use it
          setImages([product.image])
        }
      } catch {
        // If parsing fails, fall back to old image field
        if (product.image) {
          setImages([product.image])
        }
      }

      setCategoryId(product.category?.id || 'none')
      setStatus(product.status)
    }
  }, [product])

  const updateMut = useMutation({
    mutationFn: async (data: any) => {
      const r = await fetch(`/api/products/${productId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const j = await r.json()
      if (!r.ok) throw new Error(j.error || 'failed')
      return j
    },
    onSuccess: () => {
      toast.success(t('products.updated'))
      qc.invalidateQueries({ queryKey: ['products'] })
      qc.invalidateQueries({ queryKey: ['product', productId] })
      router.push(getBackUrl())
    },
    onError: (e: any) => toast.error(e.message || t('toast.error')),
  })

  const deleteMut = useMutation({
    mutationFn: async () => {
      const r = await fetch(`/api/products/${productId}`, { method: 'DELETE' })
      if (!r.ok) throw new Error('failed')
      return r.json()
    },
    onSuccess: () => {
      toast.success(t('products.deleted'))
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
    updateMut.mutate({
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
      image: images[0] || null, // Backward compat: set first image as main image
      categoryId: categoryId === 'none' ? null : categoryId,
      status,
    })
  }

  const renderContent = () => {
    if (productQ.isLoading) {
      return (
        <div className="max-w-3xl mx-auto space-y-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-96" />
        </div>
      )
    }

    if (!product) {
      return (
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">{t('products.notFound')}</p>
            <Button onClick={() => router.push(getBackUrl())} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t('common.back')}
            </Button>
          </div>
        </div>
      )
    }

    return (
      <div>
      <div className="max-w-3xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button onClick={() => router.push(getBackUrl())} variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              {t('common.back')}
            </Button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{t('products.edit')}</h1>
              <p className="text-sm text-muted-foreground">{product.name}</p>
            </div>
          </div>
          <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50">
                <Trash2 className="h-4 w-4" />
                {t('common.delete')}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t('products.deleteConfirm')}</AlertDialogTitle>
                <AlertDialogDescription>{product.name}</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={deleteMut.isPending}>{t('common.cancel')}</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => deleteMut.mutate()}
                  disabled={deleteMut.isPending}
                  className="bg-rose-600 hover:bg-rose-700"
                >
                  {deleteMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : t('common.delete')}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
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

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => router.push(getBackUrl())} disabled={updateMut.isPending}>
                  {t('common.cancel')}
                </Button>
                <Button type="submit" disabled={updateMut.isPending} className="bg-emerald-600 hover:bg-emerald-700">
                  {updateMut.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  {t('common.save')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
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

export default function EditProductPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
      <EditProductPageContent />
    </Suspense>
  )
}

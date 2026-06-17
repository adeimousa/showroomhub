'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useI18n } from '@/hooks/use-i18n'
import { toast } from 'sonner'
import { Card, CardContent } from '@/components/ui/card'
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
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { Plus, Search, MoreVertical, Pencil, Trash2, Star, Package, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

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
  featured: boolean
  status: string
  category: Category | null
  createdAt: string
}

const STATUSES = ['ACTIVE', 'DRAFT', 'ARCHIVED']
const EMOJI_CHOICES = ['🛋️', '🪑', '💺', '🛏️', '📚', '🪨', '🧶', '🪵', '🚪', '💡', '🏺', '🗄️', '📦', '🪟', '🛁', '🍽️']

export function ProductsTab() {
  const { t, lang } = useI18n()
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [categoryFilter, setCategoryFilter] = useState('ALL')
  const [createOpen, setCreateOpen] = useState(false)
  const [editProduct, setEditProduct] = useState<Product | null>(null)
  const [deleteProduct, setDeleteProduct] = useState<Product | null>(null)

  const productsQ = useQuery<{ products: Product[] }>({
    queryKey: ['products'],
    queryFn: async () => {
      const r = await fetch('/api/products')
      if (!r.ok) throw new Error('failed')
      return r.json()
    },
  })
  const catsQ = useQuery<{ categories: Category[] }>({
    queryKey: ['categories'],
    queryFn: async () => {
      const r = await fetch('/api/categories')
      if (!r.ok) throw new Error('failed')
      return r.json()
    },
  })

  const products = productsQ.data?.products ?? []
  const categories = catsQ.data?.categories ?? []

  const filtered = products.filter((p) => {
    const matchesSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.sku?.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter
    const matchesCat = categoryFilter === 'ALL' || p.category?.id === categoryFilter
    return matchesSearch && matchesStatus && matchesCat
  })

  const createMut = useMutation({
    mutationFn: async (data: any) => {
      const r = await fetch('/api/products', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
      const j = await r.json()
      if (!r.ok) throw new Error(j.error || 'failed')
      return j
    },
    onSuccess: () => {
      toast.success(t('products.created'))
      qc.invalidateQueries({ queryKey: ['products'] })
      setCreateOpen(false)
    },
    onError: (e: any) => toast.error(e.message || t('toast.error')),
  })

  const updateMut = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const r = await fetch(`/api/products/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
      const j = await r.json()
      if (!r.ok) throw new Error(j.error || 'failed')
      return j
    },
    onSuccess: () => {
      toast.success(t('products.updated'))
      qc.invalidateQueries({ queryKey: ['products'] })
      setEditProduct(null)
    },
    onError: (e: any) => toast.error(e.message || t('toast.error')),
  })

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const r = await fetch(`/api/products/${id}`, { method: 'DELETE' })
      if (!r.ok) throw new Error('failed')
      return r.json()
    },
    onSuccess: () => {
      toast.success(t('products.deleted'))
      qc.invalidateQueries({ queryKey: ['products'] })
      setDeleteProduct(null)
    },
    onError: (e: any) => toast.error(e.message || t('toast.error')),
  })

  const toggleFeatured = (p: Product) => {
    updateMut.mutate({ id: p.id, data: { featured: !p.featured } })
  }

  const fmtPrice = (n: number) => `$${n.toLocaleString()}`

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('products.title')}</h1>
          <p className="text-sm text-muted-foreground">{products.length} {t('nav.products').toLowerCase()}</p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="gap-1.5 bg-emerald-600 hover:bg-emerald-700">
          <Plus className="h-4 w-4" />
          {t('products.add')}
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder={t('common.search')} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder={t('common.category')} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">{t('common.all')}</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.icon} {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">{t('common.all')}</SelectItem>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s}>{t(`products.status.${s}` as any)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Grid */}
      {productsQ.isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-56 rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Package className="h-10 w-10 mx-auto mb-3 opacity-40" />
          {t('products.empty')}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {filtered.map((p) => (
            <Card key={p.id} className="border-slate-200 overflow-hidden group">
              <div className="aspect-square bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-6xl relative">
                {p.image || '📦'}
                {p.compareAt && p.compareAt > p.price && (
                  <Badge className="absolute top-2 left-2 bg-rose-600 text-[10px]">
                    -{Math.round((1 - p.price / p.compareAt) * 100)}%
                  </Badge>
                )}
                {p.featured && (
                  <Badge className="absolute top-2 right-2 bg-amber-500 text-[10px] gap-0.5">
                    <Star className="h-2.5 w-2.5 fill-current" />
                    {t('products.featured')}
                  </Badge>
                )}
                <div className="absolute bottom-2 right-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="secondary" size="sm" className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreVertical className="h-3.5 w-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44">
                      <DropdownMenuItem onClick={() => setEditProduct(p)}>
                        <Pencil className="h-3.5 w-3.5" />
                        {t('common.edit')}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => toggleFeatured(p)}>
                        <Star className={cn('h-3.5 w-3.5', p.featured && 'fill-amber-500 text-amber-500')} />
                        {p.featured ? 'Unfeature' : t('products.featured')}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => setDeleteProduct(p)} className="text-rose-600 focus:text-rose-700">
                        <Trash2 className="h-3.5 w-3.5" />
                        {t('common.delete')}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              <CardContent className="p-3">
                <div className="flex items-start justify-between gap-1 mb-0.5">
                  <div className="text-xs text-muted-foreground">
                    {p.category ? `${p.category.icon} ${p.category.name}` : t('common.none')}
                  </div>
                  <Badge variant="secondary" className="text-[9px]">{t(`products.status.${p.status}` as any)}</Badge>
                </div>
                <div className="font-medium text-sm line-clamp-1">{p.name}</div>
                {p.sku && <div className="text-[10px] text-muted-foreground font-mono">{p.sku}</div>}
                <div className="flex items-center justify-between mt-2">
                  <div>
                    <span className="font-bold">{fmtPrice(p.price)}</span>
                    {p.compareAt && p.compareAt > p.price && (
                      <span className="ml-1 text-xs text-muted-foreground line-through">{fmtPrice(p.compareAt)}</span>
                    )}
                  </div>
                  <Badge variant={p.stock > 0 ? 'outline' : 'destructive'} className="text-[9px]">
                    {p.stock > 0 ? `${p.stock} ${t('common.stock').toLowerCase()}` : t('store.outOfStock')}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create / Edit dialog */}
      <ProductFormDialog
        key={`create-${createOpen}`}
        open={createOpen}
        onOpenChange={(o) => { if (!o) setCreateOpen(false) }}
        categories={categories}
        submitting={createMut.isPending}
        onSubmit={(data) => createMut.mutate(data)}
        title={t('products.add')}
      />
      <ProductFormDialog
        key={`edit-${editProduct?.id ?? 'none'}`}
        open={!!editProduct}
        onOpenChange={(o) => { if (!o) setEditProduct(null) }}
        categories={categories}
        initial={editProduct || undefined}
        submitting={updateMut.isPending}
        onSubmit={(data) => editProduct && updateMut.mutate({ id: editProduct.id, data })}
        title={t('products.edit')}
      />

      {/* Delete confirm */}
      <AlertDialog open={!!deleteProduct} onOpenChange={(o) => !o && setDeleteProduct(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('products.deleteConfirm')}</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteProduct?.name}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMut.isPending}>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteProduct && deleteMut.mutate(deleteProduct.id)}
              disabled={deleteMut.isPending}
              className="bg-rose-600 hover:bg-rose-700"
            >
              {deleteMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// ----- Form dialog -----

function ProductFormDialog({
  open, onOpenChange, categories, initial, submitting, onSubmit, title,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  categories: Category[]
  initial?: Product
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
  const [description, setDescription] = useState({
    en: initial?.description || '',
    ar: initial?.descriptionAr || '',
    he: initial?.descriptionHe || '',
  })
  const [price, setPrice] = useState(initial ? String(initial.price) : '')
  const [compareAt, setCompareAt] = useState(initial?.compareAt ? String(initial.compareAt) : '')
  const [sku, setSku] = useState(initial?.sku || '')
  const [stock, setStock] = useState(initial ? String(initial.stock) : '0')
  const [image, setImage] = useState(initial?.image || '📦')
  const [categoryId, setCategoryId] = useState<string>(initial?.category?.id || 'none')
  const [featured, setFeatured] = useState(initial?.featured || false)
  const [status, setStatus] = useState(initial?.status || 'ACTIVE')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.en || !price) {
      toast.error(t('common.required'))
      return
    }
    onSubmit({
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
      image,
      categoryId: categoryId === 'none' ? null : categoryId,
      featured,
      status,
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
          {/* Image picker */}
          <div className="space-y-1.5">
            <Label>{t('common.image')}</Label>
            <div className="flex flex-wrap gap-1">
              {EMOJI_CHOICES.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setImage(e)}
                  className={cn(
                    'h-10 w-10 rounded-lg border text-2xl flex items-center justify-center transition-all',
                    image === e ? 'border-emerald-500 bg-emerald-50 scale-105' : 'border-slate-200 hover:border-slate-300'
                  )}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

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
                    <SelectItem key={c.id} value={c.id}>{c.icon} {c.name}</SelectItem>
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

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={submitting} className="bg-emerald-600 hover:bg-emerald-700">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {initial ? t('common.save') : t('common.create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useI18n } from '@/hooks/use-i18n'
import { toast } from 'sonner'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { Plus, Search, MoreVertical, Pencil, Trash2, Package, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

type Category = { id: string; name: string; image: string | null }
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

export function ProductsTab() {
  const { t, lang } = useI18n()
  const router = useRouter()
  const searchParams = useSearchParams()
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [categoryFilter, setCategoryFilter] = useState('ALL')
  const [deleteProduct, setDeleteProduct] = useState<Product | null>(null)

  // Helper to preserve search params (like ?host=)
  const getEditUrl = (productId: string) => {
    const params = new URLSearchParams(searchParams.toString())
    return `/admin/products/${productId}/edit${params.toString() ? `?${params.toString()}` : ''}`
  }

  const getNewUrl = () => {
    const params = new URLSearchParams(searchParams.toString())
    return `/admin/products/new${params.toString() ? `?${params.toString()}` : ''}`
  }

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

  const fmtPrice = (n: number) => `₪${n.toLocaleString()}`

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('products.title')}</h1>
          <p className="text-sm text-muted-foreground">{products.length} {t('nav.products').toLowerCase()}</p>
        </div>
        <Button onClick={() => router.push(getNewUrl())} className="gap-1.5 bg-emerald-600 hover:bg-emerald-700">
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
                {c.name}
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
              <div
                className="aspect-square bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center relative cursor-pointer"
                onClick={() => router.push(getEditUrl(p.id))}
              >
                {p.image ? (
                  <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                ) : (
                  <Package className="h-16 w-16 text-muted-foreground/40" />
                )}
                {p.compareAt && p.compareAt > p.price && (
                  <Badge className="absolute top-2 left-2 bg-rose-600 text-[10px]">
                    -{Math.round((1 - p.price / p.compareAt) * 100)}%
                  </Badge>
                )}
                <div className="absolute bottom-2 right-2" onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="secondary" size="sm" className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreVertical className="h-3.5 w-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44">
                      <DropdownMenuItem onClick={() => router.push(getEditUrl(p.id))}>
                        <Pencil className="h-3.5 w-3.5" />
                        {t('common.edit')}
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
                    {p.category ? p.category.name : t('common.none')}
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

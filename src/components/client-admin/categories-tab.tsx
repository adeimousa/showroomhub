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
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Plus, Pencil, Trash2, FolderTree, Loader2 } from 'lucide-react'

type Category = {
  id: string
  name: string
  nameAr: string | null
  nameHe: string | null
  image: string | null
  _count: { products: number }
}

export function CategoriesTab() {
  const { t, lang } = useI18n()
  const router = useRouter()
  const searchParams = useSearchParams()
  const qc = useQueryClient()
  const [deleteCat, setDeleteCat] = useState<Category | null>(null)

  // Helper to preserve search params
  const getEditUrl = (categoryId: string) => {
    const params = new URLSearchParams(searchParams.toString())
    return `/admin/categories/${categoryId}/edit${params.toString() ? `?${params.toString()}` : ''}`
  }

  const getNewUrl = () => {
    const params = new URLSearchParams(searchParams.toString())
    return `/admin/categories/new${params.toString() ? `?${params.toString()}` : ''}`
  }

  // Helper to get category name in current language
  const getCategoryName = (cat: Category) => {
    if (lang === 'ar' && cat.nameAr) return cat.nameAr
    if (lang === 'he' && cat.nameHe) return cat.nameHe
    return cat.name
  }

  const q = useQuery<{ categories: Category[] }>({
    queryKey: ['categories'],
    queryFn: async () => {
      const r = await fetch('/api/categories')
      if (!r.ok) throw new Error('failed')
      return r.json()
    },
  })

  const categories = q.data?.categories ?? []

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const r = await fetch(`/api/categories/${id}`, { method: 'DELETE' })
      if (!r.ok) throw new Error('failed')
      return r.json()
    },
    onSuccess: () => {
      toast.success(t('categories.deleted'))
      qc.invalidateQueries({ queryKey: ['categories'] })
      qc.invalidateQueries({ queryKey: ['products'] })
      setDeleteCat(null)
    },
    onError: (e: any) => toast.error(e.message || t('toast.error')),
  })

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('categories.title')}</h1>
          <p className="text-sm text-muted-foreground">{categories.length} {t('nav.categories').toLowerCase()}</p>
        </div>
        <Button onClick={() => router.push(getNewUrl())} className="gap-1.5 bg-emerald-600 hover:bg-emerald-700">
          <Plus className="h-4 w-4" />
          {t('categories.add')}
        </Button>
      </div>

      {q.isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      ) : categories.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <FolderTree className="h-10 w-10 mx-auto mb-3 opacity-40" />
          {t('categories.empty')}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {categories.map((c) => (
            <Card key={c.id} className="border-slate-200 group">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="h-16 w-16 rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center shrink-0 overflow-hidden">
                  {c.image ? (
                    <img src={c.image} alt={getCategoryName(c)} className="w-full h-full object-cover" />
                  ) : (
                    <FolderTree className="h-8 w-8 text-muted-foreground/40" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{getCategoryName(c)}</div>
                  <Badge variant="secondary" className="text-[10px] mt-0.5">
                    {c._count.products} {t('categories.productCount').toLowerCase()}
                  </Badge>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => router.push(getEditUrl(c.id))}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-rose-600 hover:text-rose-700" onClick={() => setDeleteCat(c)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete confirm */}
      <AlertDialog open={!!deleteCat} onOpenChange={(o) => !o && setDeleteCat(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('categories.deleteConfirm')}</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteCat && getCategoryName(deleteCat)} · {deleteCat?._count.products} {t('categories.productCount').toLowerCase()}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMut.isPending}>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteCat && deleteMut.mutate(deleteCat.id)}
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

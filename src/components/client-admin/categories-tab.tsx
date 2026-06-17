'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useI18n } from '@/hooks/use-i18n'
import { toast } from 'sonner'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Plus, Pencil, Trash2, FolderTree, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

type Category = {
  id: string
  name: string
  icon: string | null
  _count: { products: number }
}

const EMOJI_CHOICES = ['🛋️', '🪑', '💺', '🛏️', '📚', '🪨', '🧶', '🪵', '🚪', '💡', '🏺', '🗄️', '📦', '🪟', '🛁', '🍽️', '🎨', '🌿', '🔥', '❄️']

export function CategoriesTab() {
  const { t } = useI18n()
  const qc = useQueryClient()
  const [createOpen, setCreateOpen] = useState(false)
  const [editCat, setEditCat] = useState<Category | null>(null)
  const [deleteCat, setDeleteCat] = useState<Category | null>(null)

  const q = useQuery<{ categories: Category[] }>({
    queryKey: ['categories'],
    queryFn: async () => {
      const r = await fetch('/api/categories')
      if (!r.ok) throw new Error('failed')
      return r.json()
    },
  })

  const categories = q.data?.categories ?? []

  const createMut = useMutation({
    mutationFn: async (data: any) => {
      const r = await fetch('/api/categories', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
      const j = await r.json()
      if (!r.ok) throw new Error(j.error || 'failed')
      return j
    },
    onSuccess: () => {
      toast.success(t('categories.created'))
      qc.invalidateQueries({ queryKey: ['categories'] })
      setCreateOpen(false)
    },
    onError: (e: any) => toast.error(e.message || t('toast.error')),
  })

  const updateMut = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const r = await fetch(`/api/categories/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
      const j = await r.json()
      if (!r.ok) throw new Error(j.error || 'failed')
      return j
    },
    onSuccess: () => {
      toast.success(t('categories.updated'))
      qc.invalidateQueries({ queryKey: ['categories'] })
      setEditCat(null)
    },
    onError: (e: any) => toast.error(e.message || t('toast.error')),
  })

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
        <Button onClick={() => setCreateOpen(true)} className="gap-1.5 bg-emerald-600 hover:bg-emerald-700">
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
                <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-2xl shrink-0">
                  {c.icon || '📦'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{c.name}</div>
                  <Badge variant="secondary" className="text-[10px] mt-0.5">
                    {c._count.products} {t('categories.productCount').toLowerCase()}
                  </Badge>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setEditCat(c)}>
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

      {/* Create / Edit dialog */}
      <CategoryFormDialog
        key={`create-${createOpen}`}
        open={createOpen}
        onOpenChange={(o) => { if (!o) setCreateOpen(false) }}
        submitting={createMut.isPending}
        onSubmit={(data) => createMut.mutate(data)}
        title={t('categories.add')}
      />
      <CategoryFormDialog
        key={`edit-${editCat?.id ?? 'none'}`}
        open={!!editCat}
        onOpenChange={(o) => { if (!o) setEditCat(null) }}
        initial={editCat || undefined}
        submitting={updateMut.isPending}
        onSubmit={(data) => editCat && updateMut.mutate({ id: editCat.id, data })}
        title={t('categories.edit')}
      />

      {/* Delete confirm */}
      <AlertDialog open={!!deleteCat} onOpenChange={(o) => !o && setDeleteCat(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('categories.deleteConfirm')}</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteCat?.name} · {deleteCat?._count.products} {t('categories.productCount').toLowerCase()}
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

function CategoryFormDialog({
  open, onOpenChange, initial, submitting, onSubmit, title,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  initial?: Category
  submitting: boolean
  onSubmit: (data: any) => void
  title: string
}) {
  const { t } = useI18n()
  const [name, setName] = useState(initial?.name || '')
  const [icon, setIcon] = useState(initial?.icon || '📦')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name) {
      toast.error(t('common.required'))
      return
    }
    onSubmit({ name, icon })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{t('brand.tagline')}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="c-name">{t('common.name')} *</Label>
            <Input id="c-name" value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
          </div>
          <div className="space-y-1.5">
            <Label>{t('categories.icon')}</Label>
            <div className="flex flex-wrap gap-1">
              {EMOJI_CHOICES.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setIcon(e)}
                  className={cn(
                    'h-10 w-10 rounded-lg border text-2xl flex items-center justify-center transition-all',
                    icon === e ? 'border-emerald-500 bg-emerald-50 scale-105' : 'border-slate-200 hover:border-slate-300'
                  )}
                >
                  {e}
                </button>
              ))}
            </div>
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

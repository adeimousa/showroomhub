'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useI18n } from '@/hooks/use-i18n'
import { toast } from 'sonner'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { MultiLanguageInput } from '@/components/admin/multi-language-input'
import { ImageUpload } from '@/components/admin/image-upload'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Plus, Pencil, Trash2, BookImage, Loader2, GripVertical, Image, X } from 'lucide-react'
import { cn } from '@/lib/utils'

type Catalogue = {
  id: string
  name: string
  nameAr: string | null
  nameHe: string | null
  images: string // JSON array of URLs
  order: number
  active: boolean
  createdAt: string
}

// Parse the JSON `images` field into a string[] defensively.
function parseImages(images: string | null | undefined): string[] {
  if (!images) return []
  try {
    const arr = JSON.parse(images)
    return Array.isArray(arr) ? arr.filter((x) => typeof x === 'string') : []
  } catch {
    return []
  }
}

export function CataloguesTab() {
  const { t } = useI18n()
  const qc = useQueryClient()
  const [createOpen, setCreateOpen] = useState(false)
  const [editCatalogue, setEditCatalogue] = useState<Catalogue | null>(null)
  const [deleteCatalogue, setDeleteCatalogue] = useState<Catalogue | null>(null)

  const q = useQuery<{ catalogues: Catalogue[] }>({
    queryKey: ['catalogues'],
    queryFn: async () => {
      const r = await fetch('/api/catalogues')
      if (!r.ok) throw new Error('failed')
      return r.json()
    },
  })

  const catalogues = q.data?.catalogues ?? []

  const createMut = useMutation({
    mutationFn: async (data: any) => {
      const r = await fetch('/api/catalogues', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
      const j = await r.json()
      if (!r.ok) throw new Error(j.error || 'failed')
      return j
    },
    onSuccess: () => {
      toast.success(t('catalogues.created'))
      qc.invalidateQueries({ queryKey: ['catalogues'] })
      setCreateOpen(false)
    },
    onError: (e: any) => toast.error(e.message || t('toast.error')),
  })

  const updateMut = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const r = await fetch(`/api/catalogues/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
      const j = await r.json()
      if (!r.ok) throw new Error(j.error || 'failed')
      return j
    },
    onSuccess: () => {
      toast.success(t('catalogues.updated'))
      qc.invalidateQueries({ queryKey: ['catalogues'] })
      setEditCatalogue(null)
    },
    onError: (e: any) => toast.error(e.message || t('toast.error')),
  })

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const r = await fetch(`/api/catalogues/${id}`, { method: 'DELETE' })
      if (!r.ok) throw new Error('failed')
      return r.json()
    },
    onSuccess: () => {
      toast.success(t('catalogues.deleted'))
      qc.invalidateQueries({ queryKey: ['catalogues'] })
      setDeleteCatalogue(null)
    },
    onError: (e: any) => toast.error(e.message || t('toast.error')),
  })

  const toggleActive = (c: Catalogue) => {
    updateMut.mutate({ id: c.id, data: { active: !c.active } })
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('catalogues.title')}</h1>
          <p className="text-sm text-muted-foreground">{t('catalogues.subtitle')}</p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="gap-1.5 bg-emerald-600 hover:bg-emerald-700">
          <Plus className="h-4 w-4" />
          {t('catalogues.add')}
        </Button>
      </div>

      {q.isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
        </div>
      ) : catalogues.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <BookImage className="h-10 w-10 mx-auto mb-3 opacity-40" />
          {t('catalogues.empty')}
        </div>
      ) : (
        <div className="space-y-3">
          {catalogues.map((c, i) => {
            const imgs = parseImages(c.images)
            return (
              <Card key={c.id} className={cn('border-slate-200 group', !c.active && 'opacity-60')}>
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="flex flex-col items-center gap-1 text-muted-foreground">
                    <GripVertical className="h-4 w-4" />
                    <span className="text-xs font-mono">{i + 1}</span>
                  </div>
                  <div className="h-20 w-32 rounded-lg bg-gradient-to-br from-amber-100 to-rose-100 flex items-center justify-center shrink-0 overflow-hidden">
                    {imgs[0] ? (
                      <img src={imgs[0]} alt={c.name} className="w-full h-full object-cover" />
                    ) : (
                      <Image className="h-10 w-10 text-muted-foreground/40" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium truncate">{c.name}</span>
                      {!c.active && <Badge variant="secondary" className="text-[10px]">hidden</Badge>}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {t('catalogues.imageCount', undefined, { n: imgs.length })}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 items-end">
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setEditCatalogue(c)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-rose-600 hover:text-rose-700" onClick={() => setDeleteCatalogue(c)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Switch checked={c.active} onCheckedChange={() => toggleActive(c)} className="scale-75" />
                      <span className="text-[10px] text-muted-foreground">{c.active ? 'on' : 'off'}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <CatalogueFormDialog
        key={`create-${createOpen}`}
        open={createOpen}
        onOpenChange={(o) => { if (!o) setCreateOpen(false) }}
        submitting={createMut.isPending}
        onSubmit={(data) => createMut.mutate(data)}
        title={t('catalogues.add')}
      />
      <CatalogueFormDialog
        key={`edit-${editCatalogue?.id ?? 'none'}`}
        open={!!editCatalogue}
        onOpenChange={(o) => { if (!o) setEditCatalogue(null) }}
        initial={editCatalogue || undefined}
        submitting={updateMut.isPending}
        onSubmit={(data) => editCatalogue && updateMut.mutate({ id: editCatalogue.id, data })}
        title={t('catalogues.edit')}
      />

      <AlertDialog open={!!deleteCatalogue} onOpenChange={(o) => !o && setDeleteCatalogue(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('catalogues.deleteConfirm')}</AlertDialogTitle>
            <AlertDialogDescription>{deleteCatalogue?.name}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMut.isPending}>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteCatalogue && deleteMut.mutate(deleteCatalogue.id)}
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

function CatalogueFormDialog({
  open, onOpenChange, initial, submitting, onSubmit, title,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  initial?: Catalogue
  submitting: boolean
  onSubmit: (data: any) => void
  title: string
}) {
  const { t } = useI18n()
  const [nameField, setNameField] = useState({
    en: initial?.name || '',
    ar: initial?.nameAr || '',
    he: initial?.nameHe || '',
  })
  const [images, setImages] = useState<string[]>(parseImages(initial?.images))
  const [order, setOrder] = useState(initial ? String(initial.order) : '0')
  const [active, setActive] = useState(initial?.active ?? true)

  // Draft slot for adding a new image; on upload we append to the list.
  const addImage = (url: string) => {
    if (url) setImages((prev) => [...prev, url])
  }
  const removeImage = (idx: number) => {
    setImages((prev) => prev.filter((_, i) => i !== idx))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!nameField.en) {
      toast.error(t('common.required'))
      return
    }
    onSubmit({
      name: nameField.en,
      nameAr: nameField.ar || undefined,
      nameHe: nameField.he || undefined,
      images,
      order: Number(order || 0),
      active,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{t('catalogues.subtitle')}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <MultiLanguageInput
            label={t('catalogues.name_field')}
            field="name"
            values={nameField}
            onChange={setNameField}
            required
            placeholder="e.g. Living Room Collection"
          />

          {/* Existing images */}
          <div className="space-y-2">
            <Label>{t('catalogues.images')}</Label>
            {images.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {images.map((url, idx) => (
                  <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-slate-200 group/img">
                    <img src={url} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="absolute top-1 right-1 h-6 w-6 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity"
                      aria-label={t('common.delete')}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            {/* Uploader for adding one more image at a time */}
            <ImageUpload
              key={`add-${images.length}`}
              onChange={addImage}
              label={t('catalogues.addImage')}
              aspectRatio="1/1"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="c-order">{t('catalogues.order')}</Label>
              <Input id="c-order" type="number" min="0" value={order} onChange={(e) => setOrder(e.target.value)} />
            </div>
            <div className="flex items-end pb-2">
              <div className="flex items-center gap-2">
                <Switch id="c-active" checked={active} onCheckedChange={setActive} />
                <Label htmlFor="c-active" className="text-sm">{t('catalogues.active')}</Label>
              </div>
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

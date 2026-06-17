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
import { Plus, Pencil, Trash2, Images, Loader2, GripVertical, Image } from 'lucide-react'
import { cn } from '@/lib/utils'

type Slide = {
  id: string
  title: string
  titleAr: string | null
  titleHe: string | null
  subtitle: string | null
  subtitleAr: string | null
  subtitleHe: string | null
  image: string | null
  ctaText: string
  ctaLink: string
  order: number
  active: boolean
  createdAt: string
}

const EMOJI_CHOICES = ['🌿', '🪑', '✨', '🛋️', '🛏️', '💡', '🖼️', '🌳', '🪟', '🎁', '🔥', '❄️', '⭐', '🎨', '🏠', '👜']

export function HeroSlidesTab() {
  const { t } = useI18n()
  const qc = useQueryClient()
  const [createOpen, setCreateOpen] = useState(false)
  const [editSlide, setEditSlide] = useState<Slide | null>(null)
  const [deleteSlide, setDeleteSlide] = useState<Slide | null>(null)

  const q = useQuery<{ slides: Slide[] }>({
    queryKey: ['hero-slides'],
    queryFn: async () => {
      const r = await fetch('/api/hero-slides')
      if (!r.ok) throw new Error('failed')
      return r.json()
    },
  })

  const slides = q.data?.slides ?? []

  const createMut = useMutation({
    mutationFn: async (data: any) => {
      const r = await fetch('/api/hero-slides', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
      const j = await r.json()
      if (!r.ok) throw new Error(j.error || 'failed')
      return j
    },
    onSuccess: () => {
      toast.success(t('hero.created'))
      qc.invalidateQueries({ queryKey: ['hero-slides'] })
      setCreateOpen(false)
    },
    onError: (e: any) => toast.error(e.message || t('toast.error')),
  })

  const updateMut = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const r = await fetch(`/api/hero-slides/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
      const j = await r.json()
      if (!r.ok) throw new Error(j.error || 'failed')
      return j
    },
    onSuccess: () => {
      toast.success(t('hero.updated'))
      qc.invalidateQueries({ queryKey: ['hero-slides'] })
      setEditSlide(null)
    },
    onError: (e: any) => toast.error(e.message || t('toast.error')),
  })

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const r = await fetch(`/api/hero-slides/${id}`, { method: 'DELETE' })
      if (!r.ok) throw new Error('failed')
      return r.json()
    },
    onSuccess: () => {
      toast.success(t('hero.deleted'))
      qc.invalidateQueries({ queryKey: ['hero-slides'] })
      setDeleteSlide(null)
    },
    onError: (e: any) => toast.error(e.message || t('toast.error')),
  })

  const toggleActive = (s: Slide) => {
    updateMut.mutate({ id: s.id, data: { active: !s.active } })
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('hero.title')}</h1>
          <p className="text-sm text-muted-foreground">{t('hero.subtitle')}</p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="gap-1.5 bg-emerald-600 hover:bg-emerald-700">
          <Plus className="h-4 w-4" />
          {t('hero.add')}
        </Button>
      </div>

      {q.isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
        </div>
      ) : slides.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Images className="h-10 w-10 mx-auto mb-3 opacity-40" />
          {t('hero.empty')}
        </div>
      ) : (
        <div className="space-y-3">
          {slides.map((s, i) => (
            <Card key={s.id} className={cn('border-slate-200 group', !s.active && 'opacity-60')}>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="flex flex-col items-center gap-1 text-muted-foreground">
                  <GripVertical className="h-4 w-4" />
                  <span className="text-xs font-mono">{i + 1}</span>
                </div>
                <div className="h-20 w-32 rounded-lg bg-gradient-to-br from-amber-100 to-rose-100 flex items-center justify-center shrink-0 overflow-hidden">
                  {s.image ? (
                    <img src={s.image} alt={s.title} className="w-full h-full object-cover" />
                  ) : (
                    <Image className="h-10 w-10 text-muted-foreground/40" alt="" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium truncate">{s.title}</span>
                    {!s.active && <Badge variant="secondary" className="text-[10px]">hidden</Badge>}
                  </div>
                  {s.subtitle && <div className="text-sm text-muted-foreground truncate">{s.subtitle}</div>}
                  <div className="mt-1 text-xs text-muted-foreground">
                    Button: <span className="font-medium">{s.ctaText}</span> → <span className="font-mono">{s.ctaLink}</span>
                  </div>
                </div>
                <div className="flex flex-col gap-1 items-end">
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setEditSlide(s)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-rose-600 hover:text-rose-700" onClick={() => setDeleteSlide(s)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Switch checked={s.active} onCheckedChange={() => toggleActive(s)} className="scale-75" />
                    <span className="text-[10px] text-muted-foreground">{s.active ? 'on' : 'off'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <SlideFormDialog
        key={`create-${createOpen}`}
        open={createOpen}
        onOpenChange={(o) => { if (!o) setCreateOpen(false) }}
        submitting={createMut.isPending}
        onSubmit={(data) => createMut.mutate(data)}
        title={t('hero.add')}
      />
      <SlideFormDialog
        key={`edit-${editSlide?.id ?? 'none'}`}
        open={!!editSlide}
        onOpenChange={(o) => { if (!o) setEditSlide(null) }}
        initial={editSlide || undefined}
        submitting={updateMut.isPending}
        onSubmit={(data) => editSlide && updateMut.mutate({ id: editSlide.id, data })}
        title={t('hero.edit')}
      />

      <AlertDialog open={!!deleteSlide} onOpenChange={(o) => !o && setDeleteSlide(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('hero.deleteConfirm')}</AlertDialogTitle>
            <AlertDialogDescription>{deleteSlide?.title}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMut.isPending}>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteSlide && deleteMut.mutate(deleteSlide.id)}
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

function SlideFormDialog({
  open, onOpenChange, initial, submitting, onSubmit, title,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  initial?: Slide
  submitting: boolean
  onSubmit: (data: any) => void
  title: string
}) {
  const { t } = useI18n()
  const [titleField, setTitleField] = useState({
    en: initial?.title || '',
    ar: initial?.titleAr || '',
    he: initial?.titleHe || '',
  })
  const [subtitle, setSubtitle] = useState({
    en: initial?.subtitle || '',
    ar: initial?.subtitleAr || '',
    he: initial?.subtitleHe || '',
  })
  const [image, setImage] = useState(initial?.image || '')
  const [ctaText, setCtaText] = useState(initial?.ctaText || 'Shop Now')
  const [ctaLink, setCtaLink] = useState(initial?.ctaLink || '#')
  const [order, setOrder] = useState(initial ? String(initial.order) : '0')
  const [active, setActive] = useState(initial?.active ?? true)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!titleField.en) {
      toast.error(t('common.required'))
      return
    }
    onSubmit({
      title: titleField.en,
      titleAr: titleField.ar || undefined,
      titleHe: titleField.he || undefined,
      subtitle: subtitle.en || undefined,
      subtitleAr: subtitle.ar || undefined,
      subtitleHe: subtitle.he || undefined,
      image,
      ctaText,
      ctaLink,
      order: Number(order || 0),
      active,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{t('hero.subtitle')}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Image upload */}
          <ImageUpload
            value={image}
            onChange={setImage}
            label={t('hero.image_emoji')}
            aspectRatio="16/9"
          />

          <MultiLanguageInput
            label={t('hero.title_field')}
            field="title"
            values={titleField}
            onChange={setTitleField}
            required
            placeholder="e.g. Summer Collection 2026"
          />
          <MultiLanguageInput
            label={t('hero.subtitle_field')}
            field="subtitle"
            values={subtitle}
            onChange={setSubtitle}
            placeholder="e.g. Up to 30% off hand-picked pieces"
          />
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="s-cta">{t('hero.ctaText')}</Label>
              <Input id="s-cta" value={ctaText} onChange={(e) => setCtaText(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="s-link">{t('hero.ctaLink')}</Label>
              <Input id="s-link" value={ctaLink} onChange={(e) => setCtaLink(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="s-order">{t('hero.order')}</Label>
              <Input id="s-order" type="number" min="0" value={order} onChange={(e) => setOrder(e.target.value)} />
            </div>
            <div className="flex items-end pb-2">
              <div className="flex items-center gap-2">
                <Switch id="s-active" checked={active} onCheckedChange={setActive} />
                <Label htmlFor="s-active" className="text-sm">{t('hero.active')}</Label>
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

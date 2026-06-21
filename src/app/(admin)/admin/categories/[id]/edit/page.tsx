'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useI18n } from '@/hooks/use-i18n'
import { toast } from 'sonner'
import { DashboardShell, NavItem } from '@/components/dashboard-shell'
import { Package, FolderTree, Images, Palette, MessageCircle, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MultiLanguageInput } from '@/components/admin/multi-language-input'
import { ImageUpload } from '@/components/admin/image-upload'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowLeft, Loader2, Trash2 } from 'lucide-react'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

type Category = {
  id: string
  name: string
  nameAr: string | null
  nameHe: string | null
  image: string | null
}

export default function EditCategoryPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session } = useSession()
  const { t } = useI18n()
  const qc = useQueryClient()
  const categoryId = params.id as string

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
  const [image, setImage] = useState('')
  const [deleteOpen, setDeleteOpen] = useState(false)

  // Fetch category
  const categoryQ = useQuery<{ category: Category }>({
    queryKey: ['category', categoryId],
    queryFn: async () => {
      const r = await fetch(`/api/categories/${categoryId}`)
      if (!r.ok) throw new Error('Failed to fetch category')
      return r.json()
    },
    enabled: !!categoryId,
  })

  const category = categoryQ.data?.category

  // Populate form when category loads
  useEffect(() => {
    if (category) {
      setName({ en: category.name || '', ar: category.nameAr || '', he: category.nameHe || '' })
      setImage(category.image || '')
    }
  }, [category])

  const updateMut = useMutation({
    mutationFn: async (data: any) => {
      const r = await fetch(`/api/categories/${categoryId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const j = await r.json()
      if (!r.ok) throw new Error(j.error || 'failed')
      return j
    },
    onSuccess: () => {
      toast.success(t('categories.updated'))
      qc.invalidateQueries({ queryKey: ['categories'] })
      qc.invalidateQueries({ queryKey: ['category', categoryId] })
      router.push(getBackUrl())
    },
    onError: (e: any) => toast.error(e.message || t('toast.error')),
  })

  const deleteMut = useMutation({
    mutationFn: async () => {
      const r = await fetch(`/api/categories/${categoryId}`, { method: 'DELETE' })
      if (!r.ok) throw new Error('failed')
      return r.json()
    },
    onSuccess: () => {
      toast.success(t('categories.deleted'))
      qc.invalidateQueries({ queryKey: ['categories'] })
      qc.invalidateQueries({ queryKey: ['products'] })
      router.push(getBackUrl())
    },
    onError: (e: any) => toast.error(e.message || t('toast.error')),
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.en) {
      toast.error(t('common.required'))
      return
    }
    updateMut.mutate({
      name: name.en,
      nameAr: name.ar || undefined,
      nameHe: name.he || undefined,
      image: image || undefined,
    })
  }

  const renderContent = () => {
    if (categoryQ.isLoading) {
      return (
        <div className="max-w-3xl mx-auto space-y-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-96" />
        </div>
      )
    }

    if (!category) {
      return (
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">{t('categories.notFound')}</p>
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
                <h1 className="text-2xl font-bold tracking-tight">{t('categories.edit')}</h1>
                <p className="text-sm text-muted-foreground">{category.name}</p>
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
                  <AlertDialogTitle>{t('categories.deleteConfirm')}</AlertDialogTitle>
                  <AlertDialogDescription>{category.name}</AlertDialogDescription>
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
                <CardTitle>{t('categories.details')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <ImageUpload
                  value={image}
                  onChange={setImage}
                  label={t('common.image')}
                  aspectRatio="1/1"
                />

                <MultiLanguageInput
                  label={t('common.name')}
                  field="name"
                  values={name}
                  onChange={setName}
                  required
                  placeholder="e.g. Living Room"
                />

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
      activeKey="categories"
      onChange={(key) => {
        if (key !== 'categories') {
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

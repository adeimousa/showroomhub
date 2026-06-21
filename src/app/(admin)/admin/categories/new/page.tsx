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
import { MultiLanguageInput } from '@/components/admin/multi-language-input'
import { ImageUpload } from '@/components/admin/image-upload'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Loader2 } from 'lucide-react'

export default function NewCategoryPage() {
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
  const [image, setImage] = useState('')

  const createMut = useMutation({
    mutationFn: async (data: any) => {
      const r = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const j = await r.json()
      if (!r.ok) throw new Error(j.error || 'failed')
      return j
    },
    onSuccess: () => {
      toast.success(t('categories.created'))
      qc.invalidateQueries({ queryKey: ['categories'] })
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
    createMut.mutate({
      name: name.en,
      nameAr: name.ar || undefined,
      nameHe: name.he || undefined,
      image: image || undefined,
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
              <h1 className="text-2xl font-bold tracking-tight">{t('categories.add')}</h1>
              <p className="text-sm text-muted-foreground">Create a new category</p>
            </div>
          </div>
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

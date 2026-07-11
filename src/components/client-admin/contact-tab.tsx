'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useI18n } from '@/hooks/use-i18n'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Save, Loader2, MessageCircle, CheckCircle2, AlertCircle, Phone, Mail, Facebook, Instagram } from 'lucide-react'

type Tenant = {
  id: string
  name: string
  slug: string
  phone: string | null
  whatsappNumber: string | null
  facebookUrl: string | null
  instagramUrl: string | null
}

export function ContactTab() {
  const { t } = useI18n()
  const qc = useQueryClient()

  const tenantQ = useQuery<{ tenants: Tenant[] }>({
    queryKey: ['my-tenant'],
    queryFn: async () => {
      const r = await fetch('/api/tenants')
      if (!r.ok) throw new Error('failed')
      return r.json()
    },
  })

  const tenant = tenantQ.data?.tenants?.[0]

  const [whatsappNumber, setWhatsappNumber] = useState(tenant?.whatsappNumber || '')
  const [phone, setPhone] = useState(tenant?.phone || '')
  const [facebookUrl, setFacebookUrl] = useState(tenant?.facebookUrl || '')
  const [instagramUrl, setInstagramUrl] = useState(tenant?.instagramUrl || '')
  const [initialized, setInitialized] = useState(false)

  if (tenant && !initialized) {
    setWhatsappNumber(tenant.whatsappNumber || '')
    setPhone(tenant.phone || '')
    setFacebookUrl(tenant.facebookUrl || '')
    setInstagramUrl(tenant.instagramUrl || '')
    setInitialized(true)
  }

  const saveMut = useMutation({
    mutationFn: async (data: any) => {
      const r = await fetch(`/api/tenants/${tenant!.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
      const j = await r.json()
      if (!r.ok) throw new Error(j.error || 'failed')
      return j
    },
    onSuccess: () => {
      toast.success(t('contact.saved'))
      qc.invalidateQueries({ queryKey: ['my-tenant'] })
    },
    onError: (e: any) => toast.error(e.message || t('toast.error')),
  })

  const handleSave = () => {
    saveMut.mutate({
      whatsappNumber: whatsappNumber || null,
      phone: phone || null,
      facebookUrl: facebookUrl.trim() || null,
      instagramUrl: instagramUrl.trim() || null,
    })
  }

  if (tenantQ.isLoading) return <Skeleton className="h-96 rounded-xl" />
  if (!tenant) return <div className="text-center py-12 text-muted-foreground">No tenant on this account.</div>

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t('contact.title')}</h1>
        <p className="text-sm text-muted-foreground">{t('contact.subtitle')}</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Main form */}
        <Card className="lg:col-span-2 border-slate-200">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-emerald-600" />
              {t('contact.whatsappSection')}
            </CardTitle>
            <CardDescription>
              {t('contact.whatsappNumberHint')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="wa-number">{t('contact.whatsappNumber')}</Label>
              <div className="flex gap-2">
                <div className="flex items-center px-3 rounded-md border border-slate-200 bg-slate-50 text-sm text-muted-foreground">
                  +
                </div>
                <Input
                  id="wa-number"
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="972501234567"
                  inputMode="numeric"
                  className="font-mono"
                />
              </div>
              <p className="text-[10px] text-muted-foreground">{t('contact.whatsappNumberHint')}</p>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              <Button onClick={handleSave} disabled={saveMut.isPending} className="gap-1.5 bg-emerald-600 hover:bg-emerald-700">
                {saveMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {t('contact.save')}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Right column — status + contact info */}
        <div className="space-y-4">
          <Card className="border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                {t('contact.configured')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">WhatsApp</span>
                {whatsappNumber ? (
                  <Badge variant="outline" className="text-emerald-700 border-emerald-300 bg-emerald-50">
                    +{whatsappNumber}
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-amber-700 border-amber-300 bg-amber-50">
                    {t('contact.notConfigured')}
                  </Badge>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t('contact.phoneSection')}</span>
                <span className="font-medium text-xs truncate max-w-[160px]">{phone || '—'}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Phone className="h-4 w-4" />
                {t('contact.phoneSection')}
              </CardTitle>
              <CardDescription>{t('contact.phoneHint')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+972-50-123-4567" />
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Instagram className="h-4 w-4" />
                {t('contact.socialSection')}
              </CardTitle>
              <CardDescription>{t('contact.socialHint')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="facebook-url" className="flex items-center gap-1.5">
                  <Facebook className="h-3.5 w-3.5" />
                  {t('contact.facebook')}
                </Label>
                <Input
                  id="facebook-url"
                  value={facebookUrl}
                  onChange={(e) => setFacebookUrl(e.target.value)}
                  placeholder="https://facebook.com/yourpage"
                  inputMode="url"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="instagram-url" className="flex items-center gap-1.5">
                  <Instagram className="h-3.5 w-3.5" />
                  {t('contact.instagram')}
                </Label>
                <Input
                  id="instagram-url"
                  value={instagramUrl}
                  onChange={(e) => setInstagramUrl(e.target.value)}
                  placeholder="https://instagram.com/yourhandle"
                  inputMode="url"
                />
              </div>
              <Button onClick={handleSave} disabled={saveMut.isPending} variant="outline" className="gap-1.5 w-full">
                {saveMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {t('contact.save')}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

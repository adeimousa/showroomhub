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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Save, Loader2, MessageCircle, CheckCircle2, AlertCircle, ExternalLink, Phone, Mail } from 'lucide-react'

type Tenant = {
  id: string
  name: string
  slug: string
  email: string
  phone: string | null
  whatsappNumber: string | null
  whatsappPrefill: string | null
  whatsappPrefillAr: string | null
  whatsappPrefillHe: string | null
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
  const [whatsappPrefill, setWhatsappPrefill] = useState(tenant?.whatsappPrefill || '')
  const [whatsappPrefillAr, setWhatsappPrefillAr] = useState(tenant?.whatsappPrefillAr || '')
  const [whatsappPrefillHe, setWhatsappPrefillHe] = useState(tenant?.whatsappPrefillHe || '')
  const [email, setEmail] = useState(tenant?.email || '')
  const [phone, setPhone] = useState(tenant?.phone || '')
  const [initialized, setInitialized] = useState(false)

  if (tenant && !initialized) {
    setWhatsappNumber(tenant.whatsappNumber || '')
    setWhatsappPrefill(tenant.whatsappPrefill || '')
    setWhatsappPrefillAr(tenant.whatsappPrefillAr || '')
    setWhatsappPrefillHe(tenant.whatsappPrefillHe || '')
    setEmail(tenant.email || '')
    setPhone(tenant.phone || '')
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
      whatsappPrefill: whatsappPrefill || null,
      whatsappPrefillAr: whatsappPrefillAr || null,
      whatsappPrefillHe: whatsappPrefillHe || null,
      email,
      phone: phone || null,
    })
  }

  const handleTest = () => {
    if (!whatsappNumber) {
      toast.error(t('cart.noWhatsapp'))
      return
    }
    const msg = whatsappPrefill || 'Test message from ShowroomHub'
    window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(msg)}`, '_blank')
    toast.success(t('cart.whatsappOpened'))
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

            <div className="space-y-1.5">
              <Label>{t('contact.whatsappPrefill')}</Label>
              <Tabs defaultValue="en" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="en">English</TabsTrigger>
                  <TabsTrigger value="ar">العربية</TabsTrigger>
                  <TabsTrigger value="he">עברית</TabsTrigger>
                </TabsList>
                <TabsContent value="en" className="space-y-2">
                  <Input
                    id="wa-pre-en"
                    value={whatsappPrefill}
                    onChange={(e) => setWhatsappPrefill(e.target.value)}
                    placeholder="Hi! I'd like to order:"
                  />
                  <div className="p-3 rounded-lg bg-emerald-50/50 border border-emerald-100">
                    <div className="text-xs text-muted-foreground mb-1">{t('cart.preview')} (English)</div>
                    <div className="text-sm whitespace-pre-line font-mono">
                      {whatsappPrefill || '(no intro set)'}
                      {'\n\n'}
                      <span className="text-muted-500">— cart items will be appended here —</span>
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="ar" className="space-y-2">
                  <Input
                    id="wa-pre-ar"
                    value={whatsappPrefillAr}
                    onChange={(e) => setWhatsappPrefillAr(e.target.value)}
                    placeholder="مرحباً! أود الطلب:"
                    dir="rtl"
                  />
                  <div className="p-3 rounded-lg bg-emerald-50/50 border border-emerald-100">
                    <div className="text-xs text-muted-foreground mb-1">{t('cart.preview')} (العربية)</div>
                    <div className="text-sm whitespace-pre-line font-mono" dir="rtl">
                      {whatsappPrefillAr || '(no intro set)'}
                      {'\n\n'}
                      <span className="text-muted-500">— سيتم إضافة عناصر السلة هنا —</span>
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="he" className="space-y-2">
                  <Input
                    id="wa-pre-he"
                    value={whatsappPrefillHe}
                    onChange={(e) => setWhatsappPrefillHe(e.target.value)}
                    placeholder="!שלום! אני רוצה להזמין"
                    dir="rtl"
                  />
                  <div className="p-3 rounded-lg bg-emerald-50/50 border border-emerald-100">
                    <div className="text-xs text-muted-foreground mb-1">{t('cart.preview')} (עברית)</div>
                    <div className="text-sm whitespace-pre-line font-mono" dir="rtl">
                      {whatsappPrefillHe || '(no intro set)'}
                      {'\n\n'}
                      <span className="text-muted-500">— פריטי העגלה יתווספו כאן —</span>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
              <p className="text-[10px] text-muted-foreground">{t('contact.whatsappPrefillHint')}</p>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              <Button onClick={handleSave} disabled={saveMut.isPending} className="gap-1.5 bg-emerald-600 hover:bg-emerald-700">
                {saveMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {t('contact.save')}
              </Button>
              <Button onClick={handleTest} variant="outline" className="gap-1.5" disabled={!whatsappNumber}>
                <ExternalLink className="h-4 w-4" />
                {t('contact.testNumber')}
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
                <span className="text-muted-foreground">{t('contact.emailSection')}</span>
                <span className="font-medium text-xs truncate max-w-[160px]">{email || '—'}</span>
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
                <Mail className="h-4 w-4" />
                {t('contact.emailSection')}
              </CardTitle>
              <CardDescription>{t('contact.emailHint')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" />
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
        </div>
      </div>
    </div>
  )
}

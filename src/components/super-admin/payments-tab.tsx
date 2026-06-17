'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useI18n } from '@/hooks/use-i18n'
import { toast } from 'sonner'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { MoreVertical, CheckCircle2, AlertTriangle, Clock, Trash2, DollarSign, Loader2, CreditCard } from 'lucide-react'
import { cn } from '@/lib/utils'

type Payment = {
  id: string
  amount: number
  currency: string
  period: string
  status: string
  method: string | null
  invoiceNo: string | null
  paidAt: string | null
  dueDate: string | null
  createdAt: string
  tenant: { id: string; name: string; slug: string; plan: string; email: string }
}

const STATUSES = ['PAID', 'PENDING', 'OVERDUE']
const METHODS  = ['CARD', 'BANK', 'PAYPAL']

export function PaymentsTab() {
  const { t, lang } = useI18n()
  const qc = useQueryClient()
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [search, setSearch] = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const q = useQuery<{ payments: Payment[] }>({
    queryKey: ['payments'],
    queryFn: async () => {
      const r = await fetch('/api/payments')
      if (!r.ok) throw new Error('failed')
      return r.json()
    },
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const r = await fetch(`/api/payments/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
      const j = await r.json()
      if (!r.ok) throw new Error(j.error || 'failed')
      return j
    },
    onSuccess: (_d, vars) => {
      toast.success(vars.data.status === 'PAID' ? t('payments.markedPaid') : t('payments.markedOverdue'))
      qc.invalidateQueries({ queryKey: ['payments'] })
    },
    onError: (e: any) => toast.error(e.message || t('toast.error')),
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const r = await fetch(`/api/payments/${id}`, { method: 'DELETE' })
      if (!r.ok) throw new Error('failed')
      return r.json()
    },
    onSuccess: () => {
      toast.success(t('payments.deleted'))
      qc.invalidateQueries({ queryKey: ['payments'] })
      setDeleteId(null)
    },
    onError: (e: any) => toast.error(e.message || t('toast.error')),
  })

  const payments = q.data?.payments ?? []

  const filtered = payments.filter((p) => {
    const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter
    const matchesSearch = !search ||
      p.tenant.name.toLowerCase().includes(search.toLowerCase()) ||
      p.invoiceNo?.toLowerCase().includes(search.toLowerCase()) ||
      p.period.includes(search)
    return matchesStatus && matchesSearch
  })

  const collected = payments.filter((p) => p.status === 'PAID').reduce((s, p) => s + p.amount, 0)
  const outstanding = payments.filter((p) => p.status !== 'PAID').reduce((s, p) => s + p.amount, 0)

  const fmtDate = (s: string | null) => s ? new Date(s).toLocaleDateString(lang === 'ar' ? 'ar-EG' : lang === 'he' ? 'he-IL' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'

  const statusBadge = (status: string) => {
    const cls = status === 'PAID'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
      : status === 'OVERDUE'
      ? 'border-rose-200 bg-rose-50 text-rose-700'
      : 'border-amber-200 bg-amber-50 text-amber-700'
    return (
      <Badge variant="outline" className={cn('text-[10px]', cls)}>
        {t(`payments.${status.toLowerCase()}` as any)}
      </Badge>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t('payments.title')}</h1>
        <p className="text-sm text-muted-foreground">{t('payments.subtitle')}</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="border-slate-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <DollarSign className="h-3.5 w-3.5" />
              {t('payments.totalCollected')}
            </div>
            <div className="text-xl font-bold text-emerald-700">${collected.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <AlertTriangle className="h-3.5 w-3.5" />
              {t('payments.totalOutstanding')}
            </div>
            <div className="text-xl font-bold text-rose-700">${outstanding.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <CheckCircle2 className="h-3.5 w-3.5" />
              {t('payments.paid')}
            </div>
            <div className="text-xl font-bold">{payments.filter((p) => p.status === 'PAID').length}</div>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <Clock className="h-3.5 w-3.5" />
              {t('payments.pending')}
            </div>
            <div className="text-xl font-bold">{payments.filter((p) => p.status === 'PENDING').length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <Input
          placeholder={t('common.search')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">{t('common.all')}</SelectItem>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s}>{t(`payments.${s.toLowerCase()}` as any)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card className="border-slate-200">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr className="text-left text-xs text-muted-foreground">
                  <th className="px-4 py-3 font-medium">{t('payments.invoice')}</th>
                  <th className="px-4 py-3 font-medium">{t('nav.tenants')}</th>
                  <th className="px-4 py-3 font-medium">{t('payments.period')}</th>
                  <th className="px-4 py-3 font-medium">{t('payments.amount')}</th>
                  <th className="px-4 py-3 font-medium">{t('payments.method')}</th>
                  <th className="px-4 py-3 font-medium">{t('common.status')}</th>
                  <th className="px-4 py-3 font-medium hidden md:table-cell">Paid / Due</th>
                  <th className="px-4 py-3 font-medium text-right">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {q.isLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i} className="border-b border-slate-100">
                      <td colSpan={8} className="px-4 py-3"><Skeleton className="h-8" /></td>
                    </tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">
                      <CreditCard className="h-8 w-8 mx-auto mb-2 opacity-40" />
                      {t('common.noResults')}
                    </td>
                  </tr>
                ) : (
                  filtered.map((p) => (
                    <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                      <td className="px-4 py-3 font-mono text-xs">{p.invoiceNo || '—'}</td>
                      <td className="px-4 py-3">
                        <div className="font-medium">{p.tenant.name}</div>
                        <div className="text-xs text-muted-foreground">{p.tenant.email}</div>
                      </td>
                      <td className="px-4 py-3">{p.period}</td>
                      <td className="px-4 py-3 font-medium">${p.amount.toLocaleString()} <span className="text-xs text-muted-foreground">{p.currency}</span></td>
                      <td className="px-4 py-3">
                        {p.method ? (
                          <Badge variant="secondary" className="text-[10px]">{t(`payments.method.${p.method}` as any)}</Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">{t('common.none')}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">{statusBadge(p.status)}</td>
                      <td className="px-4 py-3 hidden md:table-cell text-xs text-muted-foreground">
                        {p.status === 'PAID' ? fmtDate(p.paidAt) : fmtDate(p.dueDate)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            {p.status !== 'PAID' && (
                              <DropdownMenuItem
                                onClick={() => updateMutation.mutate({ id: p.id, data: { status: 'PAID', method: p.method || 'CARD' } })}
                              >
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                {t('payments.markPaid')}
                              </DropdownMenuItem>
                            )}
                            {p.status !== 'OVERDUE' && (
                              <DropdownMenuItem
                                onClick={() => updateMutation.mutate({ id: p.id, data: { status: 'OVERDUE' } })}
                              >
                                <AlertTriangle className="h-3.5 w-3.5" />
                                {t('payments.markOverdue')}
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => setDeleteId(p.id)}
                              className="text-rose-600 focus:text-rose-700"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              {t('common.delete')}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('common.delete')}</AlertDialogTitle>
            <AlertDialogDescription>{t('payments.delete')}?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              disabled={deleteMutation.isPending}
              className="bg-rose-600 hover:bg-rose-700"
            >
              {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

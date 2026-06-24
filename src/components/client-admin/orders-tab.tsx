'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useI18n } from '@/hooks/use-i18n'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { Search, MoreVertical, Eye, Package, Loader2, Clock, CheckCircle, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

type OrderItem = {
  id: string
  productName: string
  productSku: string | null
  price: number
  quantity: number
  total: number
}

type Order = {
  id: string
  orderNumber: string
  customerName: string | null
  customerPhone: string
  status: string
  total: number
  notes: string | null
  createdAt: string
  items: OrderItem[]
}

const ORDER_STATUSES = ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED']

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'PENDING':
      return <Clock className="h-3 w-3" />
    case 'CONFIRMED':
    case 'COMPLETED':
      return <CheckCircle className="h-3 w-3" />
    case 'CANCELLED':
      return <XCircle className="h-3 w-3" />
    default:
      return <Package className="h-3 w-3" />
  }
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'PENDING':
      return 'bg-amber-100 text-amber-800 border-amber-200'
    case 'CONFIRMED':
      return 'bg-blue-100 text-blue-800 border-blue-200'
    case 'COMPLETED':
      return 'bg-emerald-100 text-emerald-800 border-emerald-200'
    case 'CANCELLED':
      return 'bg-rose-100 text-rose-800 border-rose-200'
    default:
      return 'bg-slate-100 text-slate-800 border-slate-200'
  }
}

export function OrdersTab() {
  const { t, lang } = useI18n()
  const router = useRouter()
  const searchParams = useSearchParams()
  const qc = useQueryClient()
  const { data: session } = useSession()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')

  const tenantId = (session?.user as any)?.tenantId

  // Helper to preserve search params (like ?host=)
  const getOrderUrl = (orderId: string) => {
    const params = new URLSearchParams(searchParams.toString())
    return `/admin/orders/${orderId}${params.toString() ? `?${params.toString()}` : ''}`
  }

  const ordersQ = useQuery<{ orders: Order[] }>({
    queryKey: ['orders', tenantId],
    queryFn: async () => {
      if (!tenantId) throw new Error('No tenant ID')
      const r = await fetch(`/api/orders?tenantId=${tenantId}`)
      if (!r.ok) throw new Error('Failed to fetch orders')
      return r.json()
    },
    enabled: !!tenantId,
  })

  const updateStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
      const r = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!r.ok) throw new Error('Failed to update order')
      return r.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['orders'] })
      toast.success(t('orders.statusUpdated'))
    },
    onError: () => {
      toast.error(t('toast.error'))
    },
  })

  const orders = ordersQ.data?.orders || []

  // Filter orders
  const filtered = orders.filter((o) => {
    const matchesSearch =
      !search ||
      o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      o.customerName?.toLowerCase().includes(search.toLowerCase()) ||
      o.customerPhone.includes(search)
    const matchesStatus = statusFilter === 'ALL' || o.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const isLoading = ordersQ.isLoading

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">{t('orders.title')}</h2>
          <p className="text-sm text-muted-foreground">{t('orders.subtitle')}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('orders.search')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">{t('common.all')}</SelectItem>
            {ORDER_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {t(`orders.status.${s.toLowerCase()}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 mb-3">
                <Package className="h-8 w-8 text-slate-400" />
              </div>
              <h3 className="font-medium text-sm mb-1">{t('orders.empty')}</h3>
              <p className="text-xs text-muted-foreground">{t('orders.emptyMsg')}</p>
            </div>
          ) : (
            <div className="divide-y">
              {filtered.map((order) => (
                <div
                  key={order.id}
                  className="p-4 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-sm font-semibold">
                          {order.orderNumber}
                        </span>
                        <Badge
                          variant="outline"
                          className={cn('text-[10px] gap-1', getStatusColor(order.status))}
                        >
                          {getStatusIcon(order.status)}
                          {t(`orders.status.${order.status.toLowerCase()}`)}
                        </Badge>
                      </div>
                      <div className="text-sm space-y-0.5">
                        <div className="text-muted-foreground">
                          {order.customerName || t('orders.noName')} · {order.customerPhone}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {order.items.length} {order.items.length === 1 ? t('cart.item') : t('cart.items')} · ₪{order.total.toLocaleString()}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(order.createdAt).toLocaleDateString(lang, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </div>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => router.push(getOrderUrl(order.id))}>
                          <Eye className="h-4 w-4 mr-2" />
                          {t('orders.viewDetails')}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {ORDER_STATUSES.filter((s) => s !== order.status).map((status) => (
                          <DropdownMenuItem
                            key={status}
                            onClick={() =>
                              updateStatusMutation.mutate({ orderId: order.id, status })
                            }
                            disabled={updateStatusMutation.isPending}
                          >
                            {getStatusIcon(status)}
                            <span className="ml-2">
                              {t('orders.markAs')} {t(`orders.status.${status.toLowerCase()}`)}
                            </span>
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats */}
      {!isLoading && orders.length > 0 && (
        <div className="text-xs text-muted-foreground text-center">
          {t('common.showing')} {filtered.length} {t('common.of')} {orders.length} {t('orders.orders')}
        </div>
      )}
    </div>
  )
}

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { useI18n } from '@/hooks/use-i18n'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { ArrowLeft, Clock, CheckCircle, XCircle, Phone, User, Package, Loader2, Trash2, Plus, Minus, PlusCircle, Save } from 'lucide-react'
import { cn } from '@/lib/utils'

type OrderItem = {
  id: string
  productName: string
  productSku: string | null
  price: number
  quantity: number
  total: number
  notes: string | null
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
  updatedAt: string
  items: OrderItem[]
  tenant: {
    id: string
    name: string
    slug: string
  }
}

const ORDER_STATUSES = ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED']

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'PENDING':
      return <Clock className="h-4 w-4" />
    case 'CONFIRMED':
    case 'COMPLETED':
      return <CheckCircle className="h-4 w-4" />
    case 'CANCELLED':
      return <XCircle className="h-4 w-4" />
    default:
      return <Package className="h-4 w-4" />
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

export function OrderDetailClient({ order: initialOrder }: { order: Order }) {
  const { t, lang } = useI18n()
  const router = useRouter()
  const qc = useQueryClient()
  const [status, setStatus] = useState(initialOrder.status)
  const [notes, setNotes] = useState(initialOrder.notes || '')
  const [customerName, setCustomerName] = useState(initialOrder.customerName || '')
  const [customerPhone, setCustomerPhone] = useState(initialOrder.customerPhone || '')
  const [hasChanges, setHasChanges] = useState(false)
  const [deleteItemId, setDeleteItemId] = useState<string | null>(null)
  const [showAddItem, setShowAddItem] = useState(false)

  // Fetch latest order data
  const orderQ = useQuery<{ order: Order }>({
    queryKey: ['order', initialOrder.id],
    queryFn: async () => {
      const r = await fetch(`/api/orders/${initialOrder.id}`)
      if (!r.ok) throw new Error('Failed to fetch order')
      return r.json()
    },
    initialData: { order: initialOrder },
  })

  const currentOrder = orderQ.data?.order || initialOrder

  const updateOrderMutation = useMutation({
    mutationFn: async () => {
      const r = await fetch(`/api/orders/${initialOrder.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          notes,
          customerName: customerName.trim() || null,
          customerPhone: customerPhone.trim() || null,
        }),
      })
      if (!r.ok) throw new Error('Failed to update order')
      return r.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['order', initialOrder.id] })
      qc.invalidateQueries({ queryKey: ['orders'] })
      setHasChanges(false)
      toast.success(t('orders.updated'))
    },
    onError: () => {
      toast.error(t('toast.error'))
    },
  })

  const updateItemMutation = useMutation({
    mutationFn: async ({ itemId, data }: { itemId: string; data: any }) => {
      const r = await fetch(`/api/orders/${initialOrder.id}/items/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!r.ok) throw new Error('Failed to update item')
      return r.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['order', initialOrder.id] })
      toast.success(t('orders.itemUpdated'))
    },
    onError: () => {
      toast.error(t('toast.error'))
    },
  })

  const deleteItemMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const r = await fetch(`/api/orders/${initialOrder.id}/items/${itemId}`, {
        method: 'DELETE',
      })
      if (!r.ok) {
        const data = await r.json()
        throw new Error(data.error || 'Failed to delete item')
      }
      return r.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['order', initialOrder.id] })
      toast.success(t('orders.itemDeleted'))
      setDeleteItemId(null)
    },
    onError: (error: Error) => {
      toast.error(error.message || t('toast.error'))
      setDeleteItemId(null)
    },
  })

  const handleStatusChange = (newStatus: string) => {
    setStatus(newStatus)
    setHasChanges(true)
  }

  const handleNotesChange = (newNotes: string) => {
    setNotes(newNotes)
    setHasChanges(true)
  }

  const handleSaveOrder = () => {
    updateOrderMutation.mutate()
  }

  const handleUpdateItemQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) return
    updateItemMutation.mutate({ itemId, data: { quantity: newQuantity } })
  }

  const handleUpdateItemNotes = (itemId: string, itemNotes: string) => {
    updateItemMutation.mutate({ itemId, data: { notes: itemNotes } })
  }

  const handleDeleteItem = () => {
    if (deleteItemId) {
      deleteItemMutation.mutate(deleteItemId)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="gap-1.5"
            >
              <ArrowLeft className="h-4 w-4" />
              {t('common.back')}
            </Button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                {t('orders.orderDetails')}
                <span className="text-muted-foreground font-mono text-lg">
                  {currentOrder.orderNumber}
                </span>
              </h1>
              <p className="text-sm text-muted-foreground">
                {new Date(currentOrder.createdAt).toLocaleDateString(lang, {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </div>
          {hasChanges && (
            <Button
              onClick={handleSaveOrder}
              disabled={updateOrderMutation.isPending}
              className="gap-1.5"
            >
              {updateOrderMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {t('common.save')}
            </Button>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {/* Customer Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <User className="h-4 w-4" />
                {t('orders.customerInfo')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label htmlFor="customerName" className="text-xs text-muted-foreground">
                  {t('orders.customerName')}
                </Label>
                <Input
                  id="customerName"
                  value={customerName}
                  onChange={(e) => {
                    setCustomerName(e.target.value)
                    setHasChanges(true)
                  }}
                  placeholder={t('orders.noName')}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="customerPhone" className="text-xs text-muted-foreground flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  {t('cart.customerPhone')}
                </Label>
                <Input
                  id="customerPhone"
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => {
                    setCustomerPhone(e.target.value)
                    setHasChanges(true)
                  }}
                  placeholder={t('cart.customerPhonePlaceholder')}
                  className="mt-1 font-mono text-sm"
                />
              </div>
            </CardContent>
          </Card>

          {/* Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">{t('orders.orderStatus')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Badge
                variant="outline"
                className={cn('text-sm gap-2 px-3 py-1', getStatusColor(status))}
              >
                {getStatusIcon(status)}
                {t(`orders.status.${status.toLowerCase()}`)}
              </Badge>
              <div>
                <Label htmlFor="status" className="text-xs">{t('orders.updateStatus')}</Label>
                <Select value={status} onValueChange={handleStatusChange}>
                  <SelectTrigger id="status" className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ORDER_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        <span className="flex items-center gap-2">
                          {getStatusIcon(s)}
                          {t(`orders.status.${s.toLowerCase()}`)}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Total */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">{t('orders.orderTotal')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">₪{currentOrder.total.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {currentOrder.items.length} {currentOrder.items.length === 1 ? t('cart.item') : t('cart.items')}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Items */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                {t('orders.orderItems')}
              </CardTitle>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowAddItem(true)}
                className="gap-1.5"
              >
                <PlusCircle className="h-4 w-4" />
                {t('orders.addItem')}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {currentOrder.items.map((item) => (
                <OrderItemRow
                  key={item.id}
                  item={item}
                  orderId={currentOrder.id}
                  onUpdateQuantity={handleUpdateItemQuantity}
                  onUpdateNotes={handleUpdateItemNotes}
                  onDelete={() => setDeleteItemId(item.id)}
                  isUpdating={updateItemMutation.isPending}
                  t={t}
                />
              ))}
              <div className="pt-3 flex items-center justify-between font-bold text-lg">
                <span>{t('cart.subtotal')}</span>
                <span>₪{currentOrder.total.toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">{t('orders.notes')}</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={notes}
              onChange={(e) => handleNotesChange(e.target.value)}
              placeholder={t('orders.notesPlaceholder')}
              rows={4}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground mt-2">
              {t('orders.notesHint')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Delete Item Dialog */}
      <AlertDialog open={deleteItemId !== null} onOpenChange={() => setDeleteItemId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('orders.deleteItem')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('orders.deleteItemConfirm')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteItem}
              className="bg-rose-600 hover:bg-rose-700"
            >
              {deleteItemMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add Item Dialog */}
      <AddItemDialog
        open={showAddItem}
        onOpenChange={setShowAddItem}
        orderId={currentOrder.id}
        tenantId={currentOrder.tenant.id}
        onSuccess={() => {
          qc.invalidateQueries({ queryKey: ['order', currentOrder.id] })
          setShowAddItem(false)
        }}
        t={t}
      />
    </div>
  )
}

// Order Item Row Component
function OrderItemRow({
  item,
  orderId,
  onUpdateQuantity,
  onUpdateNotes,
  onDelete,
  isUpdating,
  t,
}: {
  item: OrderItem
  orderId: string
  onUpdateQuantity: (itemId: string, quantity: number) => void
  onUpdateNotes: (itemId: string, notes: string) => void
  onDelete: () => void
  isUpdating: boolean
  t: any
}) {
  const [editingNotes, setEditingNotes] = useState(false)
  const [itemNotes, setItemNotes] = useState(item.notes || '')

  const handleSaveNotes = () => {
    onUpdateNotes(item.id, itemNotes)
    setEditingNotes(false)
  }

  return (
    <div className="py-3 first:pt-0 last:pb-0 space-y-2">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="font-medium">{item.productName}</div>
          {item.productSku && (
            <div className="text-xs text-muted-foreground font-mono">
              {t('common.sku')}: {item.productSku}
            </div>
          )}
          <div className="text-sm text-muted-foreground mt-1">
            ₪{item.price.toLocaleString()} {t('cart.each')}
          </div>
        </div>

        {/* Quantity Controls */}
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
            disabled={isUpdating || item.quantity <= 1}
          >
            <Minus className="h-3 w-3" />
          </Button>
          <span className="w-10 text-center text-sm font-medium">{item.quantity}</span>
          <Button
            variant="outline"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
            disabled={isUpdating}
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>

        {/* Total & Delete */}
        <div className="flex items-center gap-2">
          <div className="text-right font-semibold min-w-[80px]">
            ₪{item.total.toLocaleString()}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
            onClick={onDelete}
            disabled={isUpdating}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Item Notes */}
      <div className="pl-0">
        {editingNotes ? (
          <div className="space-y-2">
            <Textarea
              value={itemNotes}
              onChange={(e) => setItemNotes(e.target.value)}
              placeholder={t('orders.itemNotesPlaceholder')}
              rows={2}
              className="text-sm resize-none"
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSaveNotes} className="gap-1.5">
                <Save className="h-3 w-3" />
                {t('common.save')}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setItemNotes(item.notes || '')
                  setEditingNotes(false)
                }}
              >
                {t('common.cancel')}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-2">
            {item.notes ? (
              <div className="flex-1 bg-slate-50 rounded px-2 py-1 text-xs text-muted-foreground">
                {item.notes}
              </div>
            ) : (
              <div className="flex-1" />
            )}
            <Button
              size="sm"
              variant="ghost"
              className="h-6 text-xs"
              onClick={() => setEditingNotes(true)}
            >
              {item.notes ? t('orders.editItemNotes') : t('orders.addItemNotes')}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

// Add Item Dialog Component
function AddItemDialog({
  open,
  onOpenChange,
  orderId,
  tenantId,
  onSuccess,
  t,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  orderId: string
  tenantId: string
  onSuccess: () => void
  t: any
}) {
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null)
  const [quantity, setQuantity] = useState('1')
  const [itemNotes, setItemNotes] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  // Fetch products
  const productsQ = useQuery({
    queryKey: ['products', tenantId],
    queryFn: async () => {
      const r = await fetch(`/api/products?tenantId=${tenantId}`)
      if (!r.ok) throw new Error('Failed to fetch products')
      return r.json()
    },
    enabled: open,
  })

  const products = productsQ.data?.products || []
  const filteredProducts = products.filter((p: any) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.sku?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const addItemMutation = useMutation({
    mutationFn: async () => {
      if (!selectedProduct) throw new Error('No product selected')

      const r = await fetch(`/api/orders/${orderId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: selectedProduct.id,
          productName: selectedProduct.name,
          productSku: selectedProduct.sku || null,
          price: selectedProduct.price,
          quantity: parseInt(quantity),
          notes: itemNotes || null,
        }),
      })
      if (!r.ok) throw new Error('Failed to add item')
      return r.json()
    },
    onSuccess: () => {
      toast.success(t('orders.itemAdded'))
      setSelectedProduct(null)
      setQuantity('1')
      setItemNotes('')
      setSearchQuery('')
      onSuccess()
    },
    onError: () => {
      toast.error(t('toast.error'))
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProduct || !quantity) return
    addItemMutation.mutate()
  }

  const handleReset = () => {
    setSelectedProduct(null)
    setQuantity('1')
    setItemNotes('')
    setSearchQuery('')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleReset}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{t('orders.addItem')}</DialogTitle>
          <DialogDescription>{t('orders.addItemDescription')}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 flex-1 overflow-y-auto">
          {/* Product Selector */}
          <div className="space-y-2">
            <Label>{t('common.search')}</Label>
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('store.searchPlaceholder')}
            />

            {productsQ.isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 max-h-[300px] overflow-y-auto p-1">
                {filteredProducts.map((product: any) => {
                  const images = JSON.parse(product.images || '[]')
                  const imageUrl = images[0] || product.image
                  const isSelected = selectedProduct?.id === product.id

                  return (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => setSelectedProduct(product)}
                      className={cn(
                        'flex gap-3 p-3 rounded-lg border-2 transition-all text-left hover:border-primary/50',
                        isSelected ? 'border-primary bg-primary/5' : 'border-border'
                      )}
                    >
                      {/* Product Image */}
                      <div className="w-16 h-16 rounded overflow-hidden bg-muted flex-shrink-0 flex items-center justify-center">
                        {imageUrl ? (
                          imageUrl.startsWith('http') ? (
                            <img
                              src={imageUrl}
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="text-3xl">{imageUrl}</div>
                          )
                        ) : (
                          <Package className="h-6 w-6 text-muted-foreground" />
                        )}
                      </div>

                      {/* Product Info */}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm line-clamp-2">{product.name}</div>
                        {product.sku && (
                          <div className="text-xs text-muted-foreground font-mono mt-0.5">
                            {product.sku}
                          </div>
                        )}
                        <div className="text-sm font-semibold mt-1">
                          ₪{product.price.toLocaleString()}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Selected Product Summary & Quantity */}
          {selectedProduct && (
            <div className="space-y-4 pt-4 border-t">
              <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
                <div className="text-sm text-muted-foreground mb-1">Selected Product</div>
                <div className="font-semibold text-lg">{selectedProduct.name}</div>
                {selectedProduct.sku && (
                  <div className="text-xs text-muted-foreground font-mono mt-1">
                    SKU: {selectedProduct.sku}
                  </div>
                )}
                <div className="text-sm font-semibold mt-2">
                  ₪{selectedProduct.price.toLocaleString()} {t('cart.each')}
                </div>
              </div>

              <div>
                <Label htmlFor="quantity">{t('product.quantity')} *</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  required
                />
                <div className="text-sm text-muted-foreground mt-2">
                  Total: ₪{(selectedProduct.price * parseInt(quantity || '1')).toLocaleString()}
                </div>
              </div>

              <div>
                <Label htmlFor="itemNotes">{t('orders.itemNotes')}</Label>
                <Textarea
                  id="itemNotes"
                  value={itemNotes}
                  onChange={(e) => setItemNotes(e.target.value)}
                  placeholder={t('orders.itemNotesPlaceholder')}
                  rows={2}
                />
              </div>
            </div>
          )}
        </form>

        <DialogFooter className="mt-4">
          <Button type="button" variant="outline" onClick={handleReset}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleSubmit} disabled={addItemMutation.isPending || !selectedProduct || !quantity}>
            {addItemMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            {t('orders.addItem')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

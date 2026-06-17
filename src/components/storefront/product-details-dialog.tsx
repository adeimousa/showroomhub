'use client'

import { useState, useEffect } from 'react'
import { useI18n } from '@/hooks/use-i18n'
import { useCartStore } from '@/hooks/use-cart'
import { buildSingleItemMessage, buildWhatsAppUrl, buildWhatsAppMessage } from '@/lib/whatsapp'
import { toast } from 'sonner'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  ShoppingCart, MessageCircle, Loader2, Plus, Minus, Star, Share, X, CheckCircle2, AlertCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'

type Product = {
  id: string
  name: string
  description: string | null
  price: number
  compareAt: number | null
  sku: string | null
  stock: number
  image: string | null
  featured: boolean
  status: string
  category: { id: string; name: string; icon: string | null } | null
}

type Props = {
  product: Product | null
  open: boolean
  onOpenChange: (o: boolean) => void
  tenant: {
    name: string
    slug: string
    whatsappNumber: string | null
    whatsappPrefill: string | null
  }
  // Localized name + description (already resolved to current language)
  loc: (obj: any, field?: string) => string
  related?: Product[]
  onSelectRelated?: (p: Product) => void
}

export function ProductDetailsDialog({
  product, open, onOpenChange, tenant, loc, related = [], onSelectRelated,
}: Props) {
  const { t, isRTL } = useI18n()
  const cartStore = useCartStore()
  const [qty, setQty] = useState(1)
  const [sendingSingle, setSendingSingle] = useState(false)
  const [sendingBuyNow, setSendingBuyNow] = useState(false)

  // Reset quantity whenever a new product is opened
  useEffect(() => {
    if (open) setQty(1)
  }, [open, product?.id])

  if (!product) return null

  const hasWhatsApp = !!tenant.whatsappNumber
  const discount = product.compareAt && product.compareAt > product.price
    ? Math.round((1 - product.price / product.compareAt) * 100)
    : 0
  const savings = product.compareAt && product.compareAt > product.price
    ? product.compareAt - product.price
    : 0
  const available = product.status === 'ACTIVE' && product.stock > 0
  const lineTotal = product.price * qty

  const handleAddToCart = () => {
    cartStore.add({
      id: product.id,
      name: loc(product),
      price: product.price,
      image: product.image,
      sku: product.sku,
    }, qty)
    toast.success(t('product.added'), { description: loc(product) })
    onOpenChange(false)
  }

  const handleSingleOrder = async () => {
    if (!hasWhatsApp) {
      toast.error(t('cart.noWhatsapp'), { description: t('cart.noWhatsappMsg') })
      return
    }
    setSendingSingle(true)
    try {
      const message = buildSingleItemMessage({
        intro: tenant.whatsappPrefill,
        tenantName: tenant.name,
        item: {
          name: loc(product),
          sku: product.sku,
          price: product.price,
          qty,
          description: loc(product, 'description'),
        },
      })
      const url = buildWhatsAppUrl(tenant.whatsappNumber!, message)
      window.open(url, '_blank')
      toast.success(t('product.singleOrderSent'), {
        description: t('product.singleOrderMsg'),
        duration: 5000,
      })
      onOpenChange(false)
    } catch (e: any) {
      toast.error(t('toast.error'))
    } finally {
      setSendingSingle(false)
    }
  }

  const handleBuyNow = async () => {
    if (!hasWhatsApp) {
      toast.error(t('cart.noWhatsapp'), { description: t('cart.noWhatsappMsg') })
      return
    }
    setSendingBuyNow(true)
    try {
      // Build the items list FIRST so the message is correct synchronously.
      // (cartStore.add triggers a React state update which won't be reflected
      // in cartStore.items until the next render — too late for this function.)
      const newItems = [
        // Existing cart items
        ...cartStore.items.map((i) => ({
          name: i.name, sku: i.sku, price: i.price, qty: i.qty,
        })),
        // The new item with the chosen quantity.
        // If the product is already in the cart, merge by summing quantities.
        ...(cartStore.items.some((i) => i.id === product.id)
          ? []
          : [{
              name: loc(product),
              sku: product.sku,
              price: product.price,
              qty,
            }]),
      ]

      // If the product was already in the cart, we need to add `qty` to its existing qty
      const finalItems = cartStore.items.some((i) => i.id === product.id)
        ? newItems.map((i) =>
            i.name === loc(product) && i.sku === product.sku
              ? { ...i, qty: i.qty + qty }
              : i
          )
        : newItems

      // Add to cart (this triggers React state update for the badge, drawer, etc.)
      cartStore.add({
        id: product.id,
        name: loc(product),
        price: product.price,
        image: product.image,
        sku: product.sku,
      }, qty)

      // Build message with the computed items list
      const message = buildWhatsAppMessage({
        intro: tenant.whatsappPrefill,
        tenantName: tenant.name,
        items: finalItems,
      })
      const url = buildWhatsAppUrl(tenant.whatsappNumber!, message)
      window.open(url, '_blank')
      toast.success(t('product.singleOrderSent'), {
        description: t('product.cartOrderMsg'),
        duration: 5000,
      })
      onOpenChange(false)
    } catch (e: any) {
      toast.error(t('toast.error'))
    } finally {
      setSendingBuyNow(false)
    }
  }

  const handleShare = async () => {
    const url = typeof window !== 'undefined' ? window.location.href : ''
    try {
      if (navigator.share) {
        await navigator.share({ title: loc(product), url })
      } else {
        await navigator.clipboard.writeText(url)
        toast.success(t('product.shareCopied'))
      }
    } catch {}
  }

  const stockLabel = product.stock <= 0
    ? t('product.outOfStock')
    : product.stock <= 5
    ? t('product.lowStock', undefined, { n: product.stock })
    : t('product.inStock')

  const stockColor = product.stock <= 0
    ? 'text-rose-600'
    : product.stock <= 5
    ? 'text-amber-600'
    : 'text-emerald-600'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[95vh] overflow-y-auto p-0">
        <DialogHeader className="sr-only">
          <DialogTitle>{loc(product)}</DialogTitle>
          <DialogDescription>{t('product.details')}</DialogDescription>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-0">
          {/* Left — image */}
          <div className="relative aspect-square md:aspect-auto md:min-h-[400px] flex items-center justify-center"
               style={{ background: `linear-gradient(135deg, var(--sf-primary, #0f766e)15, var(--sf-accent, #f59e0b)25)` }}>
            <div className="text-[10rem] md:text-[12rem] leading-none select-none">
              {product.image || '📦'}
            </div>
            {/* Badges */}
            <div className="absolute top-3 left-3 flex flex-col gap-1.5">
              {discount > 0 && (
                <Badge className="bg-rose-600 text-white gap-1">
                  -{discount}% {t('product.off')}
                </Badge>
              )}
              {product.featured && (
                <Badge className="bg-amber-500 text-white gap-1">
                  <Star className="h-3 w-3 fill-current" />
                  Featured
                </Badge>
              )}
            </div>
            {/* Share button */}
            <button
              onClick={handleShare}
              className="absolute top-3 right-3 h-9 w-9 rounded-full bg-white/80 backdrop-blur hover:bg-white flex items-center justify-center transition-colors"
              aria-label={t('product.share')}
            >
              <Share className="h-4 w-4" />
            </button>
          </div>

          {/* Right — details */}
          <div className="p-5 md:p-6 flex flex-col">
            {/* Category + status */}
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs text-muted-foreground">
                {product.category ? `${product.category.icon} ${loc(product.category)}` : t('common.none')}
              </div>
              <Badge
                variant="outline"
                className={cn(
                  'text-[10px]',
                  product.status === 'ACTIVE' && 'border-emerald-200 bg-emerald-50 text-emerald-700',
                  product.status === 'DRAFT' && 'border-slate-200 bg-slate-50 text-slate-700',
                  product.status === 'ARCHIVED' && 'border-rose-200 bg-rose-50 text-rose-700',
                )}
              >
                {product.status}
              </Badge>
            </div>

            {/* Name */}
            <h2 className="text-xl md:text-2xl font-bold leading-tight mb-2">
              {loc(product)}
            </h2>

            {/* Price */}
            <div className="flex items-baseline gap-2 mb-3">
              <span className="text-2xl font-bold">${product.price.toLocaleString()}</span>
              {discount > 0 && (
                <>
                  <span className="text-sm text-muted-foreground line-through">
                    ${product.compareAt!.toLocaleString()}
                  </span>
                  <Badge variant="outline" className="text-emerald-700 border-emerald-300 bg-emerald-50 text-[10px]">
                    {t('product.youSave')} ${savings.toLocaleString()}
                  </Badge>
                </>
              )}
            </div>

            {/* Stock + SKU */}
            <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
              <div className="flex items-center justify-between p-2 rounded bg-slate-50">
                <span className="text-muted-foreground">{t('product.stock')}</span>
                <span className={cn('font-medium', stockColor)}>{stockLabel}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-slate-50">
                <span className="text-muted-foreground">{t('product.sku')}</span>
                <span className="font-mono">{product.sku || '—'}</span>
              </div>
            </div>

            {/* Description */}
            <div className="mb-4">
              <div className="text-xs font-medium text-muted-foreground mb-1">{t('product.description')}</div>
              <p className="text-sm leading-relaxed">
                {loc(product, 'description') || t('product.noDescription')}
              </p>
            </div>

            {/* Quantity selector */}
            {available && (
              <div className="mb-4">
                <div className="text-xs font-medium text-muted-foreground mb-1.5">{t('product.quantity')}</div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 w-9 p-0"
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    disabled={qty <= 1}
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </Button>
                  <span className="w-12 text-center font-medium">{qty}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 w-9 p-0"
                    onClick={() => setQty((q) => Math.min(product.stock, q + 1))}
                    disabled={qty >= product.stock}
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                  <span className="text-xs text-muted-foreground ml-2">
                    = ${(lineTotal).toLocaleString()}
                  </span>
                </div>
              </div>
            )}

            {/* Action buttons */}
            {available ? (
              <div className="space-y-2 mt-auto">
                {/* Primary: Add to cart + Buy now */}
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    onClick={handleAddToCart}
                    variant="outline"
                    className="gap-1.5"
                  >
                    <ShoppingCart className="h-4 w-4" />
                    {t('product.addToCart')}
                  </Button>
                  <Button
                    onClick={handleBuyNow}
                    disabled={sendingBuyNow}
                    className="gap-1.5"
                    style={{ background: 'var(--sf-primary, #0f766e)', color: '#fff' }}
                  >
                    {sendingBuyNow ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShoppingCart className="h-4 w-4" />}
                    {t('product.buyNow')}
                  </Button>
                </div>

                {/* Secondary: Order via WhatsApp (single item, bypasses cart) */}
                <Button
                  onClick={handleSingleOrder}
                  disabled={sendingSingle || !hasWhatsApp}
                  variant="outline"
                  className="w-full gap-1.5 border-emerald-500 text-emerald-700 hover:bg-emerald-50"
                >
                  {sendingSingle ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageCircle className="h-4 w-4" />}
                  {t('product.orderViaWhatsapp')}
                </Button>

                {!hasWhatsApp && (
                  <p className="text-[10px] text-center text-amber-700 flex items-center justify-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {t('cart.noWhatsappMsg')}
                  </p>
                )}
                <p className="text-[10px] text-center text-muted-foreground">
                  {t('product.singleOrderMsg')}
                </p>
              </div>
            ) : (
              <div className="mt-auto p-3 rounded-lg bg-rose-50 border border-rose-200 text-center">
                <div className="text-sm font-medium text-rose-700">{t('product.notAvailable')}</div>
              </div>
            )}
          </div>
        </div>

        {/* Related products */}
        {related.length > 0 && (
          <>
            <Separator />
            <div className="p-5 md:p-6">
              <h3 className="text-sm font-medium mb-3">{t('product.relatedProducts')}</h3>
              <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                {related.slice(0, 5).map((rp) => (
                  <button
                    key={rp.id}
                    onClick={() => onSelectRelated?.(rp)}
                    className="text-center p-2 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors group"
                  >
                    <div className="text-3xl mb-1">{rp.image || '📦'}</div>
                    <div className="text-[10px] font-medium line-clamp-1">{loc(rp)}</div>
                    <div className="text-[10px] text-muted-foreground">${rp.price.toLocaleString()}</div>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

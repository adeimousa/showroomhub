'use client'

/**
 * ProductDetailLayout
 *
 * Renders the inner content of a product detail view — image + info + actions.
 * Currently used by:
 *   - ProductPage (full-page view at /?view=product&slug=…&productId=…)
 *
 * Receives the tenant + product + cart wiring from the parent. Calls back to
 * the parent for "Add to cart", "Buy now", and "Order via WhatsApp" via the
 * optional onAfterAction callback.
 */

import { useState, useEffect } from 'react'
import { useI18n } from '@/hooks/use-i18n'
import { useCartStore } from '@/hooks/use-cart'
import { buildSingleItemMessage, buildWhatsAppUrl } from '@/lib/whatsapp'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import Image from 'next/image'
import {
  ShoppingCart, MessageCircle, Loader2, Plus, Minus, Share, AlertCircle,
} from 'lucide-react'
import { cn, buildTenantUrl } from '@/lib/utils'
import { loc as locHelper } from '@/lib/loc'

type Product = {
  id: string
  name: string
  nameAr: string | null
  nameHe: string | null
  description: string | null
  descriptionAr: string | null
  descriptionHe: string | null
  price: number
  compareAt: number | null
  sku: string | null
  stock: number
  image: string | null
  featured: boolean
  status: string
  category: { id: string; name: string; nameAr: string | null; nameHe: string | null; icon: string | null } | null
}

type Tenant = {
  id: string
  name: string
  slug: string
  whatsappNumber: string | null
  whatsappPrefill: string | null
  whatsappPrefillAr: string | null
  whatsappPrefillHe: string | null
}

type Props = {
  product: Product
  tenant: Tenant
  lang: 'en' | 'ar' | 'he'
  related?: Product[]
  onSelectRelated?: (p: Product) => void
  onAfterAction?: () => void  // called after add-to-cart / buy-now / order (e.g. to close dialog)
}

export function ProductDetailLayout({
  product, tenant, lang, related = [], onSelectRelated, onAfterAction,
}: Props) {
  const { t, isRTL } = useI18n()
  const cartStore = useCartStore()
  const [qty, setQty] = useState(1)
  const [sendingSingle, setSendingSingle] = useState(false)

  // Reset qty when product changes
  useEffect(() => {
    queueMicrotask(() => setQty(1))
  }, [product.id])

  const loc = (obj: any, field: string = 'name') => locHelper(obj, field, lang)

  // Helper to check if image is a valid URL (not an emoji or invalid string)
  const isValidImageUrl = (url: string | null) => {
    if (!url) return false
    return url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/')
  }

  const hasWhatsApp = !!tenant.whatsappNumber
  const discount = product.compareAt && product.compareAt > product.price
    ? Math.round((1 - product.price / product.compareAt) * 100)
    : 0
  const savings = product.compareAt && product.compareAt > product.price
    ? product.compareAt - product.price
    : 0
  const available = product.status === 'ACTIVE'
  const lineTotal = product.price * qty

  const handleAddToCart = () => {
    cartStore.add({
      id: product.id,
      name: loc(product),
      nameHe: locHelper(product, 'name', 'he'),
      price: product.price,
      image: product.image,
      sku: product.sku,
    }, qty)
    toast.success(t('product.added'), { description: loc(product) })
    onAfterAction?.()
  }

  const handleSingleOrder = async () => {
    if (!hasWhatsApp) {
      toast.error(t('cart.noWhatsapp'), { description: t('cart.noWhatsappMsg') })
      return
    }

    setSendingSingle(true)

    try {
      // Create order in database
      const orderResponse = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: tenant.id,
          customerName: null,
          customerPhone: null,
          items: [{
            productId: product.id,
            name: loc(product),
            sku: product.sku,
            price: product.price,
            qty,
          }],
          total: lineTotal,
        }),
      })

      if (!orderResponse.ok) {
        throw new Error('Failed to create order')
      }

      const { order } = await orderResponse.json()

      // Send WhatsApp message with order link
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
      const message = buildSingleItemMessage({
        intro: tenant.whatsappPrefill,
        introAr: tenant.whatsappPrefillAr,
        introHe: tenant.whatsappPrefillHe,
        tenantName: tenant.name,
        item: {
          id: product.id,
          name: locHelper(product, 'name', 'he'),
          sku: product.sku,
          price: product.price,
          qty,
          description: locHelper(product, 'description', 'he'),
        },
        lang: 'he', // order messages are always sent in Hebrew for now
        tenantSlug: tenant.slug,
        baseUrl,
        orderId: order.id,
        orderNumber: order.orderNumber,
      })
      const url = buildWhatsAppUrl(tenant.whatsappNumber!, message)
      window.open(url, '_blank')

      toast.success(t('product.singleOrderSent'), {
        description: `${t('product.singleOrderMsg')} (${order.orderNumber})`,
        duration: 5000,
      })

      onAfterAction?.()
    } catch (e: any) {
      toast.error(t('toast.error'), {
        description: e.message || t('cart.orderFailed'),
      })
    } finally {
      setSendingSingle(false)
    }
  }

  const handleShare = async () => {
    // Build a shareable URL that opens this exact product page
    const url = typeof window !== 'undefined'
      ? `${window.location.origin}${buildTenantUrl(`/product/${product.id}`)}`
      : ''
    try {
      if (navigator.share) {
        await navigator.share({ title: loc(product), url })
      } else {
        await navigator.clipboard.writeText(url)
        toast.success(t('product.shareCopied'))
      }
    } catch {}
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10">
      {/* Breadcrumb / back */}
      <div className="mb-4 text-xs text-muted-foreground flex items-center gap-2">
        <button
          onClick={() => window.location.href = buildTenantUrl('/')}
          className="hover:text-foreground inline-flex items-center gap-1 bg-transparent border-0 cursor-pointer text-muted-foreground text-xs"
        >
          ← {tenant.name}
        </button>
        <span>/</span>
        {product.category && (
          <>
            <span>{loc(product.category)}</span>
            <span>/</span>
          </>
        )}
        <span className="text-foreground font-medium truncate">{loc(product)}</span>
      </div>

      <div className="grid md:grid-cols-2 gap-6 lg:gap-10">
        {/* Left — image */}
        <div className="relative aspect-square md:aspect-[4/5] flex items-center justify-center rounded-2xl overflow-hidden"
             style={{ background: `linear-gradient(135deg, var(--sf-primary, #0f766e)15, var(--sf-accent, #f59e0b)25)` }}>
          {isValidImageUrl(product.image) ? (
            <Image
              src={product.image}
              alt={loc(product)}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
              priority
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-white/90 backdrop-blur-sm px-6 py-4 rounded-lg shadow-lg">
                <div className="text-xl md:text-3xl font-semibold text-slate-600 text-center">{t('common.noImage')}</div>
              </div>
            </div>
          )}
          {/* Badges */}
          <div className="absolute top-4 left-4 flex flex-col gap-1.5">
            {discount > 0 && (
              <Badge className="bg-rose-600 text-white gap-1 text-sm px-3 py-1">
                -{discount}% {t('product.off')}
              </Badge>
            )}
          </div>
          {/* Share button */}
          <button
            onClick={handleShare}
            className="absolute top-4 right-4 h-10 w-10 rounded-full bg-white/80 backdrop-blur hover:bg-white flex items-center justify-center transition-colors shadow-sm"
            aria-label={t('product.share')}
          >
            <Share className="h-4 w-4" />
          </button>
        </div>

        {/* Right — details */}
        <div className="flex flex-col">
          {/* Category + status */}
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs text-muted-foreground">
              {product.category ? loc(product.category) : t('common.none')}
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
          <h1 className="text-2xl md:text-3xl font-bold leading-tight mb-3" style={{ fontFamily: 'var(--sf-font-head, Inter)' }}>
            {loc(product)}
          </h1>

          {/* Price */}
          <div className="flex items-baseline gap-2 mb-4">
            <span className="text-3xl font-bold">₪{product.price.toLocaleString()}</span>
            {discount > 0 && (
              <>
                <span className="text-base text-muted-foreground line-through">
                  ₪{product.compareAt!.toLocaleString()}
                </span>
                <Badge variant="outline" className="text-emerald-700 border-emerald-300 bg-emerald-50 text-xs">
                  {t('product.youSave')} ₪{savings.toLocaleString()}
                </Badge>
              </>
            )}
          </div>

          {/* SKU */}
          {product.sku && (
            <div className="mb-4 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50">
                <span className="text-muted-foreground">{t('product.sku')}</span>
                <span className="font-mono">{product.sku}</span>
              </div>
            </div>
          )}

          {/* Description */}
          <div className="mb-5">
            <div className="text-xs font-medium text-muted-foreground mb-1.5">{t('product.description')}</div>
            <p className="text-sm leading-relaxed whitespace-pre-line">
              {loc(product, 'description') || t('product.noDescription')}
            </p>
          </div>

          {/* Quantity selector */}
          {available && (
            <div className="mb-5">
              <div className="text-xs font-medium text-muted-foreground mb-1.5">{t('product.quantity')}</div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-10 w-10 p-0"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  disabled={qty <= 1}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-14 text-center text-lg font-medium">{qty}</span>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-10 w-10 p-0"
                  onClick={() => setQty((q) => q + 1)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground ml-3">
                  = <span className="font-bold text-foreground">₪{lineTotal.toLocaleString()}</span>
                </span>
              </div>
            </div>
          )}

          {/* Action buttons */}
          {available ? (
            <div className="space-y-2 mt-auto">
              <Button
                onClick={handleAddToCart}
                variant="outline"
                size="lg"
                className="w-full gap-2 h-12"
              >
                <ShoppingCart className="h-4 w-4" />
                {t('product.addToCart')}
              </Button>
              <Button
                onClick={handleSingleOrder}
                disabled={sendingSingle || !hasWhatsApp}
                size="lg"
                className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700 text-white h-12"
              >
                {sendingSingle ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageCircle className="h-4 w-4" />}
                {t('product.orderViaWhatsapp')}
              </Button>
              {!hasWhatsApp && (
                <p className="text-[11px] text-center text-amber-700 flex items-center justify-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {t('cart.noWhatsappMsg')}
                </p>
              )}
              <p className="text-[11px] text-center text-muted-foreground">
                {t('product.singleOrderMsg')}
              </p>
            </div>
          ) : (
            <div className="mt-auto p-4 rounded-lg bg-rose-50 border border-rose-200 text-center">
              <div className="text-sm font-medium text-rose-700">{t('product.notAvailable')}</div>
            </div>
          )}
        </div>
      </div>

      {/* Related products */}
      {related.length > 0 && (
        <>
          <Separator className="my-10" />
          <div>
            <h2 className="text-lg font-bold mb-4" style={{ fontFamily: 'var(--sf-font-head, Inter)' }}>
              {t('product.relatedProducts')}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {related.slice(0, 5).map((rp) => (
                <button
                  key={rp.id}
                  onClick={() => onSelectRelated?.(rp)}
                  className="text-center p-3 rounded-lg border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all group"
                >
                  <div className="relative aspect-square mb-2 rounded-md overflow-hidden bg-slate-100 flex items-center justify-center">
                    {isValidImageUrl(rp.image) ? (
                      <Image
                        src={rp.image}
                        alt={loc(rp)}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                      />
                    ) : (
                      <div className="text-[10px] text-muted-foreground">{t('common.noImage')}</div>
                    )}
                  </div>
                  <div className="text-xs font-medium line-clamp-2 mb-1">{loc(rp)}</div>
                  <div className="text-xs text-muted-foreground">₪{rp.price.toLocaleString()}</div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}

    </div>
  )
}

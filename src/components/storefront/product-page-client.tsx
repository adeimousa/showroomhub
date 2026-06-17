'use client'

import { useI18n } from '@/hooks/use-i18n'
import { useCartStore } from '@/hooks/use-cart'
import { ProductDetailLayout } from './product-detail-layout'
import { CartDrawer } from './cart-drawer'
import { LanguageSwitcher } from '@/components/language-switcher'
import { ArrowLeft, ShoppingCart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { loc as locHelper } from '@/lib/loc'
import { useMemo } from 'react'

/**
 * Client component for the tenant product page.
 * Renders the tenant's storefront header + product detail + footer.
 */
export function ProductPageClient({ tenant, product }: { tenant: any; product: any }) {
  const { t, lang, isRTL } = useI18n()
  const cartStore = useCartStore()
  const layout = tenant.layout

  const loc = (obj: any, field: string = 'name') => locHelper(obj, field, lang)

  const related = useMemo(() => {
    return tenant.products
      .filter((p: any) => p.id !== product.id && p.category?.id === product.category?.id)
      .slice(0, 5)
  }, [product, tenant.products])

  // Helper to generate product URL - handles both preview mode and custom domain mode
  const getProductUrl = (productId: string) => {
    if (typeof window === 'undefined') return `/product/${productId}`

    const params = new URLSearchParams(window.location.search)
    const isPreviewMode = params.has('view') && params.has('slug')

    if (isPreviewMode) {
      // Preview mode: use ?view=product&slug=...&productId=...
      return `/?view=product&slug=${encodeURIComponent(tenant.slug)}&productId=${encodeURIComponent(productId)}`
    } else {
      // Custom domain mode: use /product/<id>
      return `/product/${productId}`
    }
  }

  if (!layout) {
    return (
      <div className="min-h-screen bg-slate-100" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur text-white px-4 py-1.5 flex items-center justify-between text-xs">
          <a href="/" className="opacity-70 hover:opacity-100">← Back to store</a>
          <LanguageSwitcher />
        </div>
        <ProductDetailLayout
          product={product}
          tenant={tenant}
          lang={lang}
          related={related}
          onSelectRelated={(p) => { window.location.href = getProductUrl(p.id) }}
        />
        <CartDrawer tenant={tenant} />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-100" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Discreet admin bar */}
      <div className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur text-white px-4 py-1.5 flex items-center justify-between text-xs">
        <div className="flex items-center gap-3">
          <a href="/" className="opacity-70 hover:opacity-100">← Back to store</a>
          <a href="/admin" className="opacity-70 hover:opacity-100">Admin</a>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => cartStore.open()}
            className="flex items-center gap-1.5 opacity-70 hover:opacity-100"
          >
            <ShoppingCart className="h-3.5 w-3.5" />
            <span>{cartStore.totalItems()}</span>
          </button>
          <LanguageSwitcher />
        </div>
      </div>

      <ProductDetailLayout
        product={product}
        tenant={tenant}
        lang={lang}
        related={related}
        onSelectRelated={(p) => { window.location.href = getProductUrl(p.id) }}
      />

      <CartDrawer tenant={tenant} />
    </div>
  )
}

'use client'

import { useI18n } from '@/hooks/use-i18n'
import { useCartStore } from '@/hooks/use-cart'
import { StorefrontRenderer } from './storefront-renderer'
import { CartDrawer } from './cart-drawer'
import { LanguageSwitcher } from '@/components/language-switcher'
import { ArrowLeft, ShoppingCart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { loc as locHelper } from '@/lib/loc'
import { useState } from 'react'
import { toast } from 'sonner'

/**
 * Client component for the tenant storefront.
 * Receives the full tenant data (fetched server-side) and renders it.
 * Also renders the cart drawer + the floating admin bar (with NO
 * "ShowroomHub" branding — just a discreet "Dashboard" link for the
 * tenant admin to get to /admin).
 */
export function StorefrontClient({ tenant }: { tenant: any }) {
  const { t, lang, isRTL } = useI18n()
  const cartStore = useCartStore()
  const layout = tenant.layout

  const loc = (obj: any, field: string = 'name') => locHelper(obj, field, lang)

  const addToCart = (product: any) => {
    cartStore.add({
      id: product.id,
      name: loc(product),
      price: product.price,
      image: product.image,
      sku: product.sku,
    })
    toast.success(t('cart.added'), { description: loc(product) })
  }

  if (!layout) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-6 bg-slate-50">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">🎨</div>
          <h1 className="text-xl font-bold mb-2">Store coming soon</h1>
          <p className="text-sm text-muted-foreground">
            This store hasn't been set up yet. Please check back later.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-100" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Discreet admin bar — for the tenant admin to access /admin.
          NO "ShowroomHub" branding — just a small "Admin" link. */}
      <div className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur text-white px-4 py-1.5 flex items-center justify-between text-xs">
        <a
          href="/admin"
          className="opacity-70 hover:opacity-100 transition-opacity"
        >
          Admin
        </a>
        <div className="flex items-center gap-2">
          <button
            onClick={() => cartStore.open()}
            className="flex items-center gap-1.5 opacity-70 hover:opacity-100 transition-opacity"
          >
            <ShoppingCart className="h-3.5 w-3.5" />
            <span>{cartStore.totalItems()}</span>
          </button>
          <LanguageSwitcher />
        </div>
      </div>

      <StorefrontRenderer
        tenant={tenant}
        layout={layout}
        lang={lang}
        loc={loc}
        t={t}
        isRTL={isRTL}
        cartCount={cartStore.totalItems()}
        onAddToCart={addToCart}
        onOpenCart={() => cartStore.open()}
      />

      <CartDrawer tenant={tenant} />
    </div>
  )
}

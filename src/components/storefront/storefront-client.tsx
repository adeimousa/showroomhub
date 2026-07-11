'use client'

import { useI18n } from '@/hooks/use-i18n'
import { useCartStore } from '@/hooks/use-cart'
import { StorefrontRenderer } from './storefront-renderer'
import { CartDrawer } from './cart-drawer'
import { LanguageSwitcher } from '@/components/language-switcher'
import { ArrowLeft, ShoppingCart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { loc as locHelper } from '@/lib/loc'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { buildTenantUrl } from '@/lib/utils'
import { useSession } from 'next-auth/react'

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
  const { data: session } = useSession()
  const layout = tenant.layout
  const [initialCategory, setInitialCategory] = useState<string | null>(null)

  const loc = (obj: any, field: string = 'name') => locHelper(obj, field, lang)

  // Check if user is authenticated as CLIENT_ADMIN for this tenant
  const isAdmin = session?.user && (session.user as any).role === 'CLIENT_ADMIN' && (session.user as any).tenantId === tenant.id

  // Read category from URL params on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const categoryId = params.get('category')
      if (categoryId) {
        setInitialCategory(categoryId)
      }
    }
  }, [])

  const addToCart = (product: any) => {
    cartStore.add({
      id: product.id,
      name: loc(product),
      nameHe: locHelper(product, 'name', 'he'),
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
      {/* Discreet admin bar — only shown to authenticated CLIENT_ADMIN users */}
      {isAdmin && (
        <div className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur text-white px-4 py-1.5 flex items-center justify-between text-xs">
          <button
            onClick={() => window.location.href = buildTenantUrl('/admin')}
            className="opacity-70 hover:opacity-100 transition-opacity bg-transparent border-0 cursor-pointer text-white"
          >
            Admin
          </button>
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
      )}

      {/* Cart and language switcher for non-admin users */}
      {!isAdmin && (
        <div className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur text-white px-4 py-1.5 flex items-center justify-end text-xs">
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
      )}

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
        initialCategoryId={initialCategory}
      />

      <CartDrawer tenant={tenant} />
    </div>
  )
}

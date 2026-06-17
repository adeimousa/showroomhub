'use client'

import { useState, useEffect } from 'react'
import { useI18n } from '@/hooks/use-i18n'
import { useCartStore } from '@/hooks/use-cart'
import { Button } from '@/components/ui/button'
import { ArrowLeft, ShoppingCart, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { StorefrontRenderer } from './storefront-renderer'
import { CartDrawer } from './cart-drawer'
import { LanguageSwitcher } from '@/components/language-switcher'
import { loc as locHelper } from '@/lib/loc'

type SiteData = {
  tenant: any
  paused?: boolean
  suspended?: boolean
}

export function StorefrontPreview({ slug }: { slug: string }) {
  const { t, lang, isRTL } = useI18n()
  const cartStore = useCartStore()

  // Initialize / reset the cart store for this tenant whenever the slug changes
  useEffect(() => {
    cartStore.initForTenant(slug)
  }, [slug])

  // Fetch tenant site data
  const [data, setData] = useState<SiteData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const r = await fetch(`/api/site?slug=${encodeURIComponent(slug)}`)
        const j = await r.json()
        if (cancelled) return
        if (!r.ok) throw new Error(j.error || 'Failed to load')
        setData(j)
      } catch (e: any) {
        setError(e.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [slug])

  // Helper to get localized text from any object with name/nameAr/nameHe etc.
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

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-amber-600 mx-auto" />
          <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">🔍</div>
          <h1 className="text-xl font-bold mb-2">Store not found</h1>
          <p className="text-sm text-muted-foreground mb-4">{error}</p>
          <Button asChild>
            <a href="/">Back to dashboard</a>
          </Button>
        </div>
      </div>
    )
  }

  // Paused state
  if (data?.paused) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">⏸️</div>
          <h1 className="text-xl font-bold mb-2">{t('store.paused')}</h1>
          <p className="text-sm text-muted-foreground mb-4">{t('store.pausedMsg')}</p>
          <p className="text-xs text-muted-foreground">
            {loc(data.tenant, 'name')}
          </p>
        </div>
      </div>
    )
  }

  // Suspended state
  if (data?.suspended) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">🚫</div>
          <h1 className="text-xl font-bold mb-2">{t('store.suspended')}</h1>
          <p className="text-sm text-muted-foreground mb-4">{t('store.suspendedMsg')}</p>
        </div>
      </div>
    )
  }

  if (!data?.tenant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-sm text-muted-foreground">No data</p>
      </div>
    )
  }

  const tenant = data.tenant
  const layout = tenant.layout

  return (
    <div className="min-h-screen bg-slate-100" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Floating admin bar — visible only so the visitor can get back to the dashboard */}
      <div className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur text-white px-4 py-2 flex items-center justify-between text-xs">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="sm" className="text-white hover:text-white hover:bg-white/10 h-7 gap-1.5">
            <a href="/">
              <ArrowLeft className="h-3.5 w-3.5" />
              Dashboard
            </a>
          </Button>
          <span className="opacity-70 hidden sm:inline">Preview · {tenant.slug}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => cartStore.open()}
            className="flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-white/10 transition-colors"
          >
            <ShoppingCart className="h-3.5 w-3.5" />
            <span>{cartStore.totalItems()}</span>
          </button>
          <LanguageSwitcher />
        </div>
      </div>

      {/* If no layout assigned, show fallback */}
      {!layout ? (
        <div className="min-h-[80vh] flex items-center justify-center p-6">
          <div className="text-center max-w-md">
            <div className="text-6xl mb-4">🎨</div>
            <h1 className="text-xl font-bold mb-2">No layout assigned</h1>
            <p className="text-sm text-muted-foreground">
              The platform admin needs to assign a layout to this tenant before the storefront can render.
            </p>
          </div>
        </div>
      ) : (
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
      )}

      {/* Cart drawer — lives at this level so it overlays everything */}
      <CartDrawer tenant={tenant} />
    </div>
  )
}

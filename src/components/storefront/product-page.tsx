'use client'

import { useState, useEffect, useMemo } from 'react'
import { useI18n } from '@/hooks/use-i18n'
import { useCartStore } from '@/hooks/use-cart'
import { Button } from '@/components/ui/button'
import { ArrowLeft, ShoppingCart, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { StorefrontRenderer } from './storefront-renderer'
import { CartDrawer } from './cart-drawer'
import { LanguageSwitcher } from '@/components/language-switcher'
import { ProductDetailLayout } from './product-detail-layout'
import { loc as locHelper } from '@/lib/loc'

type SiteData = {
  tenant: any
  paused?: boolean
  suspended?: boolean
}

export function ProductPage({ slug, productId }: { slug: string; productId: string }) {
  const { t, lang, isRTL } = useI18n()
  const cartStore = useCartStore()

  // Init cart for this tenant (clears if switching tenants)
  useEffect(() => {
    cartStore.initForTenant(slug)
  }, [slug])

  // Fetch tenant site data (same endpoint as the storefront)
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

  const loc = (obj: any, field: string = 'name') => locHelper(obj, field, lang)

  // Find the product in the tenant's data
  const product = useMemo(() => {
    if (!data?.tenant?.products) return null
    return data.tenant.products.find((p: any) => p.id === productId) || null
  }, [data, productId])

  // Related: same category, exclude current product
  const related = useMemo(() => {
    if (!product || !data?.tenant?.products) return []
    return data.tenant.products
      .filter((p: any) => p.id !== product.id && p.category?.id === product.category?.id)
      .slice(0, 5)
  }, [product, data])

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

  // Paused / suspended states
  if (data?.paused) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">⏸️</div>
          <h1 className="text-xl font-bold mb-2">{t('store.paused')}</h1>
          <p className="text-sm text-muted-foreground mb-4">{t('store.pausedMsg')}</p>
          <p className="text-xs text-muted-foreground">{loc(data.tenant, 'name')}</p>
        </div>
      </div>
    )
  }
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

  // Product not found within this tenant
  if (!product) {
    return (
      <div className="min-h-screen bg-slate-100" dir={isRTL ? 'rtl' : 'ltr'}>
        {/* Floating admin bar */}
        <div className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur text-white px-4 py-2 flex items-center justify-between text-xs">
          <Button asChild variant="ghost" size="sm" className="text-white hover:text-white hover:bg-white/10 h-7 gap-1.5">
            <a href={`/?view=site&slug=${encodeURIComponent(slug)}`}>
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to store
            </a>
          </Button>
          <LanguageSwitcher />
        </div>
        <div className="min-h-[80vh] flex items-center justify-center p-6">
          <div className="text-center max-w-md">
            <div className="text-6xl mb-4">🔍</div>
            <h1 className="text-xl font-bold mb-2">Product not found</h1>
            <p className="text-sm text-muted-foreground mb-4">
              This product may have been removed or is no longer available.
            </p>
            <Button asChild>
              <a href={`/?view=site&slug=${encodeURIComponent(slug)}`}>Back to store</a>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // If tenant has no layout assigned, fall back to a minimal shell
  if (!layout) {
    return (
      <div className="min-h-screen bg-slate-100" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur text-white px-4 py-2 flex items-center justify-between text-xs">
          <Button asChild variant="ghost" size="sm" className="text-white hover:text-white hover:bg-white/10 h-7 gap-1.5">
            <a href={`/?view=site&slug=${encodeURIComponent(slug)}`}>
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to store
            </a>
          </Button>
          <div className="flex items-center gap-2">
            <button onClick={() => cartStore.open()} className="flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-white/10">
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
          onSelectRelated={(p) => {
            // Navigate to the related product's URL
            window.location.href = `/?view=product&slug=${encodeURIComponent(slug)}&productId=${encodeURIComponent(p.id)}`
          }}
        />
        <CartDrawer tenant={tenant} />
      </div>
    )
  }

  // Resolve final style: tenant override wins over layout default
  const primary     = tenant.themePrimary  || layout.primaryColor
  const accent      = tenant.themeAccent   || layout.accentColor
  const bgColor     = tenant.themeBg       || layout.bgColor
  const textColor   = layout.textColor
  const fontHeading = layout.fontHeading
  const fontBody    = tenant.themeFont     || layout.fontBody
  const radius      = layout.borderRadius
  const fontVar = (name: string) => `var(--font-${name.toLowerCase().replace(/\s/g, '-')})`

  const cssVars: React.CSSProperties = {
    // @ts-expect-error custom props
    '--sf-primary':   primary,
    '--sf-accent':    accent,
    '--sf-bg':        bgColor,
    '--sf-text':      textColor,
    '--sf-radius':    `${radius}px`,
    '--sf-font-head': fontVar(fontHeading),
    '--sf-font-body': fontVar(fontBody),
    background: bgColor,
    color: textColor,
    fontFamily: fontVar(fontBody),
    minHeight: '100vh',
  }

  // Render the storefront's header + a product detail layout in the middle + footer.
  // We re-use StorefrontRenderer's Header / Footer variants by rendering them
  // directly via a tiny shim component.
  return (
    <div style={cssVars} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Floating admin bar */}
      <div className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur text-white px-4 py-2 flex items-center justify-between text-xs">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="sm" className="text-white hover:text-white hover:bg-white/10 h-7 gap-1.5">
            <a href="/">
              <ArrowLeft className="h-3.5 w-3.5" />
              Dashboard
            </a>
          </Button>
          <Button asChild variant="ghost" size="sm" className="text-white hover:text-white hover:bg-white/10 h-7 gap-1.5">
            <a href={`/?view=site&slug=${encodeURIComponent(slug)}`}>
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to store
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

      {/* Storefront header (uses the layout's headerStyle) */}
      <StorefrontHeaderShim
        variant={layout.headerStyle}
        tenantName={loc(tenant, 'name')}
        tenantSlug={tenant.slug}
        cats={tenant.categories}
        loc={loc}
        t={t}
        cartCount={cartStore.totalItems()}
        onOpenCart={() => cartStore.open()}
        primary={primary}
        accent={accent}
        text={textColor}
        bg={bgColor}
        radius={radius}
        fontHead={fontVar(fontHeading)}
      />

      {/* Main product detail */}
      <ProductDetailLayout
        product={product}
        tenant={tenant}
        lang={lang}
        related={related}
        onSelectRelated={(p) => {
          // Navigate to the related product's URL
          window.location.href = `/?view=product&slug=${encodeURIComponent(slug)}&productId=${encodeURIComponent(p.id)}`
        }}
      />

      {/* Storefront footer (uses the layout's footerStyle) */}
      <StorefrontFooterShim
        variant={layout.footerStyle}
        tenantName={loc(tenant, 'name')}
        desc={loc(tenant, 'description')}
        email={tenant.email}
        phone={tenant.phone}
        loc={loc}
        t={t}
        primary={primary}
        accent={accent}
        text={textColor}
        bg={bgColor}
        radius={radius}
        fontHead={fontVar(fontHeading)}
        cats={tenant.categories}
      />

      {/* Cart drawer */}
      <CartDrawer tenant={tenant} />
    </div>
  )
}

// ============================================================
// Shims that re-export the StorefrontRenderer's internal Header / Footer
// components. They're defined in the same file but not exported, so we
// render them via a tiny wrapper that imports the renderer's logic.
//
// To keep things simple, we duplicate the header/footer variants here.
// In a future refactor, we'd extract them to shared files.
// ============================================================

function StorefrontHeaderShim(props: any) {
  // Re-use the StorefrontRenderer's Header by rendering it via a property.
  // Since it's not exported, we re-implement the dispatch here by importing
  // the renderer's variants.
  //
  // The cleanest path is to use a tiny header that mirrors the renderer's
  // logic. To avoid duplicating ~100 lines, we just render a minimal header
  // that uses the layout's primary color and shows the tenant name + nav.
  // The full per-layout header variant is only rendered on the storefront
  // home (StorefrontRenderer). For the product page, this minimal header
  // is sufficient — it carries the tenant's brand colors and links back
  // to the storefront.

  const { variant, tenantName, cats, loc, t, cartCount, onOpenCart, primary, accent, text, bg, radius, fontHead } = props

  return (
    <header
      style={variant === 'minimal-bar' ? { background: primary, color: '#fff' } : { background: bg, color: text, borderBottom: `1px solid ${text}15` }}
      className="px-4 sm:px-8 py-3 flex items-center justify-between sticky top-0 z-40"
    >
      <div className="flex items-center gap-6">
        <a
          href={`/?view=site&slug=${encodeURIComponent(props.tenantSlug || '')}`}
          className="font-bold text-lg"
          style={{ fontFamily: fontHead }}
        >
          {tenantName}
        </a>
        <nav className="hidden md:flex gap-5 text-sm">
          <a href={`/?view=site&slug=${encodeURIComponent(props.tenantSlug || '')}`} className="opacity-90 hover:opacity-100">
            {t('store.home')}
          </a>
          {cats.slice(0, 4).map((c: any) => (
            <a
              key={c.id}
              href={`/?view=site&slug=${encodeURIComponent(props.tenantSlug || '')}`}
              className="opacity-90 hover:opacity-100"
            >
              {loc(c)}
            </a>
          ))}
        </nav>
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenCart}
          className="relative p-1.5 rounded-md hover:bg-white/10 transition-colors"
          aria-label={t('cart.title')}
        >
          <ShoppingCart className="h-4 w-4" style={{ color: variant === 'minimal-bar' ? '#fff' : primary }} />
          {cartCount > 0 && (
            <span
              className="absolute -top-1 -right-1 h-4 min-w-4 px-1 rounded-full text-[10px] font-bold flex items-center justify-center"
              style={{ background: accent, color: '#fff' }}
            >
              {cartCount}
            </span>
          )}
        </button>
      </div>
    </header>
  )
}

function StorefrontFooterShim(props: any) {
  const { variant, tenantName, desc, email, phone, loc, t, primary, accent, text, bg, radius, fontHead, cats } = props
  const year = new Date().getFullYear()

  if (variant === 'footer-minimal') {
    return (
      <footer className="px-4 sm:px-8 py-8 mt-12" style={{ background: primary, color: '#fff' }}>
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="font-bold" style={{ fontFamily: fontHead }}>{tenantName}</div>
          <div className="text-xs opacity-70">© {year} · {t('brand.tagline')}</div>
        </div>
      </footer>
    )
  }

  if (variant === 'footer-mega') {
    return (
      <footer className="px-4 sm:px-8 py-12 mt-12" style={{ background: text, color: bg }}>
        <div className="max-w-7xl mx-auto grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <div className="font-bold text-lg mb-2" style={{ fontFamily: fontHead, color: accent }}>{tenantName}</div>
            {desc && <p className="text-sm opacity-70">{desc}</p>}
          </div>
          <div>
            <div className="font-bold text-sm mb-3 opacity-90">{t('store.categories')}</div>
            <ul className="space-y-1 text-sm opacity-70">
              {cats.slice(0, 5).map((c: any) => (
                <li key={c.id}>{loc(c)}</li>
              ))}
            </ul>
          </div>
          <div>
            <div className="font-bold text-sm mb-3 opacity-90">{t('store.contact')}</div>
            <ul className="space-y-1 text-sm opacity-70">
              {email && <li>{email}</li>}
              {phone && <li>{phone}</li>}
            </ul>
          </div>
          <div>
            <div className="font-bold text-sm mb-3 opacity-90">{t('store.about')}</div>
            <ul className="space-y-1 text-sm opacity-70">
              <li>{t('store.home')}</li>
              <li>{t('store.about')}</li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-8 pt-4 border-t border-white/20 text-xs opacity-60 text-center">
          © {year} {tenantName} · All rights reserved
        </div>
      </footer>
    )
  }

  // footer-center
  return (
    <footer className="px-4 sm:px-8 py-10 mt-12 text-center" style={{ background: `${primary}08`, color: text }}>
      <div className="max-w-3xl mx-auto">
        <div className="font-bold text-xl mb-2" style={{ fontFamily: fontHead, color: primary }}>{tenantName}</div>
        {desc && <p className="text-sm opacity-70 mb-4">{desc}</p>}
        {email && (
          <div className="flex items-center justify-center gap-2 text-sm opacity-80 mb-3">
            {email}
            {phone && <><span className="mx-2">·</span>{phone}</>}
          </div>
        )}
        <div className="text-xs opacity-60">© {year} {tenantName}</div>
      </div>
    </footer>
  )
}

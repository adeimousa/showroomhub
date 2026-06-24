'use client'

import { useI18n } from '@/hooks/use-i18n'
import { useCartStore } from '@/hooks/use-cart'
import { ProductDetailLayout } from './product-detail-layout'
import { CartDrawer } from './cart-drawer'
import { LanguageSwitcher } from '@/components/language-switcher'
import { ShoppingCart } from 'lucide-react'
import { loc as locHelper } from '@/lib/loc'
import { useMemo, useEffect } from 'react'
import { buildTenantUrl } from '@/lib/utils'

/**
 * Client component for the tenant product page.
 * Renders the tenant's storefront header + product detail + footer.
 */
export function ProductPageClient({ tenant, product }: { tenant: any; product: any }) {
  const { t, lang, isRTL } = useI18n()
  const cartStore = useCartStore()
  const layout = tenant.layout

  // Initialize cart for this tenant
  useEffect(() => {
    cartStore.initForTenant(tenant.slug)
  }, [tenant.slug])

  const loc = (obj: any, field: string = 'name') => locHelper(obj, field, lang)

  const related = useMemo(() => {
    return tenant.products
      .filter((p: any) => p.id !== product.id && p.category?.id === product.category?.id)
      .slice(0, 5)
  }, [product, tenant.products])

  // Helper to generate product URL - uses buildTenantUrl to preserve ?host= in local dev
  const getProductUrl = (productId: string) => {
    return buildTenantUrl(`/product/${productId}`)
  }

  if (!layout) {
    return (
      <div className="min-h-screen bg-slate-100" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur text-white px-4 py-1.5 flex items-center justify-between text-xs">
          <button onClick={() => window.location.href = buildTenantUrl('/')} className="opacity-70 hover:opacity-100 bg-transparent border-0 cursor-pointer text-white">← Back to store</button>
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

  // Extract theme variables from layout and tenant
  const primary = tenant.themePrimary || layout.primaryColor
  const accent = tenant.themeAccent || layout.accentColor
  const bgColor = tenant.themeBg || layout.bgColor
  const textColor = layout.textColor
  const fontHeading = layout.fontHeading
  const fontBody = tenant.themeFont || layout.fontBody
  const radius = layout.borderRadius

  const fontVar = (name: string) => `var(--font-${name.toLowerCase().replace(/\s/g, '-')})`

  const cssVars: React.CSSProperties = {
    // @ts-expect-error custom props
    '--sf-primary': primary,
    '--sf-accent': accent,
    '--sf-bg': bgColor,
    '--sf-text': textColor,
    '--sf-radius': `${radius}px`,
    '--sf-font-head': fontVar(fontHeading),
    '--sf-font-body': fontVar(fontBody),
    background: bgColor,
    color: textColor,
    fontFamily: fontVar(fontBody),
    minHeight: '100vh',
  }

  return (
    <div style={cssVars} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Storefront header (uses the layout's headerStyle) */}
      <StorefrontHeaderShim
        variant={layout.headerStyle}
        tenantName={loc(tenant, 'name')}
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

      {/* Product detail */}
      <ProductDetailLayout
        product={product}
        tenant={tenant}
        lang={lang}
        related={related}
        onSelectRelated={(p) => { window.location.href = getProductUrl(p.id) }}
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

      <CartDrawer tenant={tenant} />
    </div>
  )
}

// ============================================================
// Storefront Header Shim
// ============================================================

function StorefrontHeaderShim(props: any) {
  const { variant, tenantName, cats, loc, t, cartCount, onOpenCart, primary, accent, text, bg, fontHead } = props

  return (
    <header
      style={variant === 'minimal-bar' ? { background: primary, color: '#fff' } : { background: bg, color: text, borderBottom: `1px solid ${text}15` }}
      className="px-4 sm:px-8 py-3 flex items-center justify-between sticky top-0 z-40"
    >
      <div className="flex items-center gap-6">
        <button
          onClick={() => window.location.href = buildTenantUrl('/')}
          className="font-bold text-lg bg-transparent border-0 cursor-pointer"
          style={{ fontFamily: fontHead }}
        >
          {tenantName}
        </button>
        <nav className="hidden md:flex gap-5 text-sm">
          <button
            onClick={() => window.location.href = buildTenantUrl('/')}
            className="opacity-90 hover:opacity-100 bg-transparent border-0 cursor-pointer"
          >
            {t('store.home')}
          </button>
          {cats.slice(0, 4).map((c: any) => (
            <button
              key={c.id}
              onClick={() => window.location.href = buildTenantUrl(`/?category=${c.id}`)}
              className="opacity-90 hover:opacity-100 bg-transparent border-0 cursor-pointer"
            >
              {loc(c)}
            </button>
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
        <LanguageSwitcher />
      </div>
    </header>
  )
}

// ============================================================
// Storefront Footer Shim
// ============================================================

function StorefrontFooterShim(props: any) {
  const { variant, tenantName, desc, email, phone, loc, t, primary, accent, text, bg, fontHead, cats } = props
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
            <div className="font-bold text-sm mb-3 opacity-90">{t('store.followUs')}</div>
            <div className="text-xs opacity-70">Connect with us on social media</div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-8 pt-6 border-t border-white/10 text-xs opacity-50 text-center">
          © {year} {tenantName} · {t('brand.tagline')}
        </div>
      </footer>
    )
  }

  // Default footer-standard
  return (
    <footer className="px-4 sm:px-8 py-8 mt-12" style={{ background: bg, color: text, borderTop: `1px solid ${text}15` }}>
      <div className="max-w-7xl mx-auto">
        <div className="grid sm:grid-cols-3 gap-6 mb-6">
          <div>
            <div className="font-bold mb-2" style={{ fontFamily: fontHead, color: primary }}>{tenantName}</div>
            {desc && <p className="text-xs opacity-70">{desc}</p>}
          </div>
          <div>
            <div className="font-bold text-sm mb-2 opacity-90">{t('store.contact')}</div>
            <ul className="text-xs opacity-70 space-y-1">
              {email && <li>{email}</li>}
              {phone && <li>{phone}</li>}
            </ul>
          </div>
          <div>
            <div className="font-bold text-sm mb-2 opacity-90">{t('store.categories')}</div>
            <ul className="text-xs opacity-70 space-y-1">
              {cats.slice(0, 4).map((c: any) => (
                <li key={c.id}>{loc(c)}</li>
              ))}
            </ul>
          </div>
        </div>
        <div className="text-xs opacity-50 text-center pt-4 border-t" style={{ borderColor: `${text}15` }}>
          © {year} {tenantName} · {t('brand.tagline')}
        </div>
      </div>
    </footer>
  )
}

'use client'

/**
 * StorefrontRenderer
 *
 * Reads the layout config (headerStyle / heroStyle / productGrid / footerStyle)
 * combined with the tenant's theme overrides, and produces a distinct storefront
 * for each of the 30 layouts.
 *
 * Implementation strategy:
 *   - We build CSS variables from the layout + tenant theme.
 *   - The 4 header styles + 4 hero styles + 4 product grids + 3 footer styles
 *     combine to ~192 unique permutations. We render each variant with its own
 *     JSX branch so every layout looks visibly different.
 */

import { useState } from 'react'
import { Search, ShoppingCart, Heart, Menu, X, Phone, Mail, MapPin, Facebook, Instagram, Twitter, Star, ChevronRight } from 'lucide-react'

type Props = {
  tenant: any
  layout: any
  lang: 'en' | 'ar' | 'he'
  loc: (obj: any, field?: string) => string
  t: (key: string, fallback?: string) => string
  isRTL: boolean
  cartCount: number
  onAddToCart: (product: any) => void
  onOpenCart: () => void
}

export function StorefrontRenderer({ tenant, layout, lang, loc, t, isRTL, cartCount, onAddToCart, onOpenCart }: Props) {
  // Resolve final style: tenant override wins over layout default
  const primary     = tenant.themePrimary  || layout.primaryColor
  const accent      = tenant.themeAccent   || layout.accentColor
  const bgColor     = tenant.themeBg       || layout.bgColor
  const textColor   = layout.textColor
  const fontHeading = layout.fontHeading
  const fontBody    = tenant.themeFont     || layout.fontBody
  const radius      = layout.borderRadius
  const anim        = layout.animation

  // Helper: convert a font name to a CSS var, e.g. "Space Grotesk" -> "var(--font-space-grotesk)"
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

  const name = loc(tenant, 'name')
  const desc = loc(tenant, 'description')
  const featured = tenant.products.filter((p: any) => p.featured).slice(0, 6)
  const all = tenant.products.slice(0, 12)
  const activeSlides = tenant.heroSlides.filter((s: any) => s.active).sort((a: any, b: any) => a.order - b.order)
  const slide = activeSlides[0]
  const cats = tenant.categories

  return (
    <div style={cssVars} dir={isRTL ? 'rtl' : 'ltr'}>
      <Header
        variant={layout.headerStyle}
        tenantName={name}
        cats={cats}
        loc={loc}
        t={t}
        cartCount={cartCount}
        onOpenCart={onOpenCart}
        primary={primary}
        accent={accent}
        text={textColor}
        bg={bgColor}
        radius={radius}
        fontHead={fontVar(fontHeading)}
      />

      <Hero
        variant={layout.heroStyle}
        slide={slide}
        loc={loc}
        t={t}
        primary={primary}
        accent={accent}
        text={textColor}
        bg={bgColor}
        radius={radius}
        fontHead={fontVar(fontHeading)}
        anim={anim}
        isRTL={isRTL}
      />

      {/* Categories strip */}
      <CategoriesStrip cats={cats} loc={loc} t={t} primary={primary} accent={accent} radius={radius} />

      {/* Featured section */}
      {featured.length > 0 && (
        <Section
          title={t('store.featured')}
          accent={accent}
          fontHead={fontVar(fontHeading)}
        >
          <ProductGrid
            variant={layout.productGrid}
            products={featured}
            loc={loc}
            t={t}
            primary={primary}
            accent={accent}
            text={textColor}
            bg={bgColor}
            radius={radius}
            onAddToCart={onAddToCart}
          />
        </Section>
      )}

      {/* All products */}
      <Section
        title={t('store.allProducts')}
        accent={accent}
        fontHead={fontVar(fontHeading)}
      >
        <ProductGrid
          variant={layout.productGrid}
          products={all}
          loc={loc}
          t={t}
          primary={primary}
          accent={accent}
          text={textColor}
          bg={bgColor}
          radius={radius}
          onAddToCart={onAddToCart}
        />
      </Section>

      <Footer
        variant={layout.footerStyle}
        tenantName={name}
        desc={desc}
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
        cats={cats}
      />
    </div>
  )
}

// ============================================================
// HEADER VARIANTS
// ============================================================

function CartButton({ count, onOpen, accent, primary, light, label }: { count: number; onOpen: () => void; accent: string; primary: string; light?: boolean; label: string }) {
  return (
    <button
      onClick={onOpen}
      className="relative p-1.5 rounded-md hover:bg-white/10 transition-colors"
      aria-label={label}
    >
      <ShoppingCart className="h-4 w-4" style={{ color: light ? '#fff' : primary }} />
      {count > 0 && (
        <span
          className="absolute -top-1 -right-1 h-4 min-w-4 px-1 rounded-full text-[10px] font-bold flex items-center justify-center"
          style={{ background: accent, color: '#fff' }}
        >
          {count}
        </span>
      )}
    </button>
  )
}

function Header({ variant, tenantName, cats, loc, t, cartCount, onOpenCart, primary, accent, text, bg, radius, fontHead }: any) {
  const [open, setOpen] = useState(false)

  if (variant === 'minimal-bar') {
    return (
      <header style={{ background: primary, color: '#fff' }} className="px-4 sm:px-8 py-3 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-6">
          <div className="font-bold text-lg" style={{ fontFamily: fontHead }}>{tenantName}</div>
          <nav className="hidden md:flex gap-5 text-sm">
            <a href="#" className="opacity-90 hover:opacity-100">{t('store.home')}</a>
            {cats.slice(0, 4).map((c: any) => (
              <a key={c.id} href="#" className="opacity-90 hover:opacity-100">{loc(c)}</a>
            ))}
            <a href="#" className="opacity-90 hover:opacity-100">{t('store.about')}</a>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <Search className="h-4 w-4 opacity-90" />
          <Heart className="h-4 w-4 opacity-90 hidden sm:inline" />
          <CartButton count={cartCount} onOpen={onOpenCart} accent={accent} primary={primary} light label={t('cart.title')} />
          <button className="md:hidden" onClick={() => setOpen(!open)}>
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
        {open && (
          <div className="absolute top-full left-0 right-0 md:hidden p-4 flex flex-col gap-3" style={{ background: primary }}>
            <a href="#" onClick={() => setOpen(false)}>{t('store.home')}</a>
            {cats.map((c: any) => (
              <a key={c.id} href="#" onClick={() => setOpen(false)}>{loc(c)}</a>
            ))}
          </div>
        )}
      </header>
    )
  }

  if (variant === 'split-nav') {
    return (
      <header style={{ background: bg, color: text, borderBottom: `1px solid ${text}15` }} className="px-4 sm:px-8 py-4 sticky top-0 z-40">
        <div className="grid grid-cols-3 items-center max-w-7xl mx-auto">
          <nav className="flex gap-4 text-sm">
            <a href="#" className="hover:opacity-70 hidden sm:inline">{t('store.home')}</a>
            {cats.slice(0, 2).map((c: any) => (
              <a key={c.id} href="#" className="hover:opacity-70 hidden sm:inline">{loc(c)}</a>
            ))}
            <button className="sm:hidden" onClick={() => setOpen(!open)}>{open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}</button>
          </nav>
          <div className="text-center font-bold text-lg" style={{ fontFamily: fontHead, color: primary }}>{tenantName}</div>
          <div className="flex items-center gap-3 justify-end text-sm">
            <Search className="h-4 w-4" style={{ color: primary }} />
            <CartButton count={cartCount} onOpen={onOpenCart} accent={accent} primary={primary} label={t('cart.title')} />
          </div>
        </div>
        {open && (
          <div className="sm:hidden mt-3 flex flex-col gap-2">
            <a href="#">{t('store.home')}</a>
            {cats.map((c: any) => <a key={c.id} href="#">{loc(c)}</a>)}
          </div>
        )}
      </header>
    )
  }

  if (variant === 'centered-logo') {
    return (
      <header style={{ background: bg, color: text, borderBottom: `1px solid ${text}10` }} className="px-4 sm:px-8 py-5 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto">
          <div className="text-center font-bold text-2xl mb-3" style={{ fontFamily: fontHead, color: primary }}>{tenantName}</div>
          <nav className="flex items-center justify-center gap-6 text-sm">
            <a href="#" className="hover:opacity-70">{t('store.home')}</a>
            {cats.slice(0, 4).map((c: any) => (
              <a key={c.id} href="#" className="hover:opacity-70 hidden sm:inline">{loc(c)}</a>
            ))}
            <a href="#" className="hover:opacity-70">{t('store.about')}</a>
            <a href="#" className="hover:opacity-70 hidden sm:inline">{t('store.contact')}</a>
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4" style={{ color: primary }} />
              <CartButton count={cartCount} onOpen={onOpenCart} accent={accent} primary={primary} label={t('cart.title')} />
            </div>
          </nav>
        </div>
      </header>
    )
  }

  // Default: minimal-bar style
  return null
}

// ============================================================
// HERO VARIANTS
// ============================================================

function Hero({ variant, slide, loc, t, primary, accent, text, bg, radius, fontHead, anim, isRTL }: any) {
  if (!slide) return null

  const animClass = anim === 'fade' ? 'opacity-0 animate-[fadeIn_0.6s_ease-out_forwards]'
                  : anim === 'slide' ? 'opacity-0 animate-[slideIn_0.6s_ease-out_forwards]'
                  : anim === 'zoom' ? 'opacity-0 animate-[zoomIn_0.6s_ease-out_forwards]'
                  : ''

  if (variant === 'split-image') {
    return (
      <section className="px-4 sm:px-8 py-10 lg:py-16">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-8 items-center">
          <div className={animClass}>
            <div className="text-xs font-medium mb-3" style={{ color: accent }}>{t('store.shopNow').toUpperCase()}</div>
            <h1 className="text-4xl lg:text-5xl font-bold mb-4 leading-tight" style={{ fontFamily: fontHead, color: primary }}>
              {loc(slide, 'title')}
            </h1>
            {slide.subtitle && (
              <p className="text-base lg:text-lg mb-6 opacity-70 max-w-md">{loc(slide, 'subtitle')}</p>
            )}
            <button
              className="inline-flex items-center gap-2 px-6 py-3 text-white text-sm font-medium hover:opacity-90"
              style={{ background: primary, borderRadius: radius }}
            >
              {slide.ctaText || t('store.shopNow')}
              <ChevronRight className="h-4 w-4" style={{ transform: isRTL ? 'scaleX(-1)' : '' }} />
            </button>
          </div>
          <div
            className="aspect-square lg:aspect-[4/3] flex items-center justify-center text-9xl rounded-xl"
            style={{ background: `linear-gradient(135deg, ${primary}15, ${accent}25)`, borderRadius: radius }}
          >
            {slide.image || '🛋️'}
          </div>
        </div>
      </section>
    )
  }

  if (variant === 'full-bleed') {
    return (
      <section
        className="px-4 sm:px-8 py-16 lg:py-24 text-center"
        style={{ background: `linear-gradient(135deg, ${primary}, ${primary}dd)` }}
      >
        <div className={`max-w-3xl mx-auto text-white ${animClass}`}>
          <div className="text-7xl lg:text-9xl mb-6">{slide.image || '🛋️'}</div>
          <h1 className="text-4xl lg:text-6xl font-bold mb-4 leading-tight" style={{ fontFamily: fontHead }}>
            {loc(slide, 'title')}
          </h1>
          {slide.subtitle && (
            <p className="text-base lg:text-xl mb-8 opacity-80">{loc(slide, 'subtitle')}</p>
          )}
          <button
            className="inline-flex items-center gap-2 px-8 py-4 text-sm font-medium hover:opacity-90"
            style={{ background: accent, color: '#fff', borderRadius: radius }}
          >
            {slide.ctaText || t('store.shopNow')}
            <ChevronRight className="h-4 w-4" style={{ transform: isRTL ? 'scaleX(-1)' : '' }} />
          </button>
        </div>
      </section>
    )
  }

  if (variant === 'carousel') {
    return (
      <section className="px-4 sm:px-8 py-10">
        <div className="max-w-7xl mx-auto grid sm:grid-cols-3 gap-3">
          {[0, 1, 2].map((i) => {
            const s = i === 0 ? slide : null
            return (
              <div
                key={i}
                className={`p-6 sm:p-8 flex flex-col justify-end min-h-[200px] ${i === 0 ? animClass : ''}`}
                style={{
                  background: i === 0 ? `linear-gradient(135deg, ${primary}, ${accent}88)` : `${primary}10`,
                  borderRadius: radius,
                  color: i === 0 ? '#fff' : text,
                }}
              >
                <div className="text-3xl mb-2">{s?.image || ['🛋️', '🪑', '🛏️'][i]}</div>
                <div className="font-bold text-lg" style={{ fontFamily: fontHead }}>
                  {s ? loc(s, 'title') : ['Living Room', 'Dining', 'Bedroom'][i]}
                </div>
                {s?.subtitle && <div className="text-xs opacity-80 mt-1">{loc(s, 'subtitle')}</div>}
                {!s && <div className="text-xs opacity-60 mt-1">Explore collection</div>}
              </div>
            )
          })}
        </div>
      </section>
    )
  }

  if (variant === 'grid-cells') {
    return (
      <section className="px-4 sm:px-8 py-10">
        <div className="max-w-7xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div
            className={`col-span-2 row-span-2 p-6 sm:p-10 flex flex-col justify-end min-h-[300px] ${animClass}`}
            style={{ background: `linear-gradient(135deg, ${primary}, ${accent})`, color: '#fff', borderRadius: radius }}
          >
            <div className="text-5xl mb-3">{slide.image || '🛋️'}</div>
            <h2 className="text-2xl lg:text-3xl font-bold mb-2" style={{ fontFamily: fontHead }}>{loc(slide, 'title')}</h2>
            {slide.subtitle && <p className="text-sm opacity-80">{loc(slide, 'subtitle')}</p>}
            <button className="mt-4 self-start px-4 py-2 text-xs font-medium bg-white/20 hover:bg-white/30" style={{ borderRadius: radius }}>
              {slide.ctaText || t('store.shopNow')}
            </button>
          </div>
          {['NEW', 'SALE', 'TREND', 'HOT'].map((label, i) => (
            <div
              key={label}
              className="p-5 flex flex-col items-center justify-center min-h-[140px]"
              style={{
                background: i % 2 === 0 ? `${primary}15` : `${accent}15`,
                borderRadius: radius,
                color: primary,
              }}
            >
              <div className="text-2xl mb-1">{['🪑', '🛏️', '💡', '🪵'][i]}</div>
              <div className="font-bold text-sm" style={{ fontFamily: fontHead }}>{label}</div>
            </div>
          ))}
        </div>
      </section>
    )
  }

  return null
}

// ============================================================
// CATEGORIES STRIP
// ============================================================

function CategoriesStrip({ cats, loc, t, primary, accent, radius }: any) {
  if (cats.length === 0) return null
  return (
    <section className="px-4 sm:px-8 py-6 border-y" style={{ borderColor: `${primary}15` }}>
      <div className="max-w-7xl mx-auto flex flex-wrap gap-3 justify-center">
        {cats.map((c: any) => (
          <a
            key={c.id}
            href="#"
            className="flex items-center gap-2 px-4 py-2 text-sm hover:scale-105 transition-transform"
            style={{ background: `${primary}08`, borderRadius: radius, color: primary }}
          >
            <span className="text-lg">{c.icon}</span>
            <span className="font-medium">{loc(c)}</span>
            <span className="text-xs opacity-60">({c._count?.products ?? 0})</span>
          </a>
        ))}
      </div>
    </section>
  )
}

// ============================================================
// SECTION
// ============================================================

function Section({ title, accent, fontHead, children }: any) {
  return (
    <section className="px-4 sm:px-8 py-10">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl lg:text-3xl font-bold" style={{ fontFamily: fontHead }}>
            {title}
          </h2>
          <div className="h-1 w-12" style={{ background: accent }} />
        </div>
        {children}
      </div>
    </section>
  )
}

// ============================================================
// PRODUCT GRID VARIANTS
// ============================================================

function ProductGrid({ variant, products, loc, t, primary, accent, text, bg, radius, onAddToCart }: any) {
  if (products.length === 0) {
    return <div className="text-center py-12 text-muted-foreground">{t('common.noResults')}</div>
  }

  if (variant === '3-col-cards') {
    return (
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {products.map((p: any) => (
          <ProductCard key={p.id} p={p} loc={loc} t={t} primary={primary} accent={accent} text={text} radius={radius} onAddToCart={onAddToCart} />
        ))}
      </div>
    )
  }

  if (variant === '4-col-tight') {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        {products.map((p: any) => (
          <ProductCard key={p.id} p={p} loc={loc} t={t} primary={primary} accent={accent} text={text} radius={radius} onAddToCart={onAddToCart} compact />
        ))}
      </div>
    )
  }

  if (variant === 'masonry') {
    return (
      <div className="columns-2 lg:columns-3 gap-4 [&>*]:mb-4">
        {products.map((p: any, i: number) => (
          <div key={p.id} className="break-inside-avoid">
            <ProductCard p={p} loc={loc} t={t} primary={primary} accent={accent} text={text} radius={radius} onAddToCart={onAddToCart} varyingHeight={i % 3} />
          </div>
        ))}
      </div>
    )
  }

  if (variant === 'list-rows') {
    return (
      <div className="space-y-2">
        {products.map((p: any) => (
          <ProductRow key={p.id} p={p} loc={loc} t={t} primary={primary} accent={accent} text={text} radius={radius} onAddToCart={onAddToCart} />
        ))}
      </div>
    )
  }

  return null
}

function ProductCard({ p, loc, t, primary, accent, text, radius, onAddToCart, compact, varyingHeight }: any) {
  const discount = p.compareAt && p.compareAt > p.price
    ? Math.round((1 - p.price / p.compareAt) * 100)
    : 0
  const heights = ['min-h-[180px]', 'min-h-[240px]', 'min-h-[300px]']
  return (
    <div
      className="group overflow-hidden hover:shadow-lg transition-shadow"
      style={{ background: text + '06', borderRadius: radius, border: `1px solid ${text}10` }}
    >
      <div
        className={`flex items-center justify-center text-6xl relative ${compact ? 'aspect-square' : varyingHeight != null ? heights[varyingHeight] : 'aspect-[4/3]'}`}
        style={{ background: `${primary}08` }}
      >
        {p.image || '📦'}
        {discount > 0 && (
          <span
            className="absolute top-2 left-2 px-1.5 py-0.5 text-[10px] font-bold text-white"
            style={{ background: accent, borderRadius: radius / 2 }}
          >
            -{discount}% {t('store.off')}
          </span>
        )}
        {p.featured && (
          <span className="absolute top-2 right-2 h-5 w-5 rounded-full bg-amber-400 flex items-center justify-center">
            <Star className="h-3 w-3 fill-white text-white" />
          </span>
        )}
      </div>
      <div className={compact ? 'p-2' : 'p-3'}>
        <div className="text-[10px] opacity-60 mb-0.5">{p.category ? `${p.category.icon} ${loc(p.category)}` : ''}</div>
        <div className={`font-medium line-clamp-1 ${compact ? 'text-xs' : 'text-sm'}`}>{loc(p)}</div>
        {!compact && p.description && (
          <div className="text-xs opacity-60 line-clamp-2 mt-1">{p.description}</div>
        )}
        <div className="flex items-center justify-between mt-2">
          <div>
            <span className="font-bold text-sm">${p.price.toLocaleString()}</span>
            {discount > 0 && (
              <span className="ml-1 text-xs line-through opacity-50">${p.compareAt.toLocaleString()}</span>
            )}
          </div>
          <button
            onClick={() => onAddToCart(p)}
            disabled={p.stock <= 0}
            className="px-2 py-1 text-[10px] font-medium text-white disabled:opacity-40 hover:opacity-90"
            style={{ background: primary, borderRadius: radius / 2 }}
          >
            {p.stock > 0 ? t('store.addToCart') : t('store.outOfStock')}
          </button>
        </div>
      </div>
    </div>
  )
}

function ProductRow({ p, loc, t, primary, accent, text, radius, onAddToCart }: any) {
  const discount = p.compareAt && p.compareAt > p.price
    ? Math.round((1 - p.price / p.compareAt) * 100)
    : 0
  return (
    <div
      className="flex items-center gap-4 p-3 hover:shadow-md transition-shadow"
      style={{ background: text + '06', borderRadius: radius, border: `1px solid ${text}10` }}
    >
      <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-lg flex items-center justify-center text-3xl shrink-0" style={{ background: `${primary}08` }}>
        {p.image || '📦'}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[10px] opacity-60">{p.category ? `${p.category.icon} ${loc(p.category)}` : ''}</div>
        <div className="font-medium line-clamp-1">{loc(p)}</div>
        {p.description && <div className="text-xs opacity-60 line-clamp-1 hidden sm:block">{p.description}</div>}
        <div className="flex items-center gap-2 mt-0.5">
          <span className="font-bold text-sm">${p.price.toLocaleString()}</span>
          {discount > 0 && <span className="text-xs line-through opacity-50">${p.compareAt.toLocaleString()}</span>}
        </div>
      </div>
      <div className="text-right shrink-0">
        {discount > 0 && (
          <div className="text-[10px] font-bold mb-1" style={{ color: accent }}>-{discount}% {t('store.off')}</div>
        )}
        <button
          onClick={() => onAddToCart(p)}
          disabled={p.stock <= 0}
          className="px-3 py-1.5 text-xs font-medium text-white disabled:opacity-40 hover:opacity-90"
          style={{ background: primary, borderRadius: radius / 2 }}
        >
          {p.stock > 0 ? t('store.addToCart') : t('store.outOfStock')}
        </button>
      </div>
    </div>
  )
}

// ============================================================
// FOOTER VARIANTS
// ============================================================

function Footer({ variant, tenantName, desc, email, phone, loc, t, primary, accent, text, bg, radius, fontHead, cats }: any) {
  if (variant === 'footer-minimal') {
    return (
      <footer className="px-4 sm:px-8 py-8 mt-12" style={{ background: primary, color: '#fff' }}>
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="font-bold" style={{ fontFamily: fontHead }}>{tenantName}</div>
          <div className="text-xs opacity-70">© {new Date().getFullYear()} · {t('brand.tagline')}</div>
          <div className="flex gap-3">
            <Facebook className="h-4 w-4 opacity-70 hover:opacity-100 cursor-pointer" />
            <Instagram className="h-4 w-4 opacity-70 hover:opacity-100 cursor-pointer" />
            <Twitter className="h-4 w-4 opacity-70 hover:opacity-100 cursor-pointer" />
          </div>
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
            <div className="flex gap-2 mt-3">
              <Facebook className="h-4 w-4 opacity-70 hover:opacity-100 cursor-pointer" />
              <Instagram className="h-4 w-4 opacity-70 hover:opacity-100 cursor-pointer" />
              <Twitter className="h-4 w-4 opacity-70 hover:opacity-100 cursor-pointer" />
            </div>
          </div>
          <div>
            <div className="font-bold text-sm mb-3 opacity-90">{t('store.categories')}</div>
            <ul className="space-y-1 text-sm opacity-70">
              {cats.slice(0, 5).map((c: any) => (
                <li key={c.id}><a href="#" className="hover:opacity-100">{loc(c)}</a></li>
              ))}
            </ul>
          </div>
          <div>
            <div className="font-bold text-sm mb-3 opacity-90">{t('store.about')}</div>
            <ul className="space-y-1 text-sm opacity-70">
              <li><a href="#" className="hover:opacity-100">Our Story</a></li>
              <li><a href="#" className="hover:opacity-100">Craftsmanship</a></li>
              <li><a href="#" className="hover:opacity-100">Sustainability</a></li>
              <li><a href="#" className="hover:opacity-100">Careers</a></li>
            </ul>
          </div>
          <div>
            <div className="font-bold text-sm mb-3 opacity-90">{t('store.contact')}</div>
            <ul className="space-y-1 text-sm opacity-70">
              {email && <li className="flex items-center gap-2"><Mail className="h-3.5 w-3.5" /> {email}</li>}
              {phone && <li className="flex items-center gap-2"><Phone className="h-3.5 w-3.5" /> {phone}</li>}
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-8 pt-4 border-t border-white/20 text-xs opacity-60 text-center">
          © {new Date().getFullYear()} {tenantName} · All rights reserved
        </div>
      </footer>
    )
  }

  if (variant === 'footer-center') {
    return (
      <footer className="px-4 sm:px-8 py-10 mt-12 text-center" style={{ background: `${primary}08`, color: text }}>
        <div className="max-w-3xl mx-auto">
          <div className="font-bold text-xl mb-2" style={{ fontFamily: fontHead, color: primary }}>{tenantName}</div>
          {desc && <p className="text-sm opacity-70 mb-4">{desc}</p>}
          {email && (
            <div className="flex items-center justify-center gap-2 text-sm opacity-80 mb-3">
              <Mail className="h-3.5 w-3.5" /> {email}
              {phone && <><span className="mx-2">·</span><Phone className="h-3.5 w-3.5" /> {phone}</>}
            </div>
          )}
          <div className="flex justify-center gap-3 mb-4">
            <Facebook className="h-4 w-4 opacity-70 hover:opacity-100 cursor-pointer" />
            <Instagram className="h-4 w-4 opacity-70 hover:opacity-100 cursor-pointer" />
            <Twitter className="h-4 w-4 opacity-70 hover:opacity-100 cursor-pointer" />
          </div>
          <div className="text-xs opacity-60">© {new Date().getFullYear()} {tenantName}</div>
        </div>
      </footer>
    )
  }

  return null
}

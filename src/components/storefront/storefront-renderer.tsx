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

import { useState, useRef, useMemo } from 'react'
import { Search, ShoppingCart, Heart, Menu, X, Phone, Mail, MapPin, Facebook, Instagram, Twitter, Star, ChevronRight, Eye, ArrowLeft } from 'lucide-react'

type TranslateFn = (key: string, fallback?: string, vars?: Record<string, string | number>) => string

type Props = {
  tenant: any
  layout: any
  lang: 'en' | 'ar' | 'he'
  loc: (obj: any, field?: string) => string
  t: TranslateFn
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

  // New style properties
  const cardStyle    = layout.cardStyle    || 'shadow'
  const spacing      = layout.spacing      || 'normal'
  const imageStyle   = layout.imageStyle   || 'rounded'
  const buttonStyle  = layout.buttonStyle  || 'solid'
  const navPosition  = layout.navPosition  || 'top'

  // Helper: convert a font name to a CSS var, e.g. "Space Grotesk" -> "var(--font-space-grotesk)"
  const fontVar = (name: string) => `var(--font-${name.toLowerCase().replace(/\s/g, '-')})`

  // Helper: get spacing class based on spacing mode
  const getSpacingClass = () => {
    switch (spacing) {
      case 'compact': return 'py-6'
      case 'spacious': return 'py-14'
      case 'minimal': return 'py-4'
      default: return 'py-10'
    }
  }

  // Helper: get grid gap based on spacing mode
  const getGridGap = () => {
    switch (spacing) {
      case 'compact': return 'gap-2'
      case 'spacious': return 'gap-6'
      case 'minimal': return 'gap-1'
      default: return 'gap-4'
    }
  }

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

  // ------- Filtering & search state -------
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const productsSectionRef = useRef<HTMLDivElement>(null)
  const topRef = useRef<HTMLDivElement>(null)

  // Filtered products: when a category is selected OR a search query is active,
  // we show a single "results" section instead of the featured + all split.
  const filteredProducts = useMemo(() => {
    let list = tenant.products
    if (selectedCategoryId) {
      list = list.filter((p: any) => p.category?.id === selectedCategoryId)
    }
    const q = searchQuery.trim().toLowerCase()
    if (q) {
      list = list.filter((p: any) => {
        const en = (p.name || '').toLowerCase()
        const ar = (p.nameAr || '').toLowerCase()
        const he = (p.nameHe || '').toLowerCase()
        const descEn = (p.description || '').toLowerCase()
        const descAr = (p.descriptionAr || '').toLowerCase()
        const descHe = (p.descriptionHe || '').toLowerCase()
        const sku = (p.sku || '').toLowerCase()
        return en.includes(q) || ar.includes(q) || he.includes(q)
          || descEn.includes(q) || descAr.includes(q) || descHe.includes(q)
          || sku.includes(q)
      })
    }
    return list
  }, [tenant.products, selectedCategoryId, searchQuery])

  const isFiltering = !!selectedCategoryId || !!searchQuery.trim()
  const selectedCategory = selectedCategoryId ? cats.find((c: any) => c.id === selectedCategoryId) : null

  // ------- Scroll helpers -------
  const scrollToProducts = () => {
    if (typeof document !== 'undefined') {
      const el = document.getElementById('storefront-products-section')
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }
  }
  const scrollToTop = () => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }
  const scrollToFooter = () => {
    if (typeof document !== 'undefined') {
      const el = document.getElementById('storefront-footer')
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }
  }

  // ------- Category / search handlers -------
  const handleSelectCategory = (catId: string | null) => {
    setSelectedCategoryId(catId)
    // Clear search when switching categories (avoid double-filter confusion)
    if (catId) setSearchQuery('')
    // Scroll to products so the user sees the filter take effect
    setTimeout(scrollToProducts, 50)
  }
  const handleSearch = (q: string) => {
    setSearchQuery(q)
    // Clear category when searching (search across everything)
    if (q && selectedCategoryId) setSelectedCategoryId(null)
  }
  const handleClearFilter = () => {
    setSelectedCategoryId(null)
    setSearchQuery('')
  }

  // Navigate to the full product page when a card is clicked.
  // Uses URL-based routing so the page can be shared / bookmarked.
  const handleViewDetails = (p: any) => {
    if (typeof window !== 'undefined') {
      window.location.href = `/?view=product&slug=${encodeURIComponent(tenant.slug)}&productId=${encodeURIComponent(p.id)}`
    }
  }

  return (
    <div style={cssVars} dir={isRTL ? 'rtl' : 'ltr'} ref={topRef}>
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
        selectedCategoryId={selectedCategoryId}
        searchQuery={searchQuery}
        onSelectCategory={handleSelectCategory}
        onSearch={handleSearch}
        onHome={scrollToTop}
        onAbout={scrollToFooter}
        onContact={scrollToFooter}
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
        onCtaClick={scrollToProducts}
      />

      {/* Categories strip */}
      <CategoriesStrip
        cats={cats}
        loc={loc}
        t={t}
        primary={primary}
        accent={accent}
        radius={radius}
        selectedCategoryId={selectedCategoryId}
        onSelectCategory={handleSelectCategory}
      />

      {/* Products section — has stable id so we can smooth-scroll to it */}
      <div id="storefront-products-section">
        {isFiltering ? (
          // ------- Filtered view (search OR category selected) -------
          <Section
            title={
              searchQuery.trim()
                ? t('store.searchResults', undefined, { query: searchQuery.trim() })
                : selectedCategory
                ? t('store.showingCategory', undefined, { category: loc(selectedCategory) })
                : t('store.allProducts')
            }
            accent={accent}
            fontHead={fontVar(fontHeading)}
            subtitle={t('store.resultsCount', undefined, { n: filteredProducts.length })}
            action={
              <button
                onClick={handleClearFilter}
                className="text-xs font-medium inline-flex items-center gap-1 px-3 py-1.5 rounded-md border hover:bg-slate-50"
                style={{ borderColor: `${primary}30`, color: primary }}
              >
                <ArrowLeft className="h-3 w-3" style={{ transform: isRTL ? 'scaleX(-1)' : '' }} />
                {t('store.clearFilter')}
              </button>
            }
          >
            {filteredProducts.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-5xl mb-3 opacity-40">🔍</div>
                <p className="text-sm text-muted-foreground">
                  {searchQuery.trim() ? t('store.noProductsMatch') : t('store.noProductsInCategory')}
                </p>
                <button
                  onClick={handleClearFilter}
                  className="mt-3 text-xs font-medium underline"
                  style={{ color: primary }}
                >
                  {t('store.clearFilter')}
                </button>
              </div>
            ) : (
              <ProductGrid
                variant={layout.productGrid}
                products={filteredProducts}
                loc={loc}
                t={t}
                primary={primary}
                accent={accent}
                text={textColor}
                bg={bgColor}
                radius={radius}
                cardStyle={cardStyle}
                spacing={spacing}
                imageStyle={imageStyle}
                buttonStyle={buttonStyle}
                gridGap={getGridGap()}
                onAddToCart={onAddToCart}
                onViewDetails={handleViewDetails}
              />
            )}
          </Section>
        ) : (
          // ------- Default view: featured + all -------
          <>
            {/* Featured section */}
            {featured.length > 0 && (
              <Section
                title={t('store.featured')}
                accent={accent}
                fontHead={fontVar(fontHeading)}
                spacingClass={getSpacingClass()}
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
                  cardStyle={cardStyle}
                  spacing={spacing}
                  imageStyle={imageStyle}
                  buttonStyle={buttonStyle}
                  gridGap={getGridGap()}
                  onAddToCart={onAddToCart}
                  onViewDetails={handleViewDetails}
                />
              </Section>
            )}

            {/* All products */}
            <Section
              title={t('store.allProducts')}
              accent={accent}
              fontHead={fontVar(fontHeading)}
              spacingClass={getSpacingClass()}
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
                cardStyle={cardStyle}
                spacing={spacing}
                imageStyle={imageStyle}
                buttonStyle={buttonStyle}
                gridGap={getGridGap()}
                onAddToCart={onAddToCart}
                onViewDetails={handleViewDetails}
              />
            </Section>
          </>
        )}
      </div>

      <div id="storefront-footer">
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
          onSelectCategory={handleSelectCategory}
          onAbout={scrollToFooter}
          onContact={scrollToFooter}
          onHome={scrollToTop}
        />
      </div>
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

// Reusable search input — used across all 3 header variants
function SearchBox({ value, onChange, onClear, light, placeholder }: {
  value: string
  onChange: (v: string) => void
  onClear?: () => void
  light?: boolean
  placeholder: string
}) {
  return (
    <div className="relative">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus
        className={`text-xs px-2 py-1 rounded-md border outline-none ${
          light ? 'bg-white/15 text-white placeholder-white/60 border-white/30' : 'bg-white text-slate-900 border-slate-200'
        }`}
        style={{ width: 140 }}
      />
      {value && (
        <button
          onClick={onClear}
          className="absolute right-1 top-1/2 -translate-y-1/2"
          aria-label="Clear search"
        >
          <X className={`h-3 w-3 ${light ? 'text-white/70' : 'text-slate-400'}`} />
        </button>
      )}
    </div>
  )
}

// Search toggle button — expands the input when clicked
function SearchToggle({ active, onClick, light, primary, label }: {
  active: boolean
  onClick: () => void
  light?: boolean
  primary: string
  label: string
}) {
  return (
    <button
      onClick={onClick}
      className="p-1 rounded-md hover:bg-white/10 transition-colors"
      aria-label={label}
    >
      <Search className="h-4 w-4" style={{ color: light ? '#fff' : primary }} />
    </button>
  )
}

function Header(props: any) {
  const {
    variant, tenantName, cats, loc, t, cartCount, onOpenCart,
    primary, accent, text, bg, radius, fontHead,
    selectedCategoryId, searchQuery, onSelectCategory, onSearch,
    onHome, onAbout, onContact,
  } = props
  const [open, setOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)

  // Helper for nav link className — highlights the active category
  const navLinkClass = (isActive: boolean) =>
    `cursor-pointer hover:opacity-100 transition-opacity ${isActive ? 'opacity-100 font-semibold' : 'opacity-90'}`

  // Handle category click from header nav
  const handleCatClick = (c: any) => (e: React.MouseEvent) => {
    e.preventDefault()
    onSelectCategory?.(selectedCategoryId === c.id ? null : c.id)
    setOpen(false)
  }

  // Reusable search widget — toggles between icon and input
  const searchWidget = (light = false) => searchOpen
    ? <SearchBox value={searchQuery} onChange={(v) => onSearch?.(v)} onClear={() => { onSearch?.(''); setSearchOpen(false) }} light={light} placeholder={t('store.searchPlaceholder')} />
    : <SearchToggle active={searchOpen} onClick={() => { setSearchOpen(!searchOpen); if (searchOpen) onSearch?.('') }} light={light} primary={primary} label={t('store.searchPlaceholder')} />

  if (variant === 'minimal-bar') {
    return (
      <header style={{ background: primary, color: '#fff' }} className="px-4 sm:px-8 py-3 sticky top-8 z-40">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-6 min-w-0">
            <button
              onClick={() => { onHome?.(); setOpen(false) }}
              className="font-bold text-lg shrink-0"
              style={{ fontFamily: fontHead }}
            >
              {tenantName}
            </button>
            <nav className="hidden md:flex gap-5 text-sm items-center">
              <button onClick={() => { onHome?.() }} className={navLinkClass(null, !selectedCategoryId)}>{t('store.home')}</button>
              {cats.slice(0, 4).map((c: any) => (
                <button
                  key={c.id}
                  onClick={handleCatClick(c)}
                  className={navLinkClass(c.id, selectedCategoryId === c.id)}
                >
                  {loc(c)}
                </button>
              ))}
              <button onClick={() => { onAbout?.() }} className="opacity-90 hover:opacity-100">{t('store.about')}</button>
            </nav>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {searchWidget(true)}
            <CartButton count={cartCount} onOpen={onOpenCart} accent={accent} primary={primary} light label={t('cart.title')} />
            <button className="md:hidden" onClick={() => setOpen(!open)}>
              {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>
        {open && (
          <div className="md:hidden mt-3 pt-3 border-t border-white/20 flex flex-col gap-3 text-sm">
            <button onClick={() => { onHome?.(); setOpen(false) }} className="text-left">{t('store.home')}</button>
            {cats.map((c: any) => (
              <button key={c.id} onClick={handleCatClick(c)} className="text-left">{loc(c)}</button>
            ))}
            <button onClick={() => { onAbout?.(); setOpen(false) }} className="text-left">{t('store.about')}</button>
          </div>
        )}
      </header>
    )
  }

  if (variant === 'split-nav') {
    return (
      <header style={{ background: bg, color: text, borderBottom: `1px solid ${text}15` }} className="px-4 sm:px-8 py-4 sticky top-8 z-40">
        <div className="grid grid-cols-3 items-center max-w-7xl mx-auto">
          <nav className="flex gap-4 text-sm items-center">
            <button onClick={() => { onHome?.() }} className={`hover:opacity-70 hidden sm:inline ${!selectedCategoryId ? 'font-semibold' : ''}`}>{t('store.home')}</button>
            {cats.slice(0, 2).map((c: any) => (
              <button
                key={c.id}
                onClick={handleCatClick(c)}
                className={`hover:opacity-70 hidden sm:inline ${selectedCategoryId === c.id ? 'font-semibold' : ''}`}
                style={selectedCategoryId === c.id ? { color: primary } : undefined}
              >
                {loc(c)}
              </button>
            ))}
            <button className="sm:hidden" onClick={() => setOpen(!open)}>{open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}</button>
          </nav>
          <button onClick={() => onHome?.()} className="text-center font-bold text-lg" style={{ fontFamily: fontHead, color: primary }}>{tenantName}</button>
          <div className="flex items-center gap-2 justify-end text-sm">
            {searchWidget()}
            <CartButton count={cartCount} onOpen={onOpenCart} accent={accent} primary={primary} label={t('cart.title')} />
          </div>
        </div>
        {open && (
          <div className="sm:hidden mt-3 pt-3 border-t flex flex-col gap-2" style={{ borderColor: `${text}15` }}>
            <button onClick={() => { onHome?.(); setOpen(false) }} className="text-left">{t('store.home')}</button>
            {cats.map((c: any) => (
              <button key={c.id} onClick={handleCatClick(c)} className="text-left">{loc(c)}</button>
            ))}
            <button onClick={() => { onAbout?.(); setOpen(false) }} className="text-left">{t('store.about')}</button>
          </div>
        )}
      </header>
    )
  }

  if (variant === 'centered-logo') {
    return (
      <header style={{ background: bg, color: text, borderBottom: `1px solid ${text}10` }} className="px-4 sm:px-8 py-5 sticky top-8 z-40">
        <div className="max-w-7xl mx-auto">
          <button onClick={() => onHome?.()} className="block mx-auto text-center font-bold text-2xl mb-3" style={{ fontFamily: fontHead, color: primary }}>
            {tenantName}
          </button>
          <nav className="flex items-center justify-center gap-4 sm:gap-6 text-sm flex-wrap">
            <button onClick={() => onHome?.()} className={`hover:opacity-70 ${!selectedCategoryId ? 'font-semibold' : ''}`}>{t('store.home')}</button>
            {cats.slice(0, 4).map((c: any) => (
              <button
                key={c.id}
                onClick={handleCatClick(c)}
                className={`hover:opacity-70 hidden sm:inline ${selectedCategoryId === c.id ? 'font-semibold' : ''}`}
                style={selectedCategoryId === c.id ? { color: primary } : undefined}
              >
                {loc(c)}
              </button>
            ))}
            <button onClick={() => onAbout?.()} className="hover:opacity-70">{t('store.about')}</button>
            <button onClick={() => onContact?.()} className="hover:opacity-70 hidden sm:inline">{t('store.contact')}</button>
            <div className="flex items-center gap-2">
              {searchWidget()}
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

function Hero({ variant, slide, loc, t, primary, accent, text, bg, radius, fontHead, anim, isRTL, onCtaClick }: any) {
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
              onClick={onCtaClick}
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
            onClick={onCtaClick}
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
            <button onClick={onCtaClick} className="mt-4 self-start px-4 py-2 text-xs font-medium bg-white/20 hover:bg-white/30" style={{ borderRadius: radius }}>
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

function CategoriesStrip({ cats, loc, t, primary, accent, radius, selectedCategoryId, onSelectCategory }: any) {
  if (cats.length === 0) return null
  return (
    <section className="px-4 sm:px-8 py-6 border-y" style={{ borderColor: `${primary}15` }}>
      <div className="max-w-7xl mx-auto flex flex-wrap gap-3 justify-center">
        {/* "All" pill — clears the category filter */}
        <button
          onClick={() => onSelectCategory?.(null)}
          className="flex items-center gap-2 px-4 py-2 text-sm hover:scale-105 transition-transform font-medium"
          style={{
            borderRadius: radius,
            background: selectedCategoryId === null || !selectedCategoryId ? primary : `${primary}08`,
            color: selectedCategoryId === null || !selectedCategoryId ? '#fff' : primary,
            border: `1px solid ${primary}30`,
          }}
        >
          <span className="text-base">✨</span>
          <span>{t('store.allCategories')}</span>
        </button>
        {cats.map((c: any) => {
          const isActive = selectedCategoryId === c.id
          return (
            <button
              key={c.id}
              onClick={() => onSelectCategory?.(isActive ? null : c.id)}
              className="flex items-center gap-2 px-4 py-2 text-sm hover:scale-105 transition-transform"
              style={{
                background: isActive ? primary : `${primary}08`,
                color: isActive ? '#fff' : primary,
                borderRadius: radius,
                border: `1px solid ${isActive ? primary : 'transparent'}`,
              }}
            >
              <span className="font-medium">{loc(c)}</span>
              <span className="text-xs opacity-70">({c._count?.products ?? 0})</span>
            </button>
          )
        })}
      </div>
    </section>
  )
}

// ============================================================
// SECTION
// ============================================================

function Section({ title, accent, fontHead, subtitle, action, spacingClass, children }: any) {
  return (
    <section className={`px-4 sm:px-8 ${spacingClass || 'py-10'}`}>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-2 flex-wrap gap-3">
          <div>
            <h2 className="text-2xl lg:text-3xl font-bold" style={{ fontFamily: fontHead }}>
              {title}
            </h2>
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
            )}
          </div>
          {action ? action : <div className="h-1 w-12" style={{ background: accent }} />}
        </div>
        <div className="mb-6" />
        {children}
      </div>
    </section>
  )
}

// ============================================================
// PRODUCT GRID VARIANTS
// ============================================================

function ProductGrid({ variant, products, loc, t, primary, accent, text, bg, radius, cardStyle, spacing, imageStyle, buttonStyle, gridGap, onAddToCart, onViewDetails }: any) {
  if (products.length === 0) {
    return <div className="text-center py-12 text-muted-foreground">{t('common.noResults')}</div>
  }

  const cardProps = { loc, t, primary, accent, text, radius, cardStyle, imageStyle, buttonStyle, onAddToCart, onViewDetails }

  if (variant === '3-col-cards') {
    return (
      <div className={`grid sm:grid-cols-2 lg:grid-cols-3 ${gridGap}`}>
        {products.map((p: any) => (
          <ProductCard key={p.id} p={p} {...cardProps} />
        ))}
      </div>
    )
  }

  if (variant === '4-col-tight') {
    return (
      <div className={`grid grid-cols-2 lg:grid-cols-4 ${gridGap}`}>
        {products.map((p: any) => (
          <ProductCard key={p.id} p={p} {...cardProps} compact />
        ))}
      </div>
    )
  }

  if (variant === 'masonry') {
    return (
      <div className={`columns-2 lg:columns-3 ${gridGap} [&>*]:mb-4`}>
        {products.map((p: any, i: number) => (
          <div key={p.id} className="break-inside-avoid">
            <ProductCard p={p} {...cardProps} varyingHeight={i % 3} />
          </div>
        ))}
      </div>
    )
  }

  if (variant === 'list-rows') {
    return (
      <div className="space-y-2">
        {products.map((p: any) => (
          <ProductRow key={p.id} p={p} {...cardProps} />
        ))}
      </div>
    )
  }

  // New grid variants
  if (variant === 'slider') {
    return (
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-4 min-w-max">
          {products.map((p: any) => (
            <div key={p.id} className="w-72 shrink-0">
              <ProductCard p={p} {...cardProps} />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (variant === 'bento') {
    return (
      <div className={`grid grid-cols-2 lg:grid-cols-4 auto-rows-[200px] ${gridGap}`}>
        {products.map((p: any, i: number) => {
          const span = i === 0 ? 'lg:col-span-2 lg:row-span-2' : ''
          return (
            <div key={p.id} className={span}>
              <ProductCard p={p} {...cardProps} bento />
            </div>
          )
        })}
      </div>
    )
  }

  return null
}

function ProductCard({ p, loc, t, primary, accent, text, radius, cardStyle, imageStyle, buttonStyle, onAddToCart, onViewDetails, compact, varyingHeight, bento }: any) {
  const discount = p.compareAt && p.compareAt > p.price
    ? Math.round((1 - p.price / p.compareAt) * 100)
    : 0
  const heights = ['min-h-[180px]', 'min-h-[240px]', 'min-h-[300px]']

  // Card style variants
  const getCardClass = () => {
    switch (cardStyle) {
      case 'flat':
        return 'hover:opacity-90 transition-opacity'
      case 'shadow':
        return 'hover:shadow-lg transition-shadow shadow-sm'
      case 'border':
        return 'hover:border-opacity-100 transition-all'
      case 'outlined':
        return 'hover:shadow-md transition-shadow'
      case 'glass':
        return 'backdrop-blur-sm hover:shadow-xl transition-all'
      default:
        return 'hover:shadow-lg transition-shadow'
    }
  }

  const getCardStyle = () => {
    switch (cardStyle) {
      case 'flat':
        return { background: `${text}05`, border: 'none' }
      case 'shadow':
        return { background: text + '06', border: `1px solid ${text}08` }
      case 'border':
        return { background: 'transparent', border: `2px solid ${primary}30`, borderOpacity: 0.6 }
      case 'outlined':
        return { background: 'transparent', border: `1px solid ${text}20` }
      case 'glass':
        return { background: `${primary}08`, border: `1px solid ${primary}15`, backdropFilter: 'blur(8px)' }
      default:
        return { background: text + '06', border: `1px solid ${text}10` }
    }
  }

  // Image style variants
  const getImageRadius = () => {
    switch (imageStyle) {
      case 'square':
        return 0
      case 'rounded':
        return radius
      case 'circle':
        return '50%'
      case 'sharp':
        return 2
      default:
        return radius
    }
  }

  return (
    <div
      className={`group overflow-hidden cursor-pointer relative ${getCardClass()} ${bento ? 'h-full' : ''}`}
      style={{ ...getCardStyle(), borderRadius: radius }}
      onClick={() => onViewDetails?.(p)}
    >
      <div
        className={`flex items-center justify-center text-6xl relative ${compact ? 'aspect-square' : bento ? 'h-full' : varyingHeight != null ? heights[varyingHeight] : 'aspect-[4/3]'} overflow-hidden`}
        style={{ background: `${primary}08` }}
      >
        {p.image ? (
          <img
            src={p.image}
            alt={loc(p)}
            className="w-full h-full object-cover"
            style={{ borderRadius: getImageRadius() }}
          />
        ) : (
          <div className="text-6xl">📦</div>
        )}
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
        {/* Quick view hover button */}
        <button
          onClick={(e) => { e.stopPropagation(); onViewDetails?.(p) }}
          className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity"
          aria-label={t('product.quickView')}
        >
          <span
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white"
            style={{ background: primary, borderRadius: radius / 2 }}
          >
            <Eye className="h-3.5 w-3.5" />
            {t('product.quickView')}
          </span>
        </button>
      </div>
      <div className={compact ? 'p-2' : 'p-3'}>
        <div className="text-[10px] opacity-60 mb-0.5">{p.category ? loc(p.category) : ''}</div>
        <div className={`font-medium line-clamp-1 ${compact ? 'text-xs' : 'text-sm'}`}>{loc(p)}</div>
        {!compact && loc(p, 'description') && (
          <div className="text-xs opacity-60 line-clamp-2 mt-1">{loc(p, 'description')}</div>
        )}
        <div className="flex items-center justify-between mt-2">
          <div>
            <span className="font-bold text-sm">${p.price.toLocaleString()}</span>
            {discount > 0 && (
              <span className="ml-1 text-xs line-through opacity-50">${p.compareAt.toLocaleString()}</span>
            )}
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onAddToCart(p) }}
            disabled={p.stock <= 0}
            className={`px-2 py-1 text-[10px] font-medium disabled:opacity-40 hover:opacity-90 ${
              buttonStyle === 'outline' ? 'border-2' :
              buttonStyle === 'ghost' ? '' :
              ''
            }`}
            style={{
              background: buttonStyle === 'solid' ? primary : buttonStyle === 'ghost' ? 'transparent' : 'transparent',
              color: buttonStyle === 'solid' ? '#fff' : primary,
              border: buttonStyle === 'outline' ? `2px solid ${primary}` : buttonStyle === 'ghost' ? 'none' : undefined,
              borderRadius: buttonStyle === 'pill' ? 999 : radius / 2,
            }}
          >
            {p.stock > 0 ? t('store.addToCart') : t('store.outOfStock')}
          </button>
        </div>
      </div>
    </div>
  )
}

function ProductRow({ p, loc, t, primary, accent, text, radius, cardStyle, imageStyle, buttonStyle, onAddToCart, onViewDetails }: any) {
  const discount = p.compareAt && p.compareAt > p.price
    ? Math.round((1 - p.price / p.compareAt) * 100)
    : 0

  // Card style variants (same as ProductCard)
  const getCardClass = () => {
    switch (cardStyle) {
      case 'flat':
        return 'hover:opacity-90 transition-opacity'
      case 'shadow':
        return 'hover:shadow-md transition-shadow shadow-sm'
      case 'border':
        return 'hover:border-opacity-100 transition-all'
      case 'outlined':
        return 'hover:shadow-md transition-shadow'
      case 'glass':
        return 'backdrop-blur-sm hover:shadow-lg transition-all'
      default:
        return 'hover:shadow-md transition-shadow'
    }
  }

  const getCardStyle = () => {
    switch (cardStyle) {
      case 'flat':
        return { background: `${text}05`, border: 'none' }
      case 'shadow':
        return { background: text + '06', border: `1px solid ${text}08` }
      case 'border':
        return { background: 'transparent', border: `2px solid ${primary}30` }
      case 'outlined':
        return { background: 'transparent', border: `1px solid ${text}20` }
      case 'glass':
        return { background: `${primary}08`, border: `1px solid ${primary}15`, backdropFilter: 'blur(8px)' }
      default:
        return { background: text + '06', border: `1px solid ${text}10` }
    }
  }

  // Image style variants
  const getImageRadius = () => {
    switch (imageStyle) {
      case 'square':
        return 0
      case 'rounded':
        return radius / 2
      case 'circle':
        return '50%'
      case 'sharp':
        return 2
      default:
        return radius / 2
    }
  }

  return (
    <div
      className={`flex items-center gap-4 p-3 cursor-pointer ${getCardClass()}`}
      style={{ ...getCardStyle(), borderRadius: radius }}
      onClick={() => onViewDetails?.(p)}
    >
      <div className="h-16 w-16 sm:h-20 sm:w-20 flex items-center justify-center text-3xl shrink-0 relative group/img overflow-hidden" style={{ background: `${primary}08`, borderRadius: getImageRadius() }}>
        {p.image ? (
          <img
            src={p.image}
            alt={loc(p)}
            className="w-full h-full object-cover"
            style={{ borderRadius: getImageRadius() }}
          />
        ) : (
          <div className="text-3xl">📦</div>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); onViewDetails?.(p) }}
          className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity rounded-lg"
          aria-label={t('product.quickView')}
        >
          <Eye className="h-4 w-4 text-white" />
        </button>
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[10px] opacity-60">{p.category ? loc(p.category) : ''}</div>
        <div className="font-medium line-clamp-1">{loc(p)}</div>
        {loc(p, 'description') && <div className="text-xs opacity-60 line-clamp-1 hidden sm:block">{loc(p, 'description')}</div>}
        <div className="flex items-center gap-2 mt-0.5">
          <span className="font-bold text-sm">${p.price.toLocaleString()}</span>
          {discount > 0 && <span className="text-xs line-through opacity-50">${p.compareAt.toLocaleString()}</span>}
        </div>
      </div>
      <div className="text-right shrink-0 flex flex-col items-end gap-1">
        {discount > 0 && (
          <div className="text-[10px] font-bold" style={{ color: accent }}>-{discount}% {t('store.off')}</div>
        )}
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); onViewDetails?.(p) }}
            className="px-2 py-1.5 text-[10px] font-medium border hover:bg-slate-50 transition-colors"
            style={{ borderColor: `${primary}30`, color: primary, borderRadius: radius / 2 }}
            aria-label={t('product.viewDetails')}
            title={t('product.viewDetails')}
          >
            <Eye className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onAddToCart(p) }}
            disabled={p.stock <= 0}
            className="px-3 py-1.5 text-xs font-medium disabled:opacity-40 hover:opacity-90"
            style={{
              background: buttonStyle === 'solid' ? primary : buttonStyle === 'ghost' ? 'transparent' : 'transparent',
              color: buttonStyle === 'solid' ? '#fff' : primary,
              border: buttonStyle === 'outline' ? `2px solid ${primary}` : buttonStyle === 'ghost' ? 'none' : undefined,
              borderRadius: buttonStyle === 'pill' ? 999 : radius / 2,
            }}
          >
            {p.stock > 0 ? t('store.addToCart') : t('store.outOfStock')}
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// FOOTER VARIANTS
// ============================================================

// Shared social icons (decorative — would link to social profiles in a real app)
function Socials() {
  return (
    <div className="flex gap-3">
      <Facebook className="h-4 w-4 opacity-70 hover:opacity-100 cursor-pointer" />
      <Instagram className="h-4 w-4 opacity-70 hover:opacity-100 cursor-pointer" />
      <Twitter className="h-4 w-4 opacity-70 hover:opacity-100 cursor-pointer" />
    </div>
  )
}

function Footer(props: any) {
  const {
    variant, tenantName, desc, email, phone, loc, t,
    primary, accent, text, bg, radius, fontHead, cats,
    onSelectCategory, onAbout, onContact, onHome,
  } = props
  const year = new Date().getFullYear()

  if (variant === 'footer-minimal') {
    return (
      <footer className="px-4 sm:px-8 py-8 mt-12" style={{ background: primary, color: '#fff' }}>
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <button onClick={onHome} className="font-bold hover:opacity-80" style={{ fontFamily: fontHead }}>{tenantName}</button>
          <div className="text-xs opacity-70">© {year} · {t('brand.tagline')}</div>
          <Socials />
        </div>
      </footer>
    )
  }

  if (variant === 'footer-mega') {
    return (
      <footer className="px-4 sm:px-8 py-12 mt-12" style={{ background: text, color: bg }}>
        <div className="max-w-7xl mx-auto grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <button onClick={onHome} className="font-bold text-lg mb-2 block text-left hover:opacity-80" style={{ fontFamily: fontHead, color: accent }}>{tenantName}</button>
            {desc && <p className="text-sm opacity-70">{desc}</p>}
            <div className="flex gap-2 mt-3">
              <Socials />
            </div>
          </div>
          <div>
            <div className="font-bold text-sm mb-3 opacity-90">{t('store.categories')}</div>
            <ul className="space-y-1 text-sm opacity-70">
              {cats.slice(0, 5).map((c: any) => (
                <li key={c.id}>
                  <button onClick={() => onSelectCategory?.(c.id)} className="hover:opacity-100 text-left">{loc(c)}</button>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div className="font-bold text-sm mb-3 opacity-90">{t('store.about')}</div>
            <ul className="space-y-1 text-sm opacity-70">
              <li><button onClick={onAbout} className="hover:opacity-100 text-left">Our Story</button></li>
              <li><button onClick={onAbout} className="hover:opacity-100 text-left">Craftsmanship</button></li>
              <li><button onClick={onAbout} className="hover:opacity-100 text-left">Sustainability</button></li>
              <li><button onClick={onAbout} className="hover:opacity-100 text-left">Careers</button></li>
            </ul>
          </div>
          <div>
            <div className="font-bold text-sm mb-3 opacity-90">{t('store.contact')}</div>
            <ul className="space-y-1 text-sm opacity-70">
              {email && (
                <li>
                  <a href={`mailto:${email}`} className="flex items-center gap-2 hover:opacity-100">
                    <Mail className="h-3.5 w-3.5" /> {email}
                  </a>
                </li>
              )}
              {phone && (
                <li>
                  <a href={`tel:${phone}`} className="flex items-center gap-2 hover:opacity-100">
                    <Phone className="h-3.5 w-3.5" /> {phone}
                  </a>
                </li>
              )}
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-8 pt-4 border-t border-white/20 text-xs opacity-60 text-center">
          © {year} {tenantName} · All rights reserved
        </div>
      </footer>
    )
  }

  if (variant === 'footer-center') {
    return (
      <footer className="px-4 sm:px-8 py-10 mt-12 text-center" style={{ background: `${primary}08`, color: text }}>
        <div className="max-w-3xl mx-auto">
          <button onClick={onHome} className="font-bold text-xl mb-2 hover:opacity-80" style={{ fontFamily: fontHead, color: primary }}>{tenantName}</button>
          {desc && <p className="text-sm opacity-70 mb-4">{desc}</p>}
          {email && (
            <div className="flex items-center justify-center gap-2 text-sm opacity-80 mb-3">
              <a href={`mailto:${email}`} className="flex items-center gap-1 hover:opacity-100">
                <Mail className="h-3.5 w-3.5" /> {email}
              </a>
              {phone && (
                <>
                  <span className="mx-2">·</span>
                  <a href={`tel:${phone}`} className="flex items-center gap-1 hover:opacity-100">
                    <Phone className="h-3.5 w-3.5" /> {phone}
                  </a>
                </>
              )}
            </div>
          )}
          <div className="flex justify-center gap-3 mb-4">
            <Socials />
          </div>
          <div className="text-xs opacity-60">© {year} {tenantName}</div>
        </div>
      </footer>
    )
  }

  return null
}

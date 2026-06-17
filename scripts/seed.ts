/**
 * Seed script — populates the database with:
 *   - 30 unique layouts across 5 categories
 *   - 1 super admin user
 *   - 2 demo tenants with client admins, products, categories, hero slides, payments
 *
 * Usage:
 *   bun run scripts/seed.ts
 */
import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

const LAYOUTS = [
  // ===== MODERN (6) =====
  { name: 'Modern Minimal',   category: 'MODERN',   premium: false, headerStyle: 'minimal-bar',  heroStyle: 'split-image',   productGrid: '3-col-cards',  footerStyle: 'footer-minimal', primaryColor: '#0f172a', accentColor: '#6366f1', bgColor: '#ffffff', textColor: '#0f172a', fontHeading: 'Inter',      fontBody: 'Inter',      borderRadius: 8,  animation: 'fade',  description: 'Clean lines, generous whitespace, subtle motion. Ideal for tech-forward furniture brands.' },
  { name: 'Modern Edge',      category: 'MODERN',   premium: true,  headerStyle: 'split-nav',    heroStyle: 'full-bleed',    productGrid: '4-col-tight', footerStyle: 'footer-mega',   primaryColor: '#18181b', accentColor: '#f97316', bgColor: '#fafafa', textColor: '#18181b', fontHeading: 'Space Grotesk', fontBody: 'Inter',    borderRadius: 4,  animation: 'slide', description: 'Bold typography meets a high-density product grid. Built for catalog-heavy stores.' },
  { name: 'Nordic Breeze',    category: 'MODERN',   premium: false, headerStyle: 'centered-logo', heroStyle: 'split-image',  productGrid: '3-col-cards',  footerStyle: 'footer-minimal', primaryColor: '#3f6212', accentColor: '#e7e5e4', bgColor: '#f7f6f3', textColor: '#1c1917', fontHeading: 'DM Sans',    fontBody: 'DM Sans',    borderRadius: 12, animation: 'fade',  description: 'Soft beige backdrop, sage accents, and rounded corners for a Scandi feel.' },
  { name: 'Tech Forward',     category: 'MODERN',   premium: true,  headerStyle: 'split-nav',    heroStyle: 'grid-cells',    productGrid: '4-col-tight', footerStyle: 'footer-mega',   primaryColor: '#020617', accentColor: '#22d3ee', bgColor: '#0f172a', textColor: '#e2e8f0', fontHeading: 'JetBrains Mono', fontBody: 'Inter',   borderRadius: 0,  animation: 'zoom',  description: 'Dark theme, monospaced headings, neon cyan accents. Smart-furniture ready.' },
  { name: 'Urban Loft',       category: 'MODERN',   premium: false, headerStyle: 'minimal-bar',  heroStyle: 'carousel',      productGrid: 'masonry',      footerStyle: 'footer-center', primaryColor: '#1c1917', accentColor: '#dc2626', bgColor: '#ffffff', textColor: '#1c1917', fontHeading: 'Archivo',    fontBody: 'Inter',      borderRadius: 2,  animation: 'slide', description: 'Industrial vibe with sharp edges, masonry grid, and red highlights.' },
  { name: 'Fresh Bloom',      category: 'MODERN',   premium: false, headerStyle: 'centered-logo', heroStyle: 'carousel',     productGrid: '3-col-cards',  footerStyle: 'footer-minimal', primaryColor: '#15803d', accentColor: '#fb7185', bgColor: '#fefce8', textColor: '#1c1917', fontHeading: 'Plus Jakarta Sans', fontBody: 'Plus Jakarta Sans', borderRadius: 16, animation: 'fade', description: 'Pastel yellow background, leafy green primary, playful rounded cards.' },

  // ===== LUXURY (6) =====
  { name: 'Royal Elegance',   category: 'LUXURY',   premium: true,  headerStyle: 'centered-logo', heroStyle: 'full-bleed',   productGrid: 'list-rows',    footerStyle: 'footer-mega',   primaryColor: '#4c1d95', accentColor: '#d4af37', bgColor: '#0c0a09', textColor: '#fafaf9', fontHeading: 'Playfair Display', fontBody: 'Cormorant Garamond', borderRadius: 4,  animation: 'fade',  description: 'Midnight backdrop, gold accents, serif typography. Designed for premium heirloom collections.' },
  { name: 'Velvet Night',     category: 'LUXURY',   premium: true,  headerStyle: 'split-nav',    heroStyle: 'split-image',   productGrid: 'list-rows',    footerStyle: 'footer-mega',   primaryColor: '#581c87', accentColor: '#e879f9', bgColor: '#1e1b29', textColor: '#f5e9ff', fontHeading: 'Cormorant Garamond', fontBody: 'Inter', borderRadius: 8,  animation: 'zoom',  description: 'Deep plum background with violet accents. Romantic and intimate.' },
  { name: 'Marble & Gold',    category: 'LUXURY',   premium: true,  headerStyle: 'centered-logo', heroStyle: 'split-image',  productGrid: '3-col-cards',  footerStyle: 'footer-mega',   primaryColor: '#1c1917', accentColor: '#c4a253', bgColor: '#f5f3ef', textColor: '#1c1917', fontHeading: 'Playfair Display', fontBody: 'Lato',     borderRadius: 0,  animation: 'fade',  description: 'Cream marble backdrop, brushed gold details. Timeless showroom aesthetic.' },
  { name: 'Timeless Classic', category: 'LUXURY',   premium: false, headerStyle: 'minimal-bar',  heroStyle: 'carousel',      productGrid: '3-col-cards',  footerStyle: 'footer-center', primaryColor: '#451a03', accentColor: '#a16207', bgColor: '#faf6f0', textColor: '#451a03', fontHeading: 'Playfair Display', fontBody: 'Lora',     borderRadius: 4,  animation: 'fade',  description: 'Warm sepia tones with serif body text for a heritage feel.' },
  { name: 'Platinum Suite',   category: 'LUXURY',   premium: true,  headerStyle: 'split-nav',    heroStyle: 'full-bleed',    productGrid: 'list-rows',    footerStyle: 'footer-minimal', primaryColor: '#334155', accentColor: '#94a3b8', bgColor: '#f1f5f9', textColor: '#0f172a', fontHeading: 'Cormorant Garamond', fontBody: 'Inter', borderRadius: 2,  animation: 'slide', description: 'Platinum-greys with monochrome product rows for an exclusive boutique feel.' },
  { name: 'Diamond Collection', category: 'LUXURY', premium: true,  headerStyle: 'centered-logo', heroStyle: 'grid-cells',   productGrid: '4-col-tight', footerStyle: 'footer-mega',   primaryColor: '#0f172a', accentColor: '#67e8f9', bgColor: '#ffffff', textColor: '#0f172a', fontHeading: 'Playfair Display', fontBody: 'Inter', borderRadius: 0,  animation: 'zoom',  description: 'Ice-blue accents over black and white. Crystalline and refined.' },

  // ===== MINIMAL (6) =====
  { name: 'Pure White',       category: 'MINIMAL',  premium: false, headerStyle: 'minimal-bar',  heroStyle: 'split-image',   productGrid: '3-col-cards',  footerStyle: 'footer-minimal', primaryColor: '#000000', accentColor: '#000000', bgColor: '#ffffff', textColor: '#000000', fontHeading: 'Inter', fontBody: 'Inter', borderRadius: 0, animation: 'fade', description: 'Black on white, zero chrome. The purest expression of less-is-more.' },
  { name: 'Zen Garden',       category: 'MINIMAL',  premium: false, headerStyle: 'centered-logo', heroStyle: 'split-image',  productGrid: '3-col-cards',  footerStyle: 'footer-center', primaryColor: '#52525b', accentColor: '#84cc16', bgColor: '#fafaf7', textColor: '#27272a', fontHeading: 'Noto Serif JP', fontBody: 'Inter', borderRadius: 12, animation: 'fade', description: 'Off-white stones with mossy green accents. Calm and considered.' },
  { name: 'Swiss Style',      category: 'MINIMAL',  premium: true,  headerStyle: 'split-nav',    heroStyle: 'grid-cells',    productGrid: '4-col-tight', footerStyle: 'footer-mega',   primaryColor: '#dc2626', accentColor: '#000000', bgColor: '#ffffff', textColor: '#000000', fontHeading: 'Space Grotesk', fontBody: 'Inter', borderRadius: 0,  animation: 'slide', description: 'Red + black + grid. Strictly typographic, brutally clear.' },
  { name: 'Mono Chrome',      category: 'MINIMAL',  premium: false, headerStyle: 'minimal-bar',  heroStyle: 'carousel',      productGrid: '3-col-cards',  footerStyle: 'footer-minimal', primaryColor: '#1f2937', accentColor: '#6b7280', bgColor: '#f9fafb', textColor: '#1f2937', fontHeading: 'Inter', fontBody: 'Inter', borderRadius: 4, animation: 'fade', description: 'Grayscale-only palette with subtle gradients. Anything-but-boring neutral.' },
  { name: 'Breathing Space',  category: 'MINIMAL',  premium: false, headerStyle: 'centered-logo', heroStyle: 'split-image',  productGrid: 'list-rows',    footerStyle: 'footer-center', primaryColor: '#0f766e', accentColor: '#0f766e', bgColor: '#ffffff', textColor: '#0f172a', fontHeading: 'Fraunces', fontBody: 'Inter', borderRadius: 16, animation: 'fade', description: 'Extra-large spacing, soft serif headings, single-accent teal.' },
  { name: 'Outline',          category: 'MINIMAL',  premium: true,  headerStyle: 'split-nav',    heroStyle: 'grid-cells',    productGrid: '3-col-cards',  footerStyle: 'footer-minimal', primaryColor: '#000000', accentColor: '#000000', bgColor: '#ffffff', textColor: '#000000', fontHeading: 'Inter', fontBody: 'Inter', borderRadius: 0, animation: 'fade', description: 'Everything outlined — borders only, no fills. Architectural.' },

  // ===== CREATIVE (6) =====
  { name: 'Bold Statements',  category: 'CREATIVE', premium: true,  headerStyle: 'split-nav',    heroStyle: 'full-bleed',    productGrid: 'masonry',      footerStyle: 'footer-mega',   primaryColor: '#7c3aed', accentColor: '#facc15', bgColor: '#0b0b14', textColor: '#fafafa', fontHeading: 'Archivo Black', fontBody: 'Inter', borderRadius: 0, animation: 'zoom', description: 'Huge type, neon yellow over deep violet. Loud on purpose.' },
  { name: 'Art Gallery',      category: 'CREATIVE', premium: true,  headerStyle: 'centered-logo', heroStyle: 'split-image',  productGrid: 'list-rows',    footerStyle: 'footer-center', primaryColor: '#1c1917', accentColor: '#ea580c', bgColor: '#fef3e2', textColor: '#1c1917', fontHeading: 'Fraunces', fontBody: 'Inter', borderRadius: 0, animation: 'fade', description: 'Cream paper, orange highlights, generous framing. Treats products like exhibits.' },
  { name: 'Magazine Editorial', category: 'CREATIVE', premium: true, headerStyle: 'split-nav',  heroStyle: 'split-image',   productGrid: 'list-rows',    footerStyle: 'footer-mega',   primaryColor: '#111827', accentColor: '#db2777', bgColor: '#ffffff', textColor: '#111827', fontHeading: 'Playfair Display', fontBody: 'Lora', borderRadius: 0, animation: 'slide', description: 'Editorial columns with pink drop-caps. Feels like an IKEA catalogue on steroids.' },
  { name: 'Retro Wave',       category: 'CREATIVE', premium: false, headerStyle: 'minimal-bar',  heroStyle: 'carousel',      productGrid: '3-col-cards',  footerStyle: 'footer-minimal', primaryColor: '#be185d', accentColor: '#0ea5e9', bgColor: '#0f172a', textColor: '#fbcfe8', fontHeading: 'VT323', fontBody: 'Inter', borderRadius: 8, animation: 'zoom', description: '80s synthwave: hot pink + cyan over midnight. For playful brands.' },
  { name: 'Brutalist',        category: 'CREATIVE', premium: false, headerStyle: 'split-nav',    heroStyle: 'grid-cells',    productGrid: '4-col-tight', footerStyle: 'footer-mega',   primaryColor: '#000000', accentColor: '#84cc16', bgColor: '#d4d4d4', textColor: '#000000', fontHeading: 'Space Mono', fontBody: 'Space Mono', borderRadius: 0, animation: 'none', description: 'Raw concrete background, mono type, no rounded corners. Intentionally ugly-beautiful.' },
  { name: 'Collage',          category: 'CREATIVE', premium: true,  headerStyle: 'centered-logo', heroStyle: 'grid-cells',   productGrid: 'masonry',      footerStyle: 'footer-center', primaryColor: '#c2410c', accentColor: '#0891b2', bgColor: '#fff8e7', textColor: '#1c1917', fontHeading: 'Caveat', fontBody: 'Inter', borderRadius: 24, animation: 'slide', description: 'Hand-written headings, mixed tiles, scrapbook energy. Warm and personal.' },

  // ===== CLASSIC (6) =====
  { name: 'Heritage Oak',     category: 'CLASSIC',  premium: false, headerStyle: 'minimal-bar',  heroStyle: 'carousel',      productGrid: '3-col-cards',  footerStyle: 'footer-mega',   primaryColor: '#78350f', accentColor: '#a16207', bgColor: '#faf6ef', textColor: '#1c1917', fontHeading: 'Merriweather', fontBody: 'Lora', borderRadius: 4, animation: 'fade', description: 'Warm oak tones with serif body. Reassuring and trustworthy.' },
  { name: 'Victorian Grace',  category: 'CLASSIC',  premium: true,  headerStyle: 'centered-logo', heroStyle: 'split-image',  productGrid: 'list-rows',    footerStyle: 'footer-mega',   primaryColor: '#4a044e', accentColor: '#b45309', bgColor: '#fdf6e3', textColor: '#1c1917', fontHeading: 'Cormorant Garamond', fontBody: 'Lora', borderRadius: 2, animation: 'fade', description: 'Aged paper background, plum + brass. Antiques-ready.' },
  { name: 'Coastal Breeze',   category: 'CLASSIC',  premium: false, headerStyle: 'minimal-bar',  heroStyle: 'split-image',   productGrid: '3-col-cards',  footerStyle: 'footer-center', primaryColor: '#075985', accentColor: '#fbbf24', bgColor: '#eff6ff', textColor: '#0c4a6e', fontHeading: 'Lora', fontBody: 'Inter', borderRadius: 12, animation: 'fade', description: 'Sky-blue backdrop with sandy gold. Beach-house furniture ready.' },
  { name: 'Farmhouse Charm',  category: 'CLASSIC',  premium: false, headerStyle: 'centered-logo', heroStyle: 'carousel',     productGrid: '3-col-cards',  footerStyle: 'footer-mega',   primaryColor: '#7c2d12', accentColor: '#65a30d', bgColor: '#fef9e7', textColor: '#1c1917', fontHeading: 'Lora', fontBody: 'Lora', borderRadius: 8, animation: 'fade', description: 'Butcream + barn red + leafy green. Country catalogue feel.' },
  { name: 'Mediterranean Villa', category: 'CLASSIC', premium: true, headerStyle: 'split-nav',   heroStyle: 'full-bleed',    productGrid: '3-col-cards',  footerStyle: 'footer-mega',   primaryColor: '#1e3a8a', accentColor: '#c2410c', bgColor: '#fef9f5', textColor: '#1c1917', fontHeading: 'Playfair Display', fontBody: 'Lora', borderRadius: 4, animation: 'fade', description: 'Terracotta + navy over stucco cream. Riviera-villa catalogue.' },
  { name: 'English Garden',   category: 'CLASSIC',  premium: false, headerStyle: 'minimal-bar',  heroStyle: 'split-image',   productGrid: '3-col-cards',  footerStyle: 'footer-center', primaryColor: '#14532d', accentColor: '#be185d', bgColor: '#f7faf3', textColor: '#14532d', fontHeading: 'Lora', fontBody: 'Inter', borderRadius: 6, animation: 'fade', description: 'Garden green with rose accents. Botanical and refined.' },
]

const PRODUCTS = [
  { name: 'Velvet Lounge Sofa',     emoji: '🛋️', price: 1299,  compareAt: 1599, sku: 'SOFA-VLV-001', stock: 12, featured: true,  category: 'Living Room' },
  { name: 'Oak Dining Table',       emoji: '🪑', price: 899,   compareAt: null,  sku: 'TBL-OAK-002', stock: 8,  featured: true,  category: 'Dining' },
  { name: 'Velvet Accent Chair',    emoji: '💺', price: 449,   compareAt: 599,   sku: 'CHR-VLV-003', stock: 24, featured: false, category: 'Living Room' },
  { name: 'Walnut Bookshelf',       emoji: '📚', price: 679,   compareAt: null,  sku: 'SHE-WNT-004', stock: 6,  featured: true,  category: 'Office' },
  { name: 'Marble Coffee Table',    emoji: '🪨', price: 549,   compareAt: 699,   sku: 'TBL-MRB-005', stock: 10, featured: false, category: 'Living Room' },
  { name: 'Linen Platform Bed',     emoji: '🛏️', price: 1499,  compareAt: 1799,  sku: 'BED-LIN-006', stock: 5,  featured: true,  category: 'Bedroom' },
  { name: 'Brass Floor Lamp',       emoji: '💡', price: 219,   compareAt: null,  sku: 'LMP-BRS-007', stock: 32, featured: false, category: 'Lighting' },
  { name: 'Hand-Knotted Rug 9x12',  emoji: '🧶', price: 1899,  compareAt: 2299,  sku: 'RUG-KNT-008', stock: 4,  featured: true,  category: 'Rugs' },
  { name: 'Walnut Nightstand',      emoji: '🗄️', price: 329,   compareAt: null,  sku: 'NTS-WNT-009', stock: 18, featured: false, category: 'Bedroom' },
  { name: 'Leather Office Chair',   emoji: '🪑', price: 799,   compareAt: 999,   sku: 'CHR-LTR-010', stock: 9,  featured: true,  category: 'Office' },
  { name: 'Ceramic Vase Set',       emoji: '🏺', price: 89,    compareAt: null,  sku: 'VAS-CER-011', stock: 60, featured: false, category: 'Decor' },
  { name: 'Cedar Wardrobe',         emoji: '🚪', price: 2199,  compareAt: 2599,  sku: 'WRD-CDR-012', stock: 3,  featured: true,  category: 'Bedroom' },
]

const CATEGORIES = [
  { name: 'Living Room', icon: '🛋️' },
  { name: 'Bedroom',     icon: '🛏️' },
  { name: 'Dining',      icon: '🍽️' },
  { name: 'Office',      icon: '💼' },
  { name: 'Lighting',    icon: '💡' },
  { name: 'Rugs',        icon: '🧶' },
  { name: 'Decor',       icon: '🏺' },
]

const HERO_SLIDES = [
  { title: 'Summer Collection 2026',  subtitle: 'Up to 30% off hand-picked pieces', image: '🌿', order: 0, ctaText: 'Shop the Sale' },
  { title: 'New Arrivals',            subtitle: 'Just landed: Scandinavian oak series', image: '🪑', order: 1, ctaText: 'See What\'s New' },
  { title: 'Custom Orders Welcome',   subtitle: 'Bespoke furniture crafted to your space', image: '✨', order: 2, ctaText: 'Start Custom Order' },
]

async function main() {
  console.log('🌱 Seeding database...')

  // 1) Layouts
  console.log(`  → Upserting ${LAYOUTS.length} layouts...`)
  for (const layout of LAYOUTS) {
    await db.layout.upsert({
      where: { name: layout.name },
      update: layout,
      create: layout,
    })
  }

  // 2) Super admin
  console.log('  → Upserting super admin user...')
  await db.user.upsert({
    where: { email: 'admin@platform.com' },
    update: {},
    create: {
      email: 'admin@platform.com',
      password: 'admin123',
      name: 'Platform Super Admin',
      role: 'SUPER_ADMIN',
    },
  })

  // 3) Demo tenant: "Demo Furniture" with client admin + catalog
  console.log('  → Upserting "Demo Furniture" tenant...')
  const demoSlug = 'demo-furniture'
  const demoLayout = await db.layout.findUnique({ where: { name: 'Modern Minimal' } })
  let demoTenant = await db.tenant.findUnique({ where: { slug: demoSlug } })
  if (!demoTenant) {
    demoTenant = await db.tenant.create({
      data: {
        name: 'Demo Furniture',
        nameAr: 'أثاث تجريبي',
        nameHe: 'ריהוט לדוגמה',
        slug: demoSlug,
        email: 'owner@demofurniture.com',
        phone: '+1-555-0100',
        description: 'A family-owned furniture store specializing in modern and contemporary pieces for every room.',
        descriptionAr: 'متجر أثاث عائلي يختص في القطع الحديثة والمعاصرة لكل غرفة.',
        descriptionHe: 'חנות ריהוט משפחתית המתמחה ברהיטים מודרניים ועכשוויים לכל חדר.',
        status: 'ACTIVE',
        plan: 'PRO',
        layoutId: demoLayout?.id,
        themePrimary: '#0f766e',
        themeAccent: '#f59e0b',
        rtl: false,
      },
    })
  }

  // Client admin for Demo Furniture
  await db.user.upsert({
    where: { email: 'admin@demofurniture.com' },
    update: { tenantId: demoTenant.id },
    create: {
      email: 'admin@demofurniture.com',
      password: 'demo123',
      name: 'Demo Store Admin',
      role: 'CLIENT_ADMIN',
      tenantId: demoTenant.id,
    },
  })

  // Categories for demo tenant (only if none yet)
  const existingCats = await db.category.count({ where: { tenantId: demoTenant.id } })
  if (existingCats === 0) {
    console.log('  → Creating demo categories...')
    const demoCategoryMap = new Map<string, string>()
    for (const cat of CATEGORIES) {
      const created = await db.category.create({
        data: { tenantId: demoTenant.id, name: cat.name, icon: cat.icon },
      })
      demoCategoryMap.set(cat.name, created.id)
    }

    // Products for demo tenant
    console.log('  → Creating demo products...')
    for (const prod of PRODUCTS) {
      await db.product.create({
        data: {
          tenantId: demoTenant.id,
          categoryId: demoCategoryMap.get(prod.category) ?? null,
          name: prod.name,
          price: prod.price,
          compareAt: prod.compareAt,
          sku: prod.sku,
          stock: prod.stock,
          image: prod.emoji,
          featured: prod.featured,
          status: 'ACTIVE',
        },
      })
    }

    // Hero slides for demo tenant
    console.log('  → Creating demo hero slides...')
    for (const slide of HERO_SLIDES) {
      await db.heroSlide.create({
        data: { tenantId: demoTenant.id, ...slide },
      })
    }
  }

  // Payment records for demo tenant
  const existingDemoPayments = await db.payment.count({ where: { tenantId: demoTenant.id } })
  if (existingDemoPayments === 0) {
    console.log('  → Creating demo payments...')
    const year = new Date().getFullYear()
    await db.payment.create({
      data: { tenantId: demoTenant.id, amount: 480, currency: 'USD', period: String(year - 1), status: 'PAID', method: 'CARD', invoiceNo: `INV-${year - 1}-001`, paidAt: new Date(`${year - 1}-06-15`) },
    })
    await db.payment.create({
      data: { tenantId: demoTenant.id, amount: 480, currency: 'USD', period: String(year), status: 'PENDING', method: null, invoiceNo: `INV-${year}-002`, dueDate: new Date(`${year}-12-31`) },
    })
  }

  // 4) Second tenant: "Heritage Oak" with the Heritage Oak layout, Arabic RTL
  console.log('  → Upserting "Heritage Oak" tenant...')
  const heritageSlug = 'heritage-oak'
  const heritageLayout = await db.layout.findUnique({ where: { name: 'Heritage Oak' } })
  let heritageTenant = await db.tenant.findUnique({ where: { slug: heritageSlug } })
  if (!heritageTenant) {
    heritageTenant = await db.tenant.create({
      data: {
        name: 'Heritage Oak',
        nameAr: 'بلوط التراث',
        nameHe: 'אלון מורשת',
        slug: heritageSlug,
        email: 'owner@heritageoak.com',
        phone: '+966-555-2200',
        description: 'Hand-crafted heirloom furniture built from solid oak. Three generations of artisans.',
        descriptionAr: 'أثاث تراثي مصنوع يدويًا من خشب البلوط الصلب. ثلاثة أجيال من الحرفيين.',
        descriptionHe: 'ריהוט מורשת מחוטב ידנית מעץ אלון מלא. שלושה דורות של אומנים.',
        status: 'ACTIVE',
        plan: 'PREMIUM',
        layoutId: heritageLayout?.id,
        themePrimary: '#78350f',
        themeAccent: '#a16207',
        rtl: true,
      },
    })

    // Heritage Oak client admin
    await db.user.create({
      data: {
        email: 'admin@heritageoak.com',
        password: 'heritage123',
        name: 'Heritage Oak Admin',
        role: 'CLIENT_ADMIN',
        tenantId: heritageTenant.id,
      },
    })

    // Heritage categories + a few products
    const hCat = await db.category.create({
      data: { tenantId: heritageTenant.id, name: 'Tables', icon: '🪵' },
    })
    await db.category.create({ data: { tenantId: heritageTenant.id, name: 'Cabinets', icon: '🚪' } })

    await db.product.create({
      data: { tenantId: heritageTenant.id, categoryId: hCat.id, name: 'Heritage Oak Dining Table', price: 2499, sku: 'HR-OAK-TBL-001', stock: 4, image: '🪵', featured: true, status: 'ACTIVE' },
    })
    await db.product.create({
      data: { tenantId: heritageTenant.id, categoryId: hCat.id, name: 'Carved Coffee Table', price: 899, sku: 'HR-OAK-TBL-002', stock: 7, image: '🪑', featured: false, status: 'ACTIVE' },
    })

    await db.heroSlide.create({
      data: { tenantId: heritageTenant.id, title: 'Hand-Crafted Since 1962', subtitle: 'Three generations of oak mastery', image: '🌳', order: 0, ctaText: 'Explore the Collection' },
    })

    await db.payment.create({
      data: { tenantId: heritageTenant.id, amount: 1200, currency: 'USD', period: String(new Date().getFullYear()), status: 'PAID', method: 'BANK', invoiceNo: `INV-${new Date().getFullYear()}-HO-001`, paidAt: new Date(`${new Date().getFullYear()}-01-20`) },
    })
  }

  // 5) Third tenant: "Velvet Night" (paused, luxury)
  console.log('  → Upserting "Velvet Night" tenant (paused)...')
  const velvetSlug = 'velvet-night'
  const velvetLayout = await db.layout.findUnique({ where: { name: 'Velvet Night' } })
  let velvetTenant = await db.tenant.findUnique({ where: { slug: velvetSlug } })
  if (!velvetTenant) {
    velvetTenant = await db.tenant.create({
      data: {
        name: 'Velvet Night',
        nameAr: 'ليل المخمل',
        nameHe: 'לילת קטיפה',
        slug: velvetSlug,
        email: 'owner@velvetnight.com',
        phone: '+1-555-7700',
        description: 'Luxury evening furniture. Velvet, brass, and deep plum evenings.',
        status: 'PAUSED',
        plan: 'PREMIUM',
        layoutId: velvetLayout?.id,
        themePrimary: '#581c87',
        themeAccent: '#e879f9',
        rtl: false,
      },
    })
    await db.payment.create({
      data: { tenantId: velvetTenant.id, amount: 1200, currency: 'USD', period: String(new Date().getFullYear()), status: 'OVERDUE', method: null, invoiceNo: `INV-${new Date().getFullYear()}-VN-001`, dueDate: new Date(`${new Date().getFullYear()}-03-31`) },
    })
  }

  console.log('✅ Seed completed.')
  console.log('   Super Admin:    admin@platform.com / admin123')
  console.log('   Demo Admin:     admin@demofurniture.com / demo123')
  console.log('   Heritage Admin: admin@heritageoak.com / heritage123')
  console.log(`   Layouts:        ${LAYOUTS.length}`)
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })

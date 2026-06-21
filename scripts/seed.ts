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
import { FURNITURE_LAYOUTS } from './layouts-config'

const db = new PrismaClient()

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
  { name: 'Living Room', image: null },
  { name: 'Bedroom',     image: null },
  { name: 'Dining',      image: null },
  { name: 'Office',      image: null },
  { name: 'Lighting',    image: null },
  { name: 'Rugs',        image: null },
  { name: 'Decor',       image: null },
]

const HERO_SLIDES = [
  { title: 'Summer Collection 2026',  subtitle: 'Up to 30% off hand-picked pieces', image: '🌿', order: 0, ctaText: 'Shop the Sale' },
  { title: 'New Arrivals',            subtitle: 'Just landed: Scandinavian oak series', image: '🪑', order: 1, ctaText: 'See What\'s New' },
  { title: 'Custom Orders Welcome',   subtitle: 'Bespoke furniture crafted to your space', image: '✨', order: 2, ctaText: 'Start Custom Order' },
]

async function main() {
  console.log('🌱 Seeding database...')

  // 1) Layouts
  console.log(`  → Upserting ${FURNITURE_LAYOUTS.length} layouts...`)
  for (const layout of FURNITURE_LAYOUTS) {
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
        whatsappNumber: '15550100',
        whatsappPrefill: 'Hello Demo Furniture! I would like to order the following items:',
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
        data: { tenantId: demoTenant.id, name: cat.name, image: cat.image },
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
        whatsappNumber: '9665552200',
        whatsappPrefill: 'مرحبا بلوط التراث، أود طلب القطع التالية:',
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
      data: { tenantId: heritageTenant.id, name: 'Tables', image: null },
    })
    await db.category.create({ data: { tenantId: heritageTenant.id, name: 'Cabinets', image: null } })

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
        whatsappNumber: '15557700',
        whatsappPrefill: 'Good evening, Velvet Night. Please prepare the following for me:',
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
  console.log(`   Layouts:        ${FURNITURE_LAYOUTS.length}`)
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })

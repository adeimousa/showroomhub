/**
 * One-off patch: add Arabic + Hebrew name and description for the demo
 * tenant's products so the multi-language storefront has something to show.
 *
 * Run once after the multi-lang fields are in place:
 *   bun run scripts/patch-product-translations.ts
 */
import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

const TRANSLATIONS: Record<string, { nameAr?: string; nameHe?: string; descriptionAr?: string; descriptionHe?: string }> = {
  'SOFA-VLV-001': {
    nameAr: 'أريكة صالة مخملية',
    nameHe: 'ספת קטיפה לסלון',
    descriptionAr: 'أريكة فاخرة بمخمل ناعم وقاعدة خشب البلوط الصلب. مثالية للاسترخاء بعد يوم طويل.',
    descriptionHe: 'ספה יוקרתית מקטיפה רכה עם בסיס עץ אלון מלא. מושלמת להירגע אחרי יום ארוך.',
  },
  'TBL-OAK-002': {
    nameAr: 'طاولة طعام من البلوط',
    nameHe: 'שולחן אוכל מאלון',
    descriptionAr: 'طاولة طعام متينة مصنوعة من خشب البلوط الصلب. تتسع لستة أشخاص.',
    descriptionHe: 'שולחן אוכל עמיד מעץ אלון מלא. מתאים לשישה אנשים.',
  },
  'BED-LIN-006': {
    nameAr: 'سرير كتان منصة',
    nameHe: 'מיטת פלטפורמה מפשתן',
    descriptionAr: 'سرير كندي عصري بإطار كتان ناعم. متوفر بأحجام مزدوجة وكوين وكينغ.',
    descriptionHe: 'מיטה מודרנית עם מסגרת פשתן רכה. זמינה בגדלים זוגי, קווין וקינג.',
  },
  'CHR-LTR-010': {
    nameAr: 'كرسي مكتب جلدي',
    nameHe: 'כיסא משרדי מעור',
    descriptionAr: 'كرسي مكتب قابل للتعديل بجلد طبيعي ودعم قطني. مثالي للعمل لساعات طويلة.',
    descriptionHe: 'כיסא משרדי מתכוונן מעור אמיתי עם תמיכה מותנית. אידיאלי לעבודה של שעות ארוכות.',
  },
  'RUG-KNT-008': {
    nameAr: 'سجادة منسوجة يدويًا 9×12',
    nameHe: 'שטיח ארוג ידנית 9×12',
    descriptionAr: 'سجادة صوف فاخرة منسوجة يدويًا بأنماط تقليدية. مقاس 9×12 قدم.',
    descriptionHe: 'שטיח צמר יוקרתי ארוג ידנית בדוגמאות מסורתיות. מידה 9×12 רגל.',
  },
}

// Arabic + Hebrew names for the demo categories
const CATEGORY_TRANSLATIONS: Record<string, { nameAr?: string; nameHe?: string }> = {
  'Living Room': { nameAr: 'غرفة المعيشة', nameHe: 'סלון' },
  'Bedroom':     { nameAr: 'غرفة النوم',    nameHe: 'חדר שינה' },
  'Dining':      { nameAr: 'الطعام',        nameHe: 'אוכל' },
  'Office':      { nameAr: 'المكتب',        nameHe: 'משרד' },
  'Lighting':    { nameAr: 'الإضاءة',       nameHe: 'תאורה' },
  'Rugs':        { nameAr: 'السجاد',        nameHe: 'שטיחים' },
  'Decor':       { nameAr: 'الديكور',       nameHe: 'עיצוב' },
}

async function main() {
  console.log('🌐 Patching product translations...')

  const tenant = await db.tenant.findUnique({ where: { slug: 'demo-furniture' } })
  if (!tenant) {
    console.log('✗ demo-furniture tenant not found')
    return
  }

  const products = await db.product.findMany({ where: { tenantId: tenant.id } })
  let updated = 0
  for (const p of products) {
    const t = TRANSLATIONS[p.sku || '']
    if (!t) continue
    await db.product.update({
      where: { id: p.id },
      data: {
        nameAr: t.nameAr,
        nameHe: t.nameHe,
        descriptionAr: t.descriptionAr,
        descriptionHe: t.descriptionHe,
      },
    })
    updated++
    console.log(`  ✓ ${p.sku} → ${t.nameAr} / ${t.nameHe}`)
  }

  console.log(`\n📦 Updated ${updated} products with translations`)

  console.log('\n🌐 Patching category translations...')
  const categories = await db.category.findMany({ where: { tenantId: tenant.id } })
  let catUpdated = 0
  for (const c of categories) {
    const t = CATEGORY_TRANSLATIONS[c.name]
    if (!t) continue
    await db.category.update({
      where: { id: c.id },
      data: { nameAr: t.nameAr, nameHe: t.nameHe },
    })
    catUpdated++
    console.log(`  ✓ ${c.name} → ${t.nameAr} / ${t.nameHe}`)
  }
  console.log(`\n📁 Updated ${catUpdated} categories with translations`)

  console.log('\n✅ Done.')
}

main().catch((e) => { console.error(e); process.exit(1) }).finally(() => db.$disconnect())

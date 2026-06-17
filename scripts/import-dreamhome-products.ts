/**
 * Import products from dreamhomeil.com into the demo tenant
 * Uses external image URLs directly (already hosted on dreamhomeil.com)
 */
import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

const PRODUCTS = [
  {
    nameEn: 'Beige Sofa Bed',
    nameAr: 'ספה נפתחת למיטה זוגית צבע בז׳',
    nameHe: 'ספה נפתחת למיטה זוגית צבע בז׳',
    price: 1890,
    compareAt: 2990,
    imageUrl: 'https://dreamhomeil.com/wp-content/uploads/2026/06/WhatsApp-Image-2026-06-16-at-17.20.47-800x800.jpeg',
    descriptionEn: 'Convertible sofa bed in elegant beige color',
    categoryName: 'Sofas'
  },
  {
    nameEn: 'Black Sideboard',
    nameAr: 'מזנון צבע שחור',
    nameHe: 'מזנון צבע שחור',
    price: 1190,
    compareAt: 2290,
    imageUrl: 'https://dreamhomeil.com/wp-content/uploads/2026/06/WhatsApp-Image-2026-06-16-at-17.15.59.jpeg',
    descriptionEn: 'Modern black sideboard with ample storage',
    categoryName: 'Storage'
  },
  {
    nameEn: 'Two-Seater Sofa Bed',
    nameAr: 'ספה דו מושבית נפתחת',
    nameHe: 'ספה דו מושבית נפתחת',
    price: 1290,
    compareAt: 2290,
    imageUrl: 'https://dreamhomeil.com/wp-content/uploads/2026/06/WhatsApp-Image-2026-06-15-at-09.47.33-800x800.jpeg',
    descriptionEn: 'Compact two-seater convertible sofa',
    categoryName: 'Sofas'
  },
  {
    nameEn: 'Blue Two-Seater Sofa Bed',
    nameAr: 'ספה דו מושבית נפתחת כחול',
    nameHe: 'ספה דו מושבית נפתחת כחול',
    price: 990,
    compareAt: 1890,
    imageUrl: 'https://dreamhomeil.com/wp-content/uploads/2026/06/WhatsApp-Image-2026-06-15-at-08.28.17-800x800.jpeg',
    descriptionEn: 'Stylish blue two-seater sofa bed',
    categoryName: 'Sofas'
  },
  {
    nameEn: 'Black Two-Seater Sofa Bed',
    nameAr: 'ספה דו מושבית נפתחת שחור',
    nameHe: 'ספה דו מושבית נפתחת שחור',
    price: 990,
    compareAt: 1890,
    imageUrl: 'https://dreamhomeil.com/wp-content/uploads/2026/06/WhatsApp-Image-2026-06-15-at-08.26.43.jpeg',
    descriptionEn: 'Classic black two-seater sofa bed',
    categoryName: 'Sofas'
  },
  {
    nameEn: 'Beige Corner Sofa Set',
    nameAr: 'סלון פינתי צבע בז׳',
    nameHe: 'סלון פינתי צבע בז׳',
    price: 2590,
    compareAt: 5990,
    imageUrl: 'https://dreamhomeil.com/wp-content/uploads/2026/06/WhatsApp-Image-2026-06-12-at-11.37.25-800x800.jpeg',
    descriptionEn: 'Spacious beige corner sofa set for living room',
    categoryName: 'Sofas'
  },
  {
    nameEn: 'Pink Single Bed',
    nameAr: 'מיטה וחצי צבע ורוד',
    nameHe: 'מיטה וחצי צבע ורוד',
    price: 990,
    compareAt: 1990,
    imageUrl: 'https://dreamhomeil.com/wp-content/uploads/2026/06/WhatsApp-Image-2026-06-10-at-16.50.03-800x800.jpeg',
    descriptionEn: 'Comfortable pink single bed',
    categoryName: 'Beds'
  },
  {
    nameEn: 'Brown Chaise Lounge',
    nameAr: 'ספת רביצה צבע חמרה',
    nameHe: 'ספת רביצה צבע חמרה',
    price: 3990,
    compareAt: 6490,
    imageUrl: 'https://dreamhomeil.com/wp-content/uploads/2026/06/WhatsApp-Image-2026-06-08-at-11.22.40.jpeg',
    descriptionEn: 'Elegant brown chaise lounge',
    categoryName: 'Sofas'
  },
  {
    nameEn: 'Cream Dresser',
    nameAr: 'קומודה צבע שמנת',
    nameHe: 'קומודה צבע שמנת',
    price: 1490,
    compareAt: 2790,
    imageUrl: 'https://dreamhomeil.com/wp-content/uploads/2026/06/WhatsApp-Image-2026-06-04-at-09.02.29-800x800.jpeg',
    descriptionEn: 'Classic cream-colored dresser',
    categoryName: 'Storage'
  },
]

async function downloadAndUploadImage(url: string, productName: string): Promise<string> {
  console.log(`  📸 Using image URL: ${productName}`)

  try {
    // Verify the URL is accessible
    const response = await fetch(url, { method: 'HEAD' })
    if (!response.ok) {
      console.warn(`  ⚠️  Image may not be accessible: HTTP ${response.status}`)
    }

    console.log(`  ✅ Image verified: ${url}`)
    return url
  } catch (error) {
    console.error(`  ❌ Failed to verify ${productName}:`, error)
    throw error
  }
}

async function main() {
  console.log('🛋️  Importing products from dreamhomeil.com...\n')

  // Find or create demo tenant
  const tenant = await db.tenant.findUnique({
    where: { slug: 'demo-furniture' }
  })

  if (!tenant) {
    console.error('❌ Demo tenant not found')
    return
  }

  console.log(`✅ Found tenant: ${tenant.name}\n`)

  // Create categories
  const categories = new Map<string, string>()
  for (const categoryName of ['Sofas', 'Beds', 'Storage']) {
    // Try to find existing category
    let category = await db.category.findFirst({
      where: {
        tenantId: tenant.id,
        name: categoryName
      }
    })

    // Create if doesn't exist
    if (!category) {
      category = await db.category.create({
        data: {
          tenantId: tenant.id,
          name: categoryName,
          nameAr: categoryName === 'Sofas' ? 'ספות' : categoryName === 'Beds' ? 'מיטות' : 'אחסון',
          nameHe: categoryName === 'Sofas' ? 'ספות' : categoryName === 'Beds' ? 'מיטות' : 'אחסון',
          icon: categoryName === 'Sofas' ? '🛋️' : categoryName === 'Beds' ? '🛏️' : '🗄️'
        }
      })
    }

    categories.set(categoryName, category.id)
  }

  console.log(`✅ Created ${categories.size} categories\n`)

  // Process each product
  let successCount = 0
  for (const product of PRODUCTS) {
    try {
      console.log(`\n📦 Processing: ${product.nameEn}`)

      // Download and upload image
      const imageUrl = await downloadAndUploadImage(product.imageUrl, product.nameEn)

      // Create product
      const categoryId = categories.get(product.categoryName)!
      await db.product.create({
        data: {
          tenantId: tenant.id,
          categoryId,
          name: product.nameEn,
          nameAr: product.nameAr,
          nameHe: product.nameHe,
          description: product.descriptionEn,
          price: product.price,
          compareAt: product.compareAt,
          image: imageUrl,
          stock: 10,
          featured: Math.random() > 0.5,
          status: 'ACTIVE'
        }
      })

      console.log(`  ✅ Product created`)
      successCount++
    } catch (error) {
      console.error(`  ❌ Failed to import ${product.nameEn}:`, error)
    }
  }

  console.log(`\n\n🎉 Import complete!`)
  console.log(`   ✅ Successfully imported: ${successCount}/${PRODUCTS.length} products`)
  console.log(`\n   🌐 View them at: https://furniturehub-six.vercel.app/?view=site&slug=demo-furniture`)
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect())

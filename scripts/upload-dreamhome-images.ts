/**
 * Download images from dreamhomeil.com and upload to Vercel Blob with PUBLIC access
 * Then update products with the new Blob URLs
 */
import { PrismaClient } from '@prisma/client'
import { writeFileSync, unlinkSync } from 'fs'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)
const db = new PrismaClient()

const PRODUCTS_WITH_IMAGES = [
  {
    name: 'Beige Sofa Bed',
    imageUrl: 'https://dreamhomeil.com/wp-content/uploads/2026/06/WhatsApp-Image-2026-06-16-at-17.20.47-800x800.jpeg',
  },
  {
    name: 'Black Sideboard',
    imageUrl: 'https://dreamhomeil.com/wp-content/uploads/2026/06/WhatsApp-Image-2026-06-16-at-17.15.59.jpeg',
  },
  {
    name: 'Two-Seater Sofa Bed',
    imageUrl: 'https://dreamhomeil.com/wp-content/uploads/2026/06/WhatsApp-Image-2026-06-15-at-09.47.33-800x800.jpeg',
  },
  {
    name: 'Blue Two-Seater Sofa Bed',
    imageUrl: 'https://dreamhomeil.com/wp-content/uploads/2026/06/WhatsApp-Image-2026-06-15-at-08.28.17-800x800.jpeg',
  },
  {
    name: 'Black Two-Seater Sofa Bed',
    imageUrl: 'https://dreamhomeil.com/wp-content/uploads/2026/06/WhatsApp-Image-2026-06-15-at-08.26.43.jpeg',
  },
  {
    name: 'Beige Corner Sofa Set',
    imageUrl: 'https://dreamhomeil.com/wp-content/uploads/2026/06/WhatsApp-Image-2026-06-12-at-11.37.25-800x800.jpeg',
  },
  {
    name: 'Pink Single Bed',
    imageUrl: 'https://dreamhomeil.com/wp-content/uploads/2026/06/WhatsApp-Image-2026-06-10-at-16.50.03-800x800.jpeg',
  },
  {
    name: 'Brown Chaise Lounge',
    imageUrl: 'https://dreamhomeil.com/wp-content/uploads/2026/06/WhatsApp-Image-2026-06-08-at-11.22.40.jpeg',
  },
  {
    name: 'Cream Dresser',
    imageUrl: 'https://dreamhomeil.com/wp-content/uploads/2026/06/WhatsApp-Image-2026-06-04-at-09.02.29-800x800.jpeg',
  },
]

async function downloadImage(url: string, localPath: string): Promise<void> {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Failed to download: ${response.status}`)

  const buffer = Buffer.from(await response.arrayBuffer())
  writeFileSync(localPath, buffer)
}

async function uploadToBlob(localPath: string): Promise<string> {
  const rwToken = process.env.BLOB_READ_WRITE_TOKEN

  if (!rwToken) {
    throw new Error('BLOB_READ_WRITE_TOKEN not found. Please set it in your environment.')
  }

  const { stdout, stderr } = await execAsync(
    `vercel blob put "${localPath}" --access=public --add-random-suffix --rw-token="${rwToken}"`
  )

  // The URL is in stderr, not stdout
  const output = stderr || stdout

  // Extract URL from output (format: "> Success! https://...")
  const match = output.match(/https:\/\/[^\s\n]+/)

  if (!match) {
    console.error('Could not extract URL. Full output:', output)
    throw new Error('Could not extract blob URL from output')
  }

  console.log(`  ✅ Uploaded: ${match[0]}`)
  return match[0]
}

async function main() {
  console.log('🖼️  Downloading and uploading product images...\n')

  const tenant = await db.tenant.findUnique({
    where: { slug: 'demo-furniture' }
  })

  if (!tenant) {
    console.error('❌ Demo tenant not found')
    return
  }

  let successCount = 0

  for (const item of PRODUCTS_WITH_IMAGES) {
    try {
      console.log(`\n📦 Processing: ${item.name}`)

      // Find the product
      const product = await db.product.findFirst({
        where: {
          tenantId: tenant.id,
          name: item.name
        }
      })

      if (!product) {
        console.log(`  ⚠️  Product not found in database`)
        continue
      }

      // Create temp filename
      const ext = item.imageUrl.match(/\.(jpg|jpeg|png|webp)/i)?.[1] || 'jpg'
      const filename = `dreamhome-${item.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}.${ext}`
      const tempPath = `/tmp/${filename}`

      // Download
      console.log(`  📥 Downloading from dreamhomeil.com...`)
      await downloadImage(item.imageUrl, tempPath)

      // Upload to Vercel Blob with PUBLIC access
      console.log(`  📤 Uploading to Vercel Blob with public access...`)
      const blobUrl = await uploadToBlob(tempPath)
      console.log(`  ✅ Uploaded (public): ${blobUrl}`)

      // Update product
      await db.product.update({
        where: { id: product.id },
        data: { image: blobUrl }
      })
      console.log(`  ✅ Product updated`)

      // Cleanup
      unlinkSync(tempPath)

      successCount++
    } catch (error) {
      console.error(`  ❌ Failed:`, error)
    }
  }

  console.log(`\n\n🎉 Upload complete!`)
  console.log(`   ✅ Successfully uploaded: ${successCount}/${PRODUCTS_WITH_IMAGES.length} images`)
  console.log(`\n   🌐 View at: https://furniturehub-six.vercel.app/?view=site&slug=demo-furniture`)
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect())

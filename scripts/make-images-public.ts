/**
 * Re-upload images to Vercel Blob with public access
 * This fixes the issue where images show as URL strings instead of displaying
 */
import { PrismaClient } from '@prisma/client'
import { writeFileSync, unlinkSync } from 'fs'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)
const db = new PrismaClient()

async function downloadImage(url: string, localPath: string): Promise<void> {
  console.log(`  📥 Downloading from ${url}...`)
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

  console.log(`  📤 Uploading to Vercel Blob with public access...`)
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

  console.log(`  ✅ Uploaded with public access: ${match[0]}`)
  return match[0]
}

async function main() {
  console.log('🔓 Re-uploading images with public access...\n')

  const tenant = await db.tenant.findUnique({
    where: { slug: 'demo-furniture' },
    include: {
      products: {
        where: {
          image: {
            contains: 'private.blob.vercel-storage.com'
          }
        }
      }
    }
  })

  if (!tenant) {
    console.error('❌ Demo tenant not found')
    return
  }

  console.log(`📦 Found ${tenant.products.length} products with private blob images\n`)

  let successCount = 0

  for (const product of tenant.products) {
    try {
      console.log(`\n📦 Processing: ${product.name}`)
      console.log(`   Current (private): ${product.image}`)

      // Create temp filename
      const ext = product.image?.match(/\.(jpg|jpeg|png|webp)/i)?.[1] || 'jpg'
      const filename = `${product.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}.${ext}`
      const tempPath = `/tmp/${filename}`

      // Download the private image
      await downloadImage(product.image!, tempPath)

      // Upload to Vercel Blob with PUBLIC access
      const publicUrl = await uploadToBlob(tempPath)

      // Update product
      await db.product.update({
        where: { id: product.id },
        data: { image: publicUrl }
      })
      console.log(`  ✅ Product updated with public URL`)

      // Cleanup
      unlinkSync(tempPath)

      successCount++
    } catch (error) {
      console.error(`  ❌ Failed:`, error)
    }
  }

  console.log(`\n\n🎉 Re-upload complete!`)
  console.log(`   ✅ Successfully re-uploaded: ${successCount}/${tenant.products.length} images`)
  console.log(`\n   🌐 View at: https://furniturehub-six.vercel.app/?view=site&slug=demo-furniture`)
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect())

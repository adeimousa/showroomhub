/**
 * One-off patch: assign custom domains to demo tenants for testing.
 *
 * Run once:
 *   bun run scripts/patch-custom-domains.ts
 *
 * In production, custom domains are added via the super admin UI.
 */
import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

const DOMAINS: Record<string, string[]> = {
  'demo-furniture': ['demo-furniture.com', 'www.demo-furniture.com'],
  'heritage-oak': ['heritage-oak.com', 'www.heritage-oak.com'],
  'velvet-night': ['velvetnight.com', 'www.velvetnight.com'],
}

async function main() {
  console.log('🌐 Assigning custom domains to demo tenants...')
  for (const [slug, domains] of Object.entries(DOMAINS)) {
    const tenant = await db.tenant.findUnique({ where: { slug } })
    if (!tenant) {
      console.log(`  ✗ ${slug} not found — skipping`)
      continue
    }
    await db.tenant.update({
      where: { id: tenant.id },
      data: {
        customDomains: JSON.stringify(domains),
        domain: domains[0], // also set the primary domain field
      },
    })
    console.log(`  ✓ ${slug} → ${domains.join(', ')}`)
  }
  console.log('\n✅ Done. Test with:')
  console.log('   http://localhost:3000/?host=velvetnight.com')
  console.log('   http://localhost:3000/?host=heritage-oak.com')
  console.log('   http://localhost:3000/?host=demo-furniture.com')
  console.log('   http://localhost:3000/?host=showroomhub.com  (super admin)')
}

main().catch((e) => { console.error(e); process.exit(1) }).finally(() => db.$disconnect())

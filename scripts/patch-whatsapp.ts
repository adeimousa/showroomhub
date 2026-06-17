/**
 * One-off patch: add WhatsApp config to existing demo tenants that were
 * created before the whatsappNumber / whatsappPrefill columns existed.
 *
 * Run once after the schema migration:
 *   bun run scripts/patch-whatsapp.ts
 */
import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

const WHATSAPP_CONFIG: Record<string, { whatsappNumber: string; whatsappPrefill: string }> = {
  'demo-furniture': {
    whatsappNumber: '15550100',
    whatsappPrefill: 'Hello Demo Furniture! I would like to order the following items:',
  },
  'heritage-oak': {
    whatsappNumber: '9665552200',
    whatsappPrefill: 'مرحبا بلوط التراث، أود طلب القطع التالية:',
  },
  'velvet-night': {
    whatsappNumber: '15557700',
    whatsappPrefill: 'Good evening, Velvet Night. Please prepare the following for me:',
  },
}

async function main() {
  console.log('📱 Patching WhatsApp config on existing tenants...')
  for (const [slug, cfg] of Object.entries(WHATSAPP_CONFIG)) {
    const tenant = await db.tenant.findUnique({ where: { slug } })
    if (!tenant) {
      console.log(`  ✗ ${slug} not found — skipping`)
      continue
    }
    if (tenant.whatsappNumber) {
      console.log(`  ✓ ${slug} already has WhatsApp number — skipping`)
      continue
    }
    await db.tenant.update({ where: { id: tenant.id }, data: cfg })
    console.log(`  ✓ ${slug} updated with WhatsApp number ${cfg.whatsappNumber}`)
  }
  console.log('✅ Done.')
}

main().catch((e) => { console.error(e); process.exit(1) }).finally(() => db.$disconnect())

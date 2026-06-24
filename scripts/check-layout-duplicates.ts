import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const tenants = await prisma.tenant.findMany({
    where: { layoutId: { not: null } },
    select: { id: true, name: true, layoutId: true },
    orderBy: { layoutId: 'asc' }
  })

  const layoutMap: Record<string, typeof tenants> = {}
  tenants.forEach(t => {
    if (!layoutMap[t.layoutId!]) layoutMap[t.layoutId!] = []
    layoutMap[t.layoutId!].push(t)
  })

  console.log('Layout assignments:\n')
  let hasDuplicates = false
  Object.entries(layoutMap).forEach(([layoutId, ts]) => {
    if (ts.length > 1) {
      hasDuplicates = true
      console.log(`⚠️  Layout ${layoutId} assigned to ${ts.length} tenants:`)
      ts.forEach(t => console.log(`   - ${t.name} (${t.id})`))
      console.log()
    }
  })

  if (!hasDuplicates) {
    console.log('✓ No duplicate assignments found - safe to apply unique constraint')
  } else {
    console.log('\n❌ Found duplicate assignments - must fix before applying unique constraint')
    console.log('\nClearing duplicate assignments (keeping first tenant for each layout)...')

    for (const [layoutId, ts] of Object.entries(layoutMap)) {
      if (ts.length > 1) {
        // Keep first, clear others
        for (let i = 1; i < ts.length; i++) {
          await prisma.tenant.update({
            where: { id: ts[i].id },
            data: { layoutId: null }
          })
          console.log(`✓ Cleared layout from ${ts[i].name}`)
        }
      }
    }

    console.log('\n✅ Duplicate assignments cleared')
  }

  await prisma.$disconnect()
}

main().catch(console.error)

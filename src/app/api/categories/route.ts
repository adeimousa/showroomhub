import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAnyAdmin } from '@/lib/session'

export async function GET(req: NextRequest) {
  const { user, fail } = await requireAnyAdmin()
  if (fail) return fail
  const url = new URL(req.url)
  const tenantId = url.searchParams.get('tenantId')
  const targetTenantId = user!.role === 'SUPER_ADMIN' && tenantId ? tenantId : user!.tenantId
  if (!targetTenantId) return NextResponse.json({ categories: [] })

  const categories = await db.category.findMany({
    where: { tenantId: targetTenantId },
    include: { _count: { select: { products: true } } },
    orderBy: { name: 'asc' },
  })
  return NextResponse.json({ categories })
}

export async function POST(req: NextRequest) {
  const { user, fail } = await requireAnyAdmin()
  if (fail) return fail
  if (!user!.tenantId) return NextResponse.json({ error: 'No tenant on user' }, { status: 400 })

  const body = await req.json().catch(() => null)
  if (!body?.name) return NextResponse.json({ error: 'Missing name' }, { status: 400 })

  const category = await db.category.create({
    data: {
      tenantId: user!.tenantId,
      name: body.name,
      nameAr: body.nameAr || null,
      nameHe: body.nameHe || null,
      icon: body.icon || '📦',
    },
  })
  return NextResponse.json({ category }, { status: 201 })
}

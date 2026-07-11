import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAnyAdmin } from '@/lib/session'

// Normalize an incoming images value (array or JSON string) into a JSON string
// of a string[]. Drops anything that isn't a non-empty string.
function normalizeImages(input: unknown): string {
  let arr: unknown = input
  if (typeof input === 'string') {
    try { arr = JSON.parse(input) } catch { arr = [] }
  }
  if (!Array.isArray(arr)) arr = []
  const clean = (arr as unknown[]).filter((x): x is string => typeof x === 'string' && x.trim().length > 0)
  return JSON.stringify(clean)
}

export async function GET(req: NextRequest) {
  const { user, fail } = await requireAnyAdmin()
  if (fail) return fail
  const url = new URL(req.url)
  const tenantId = url.searchParams.get('tenantId')
  const targetTenantId = user!.role === 'SUPER_ADMIN' && tenantId ? tenantId : user!.tenantId
  if (!targetTenantId) return NextResponse.json({ catalogues: [] })

  const catalogues = await db.catalogue.findMany({
    where: { tenantId: targetTenantId },
    orderBy: { order: 'asc' },
  })
  return NextResponse.json({ catalogues })
}

export async function POST(req: NextRequest) {
  const { user, fail } = await requireAnyAdmin()
  if (fail) return fail
  if (!user!.tenantId) return NextResponse.json({ error: 'No tenant on user' }, { status: 400 })

  const body = await req.json().catch(() => null)
  if (!body?.name) return NextResponse.json({ error: 'Missing name' }, { status: 400 })

  const catalogue = await db.catalogue.create({
    data: {
      tenantId: user!.tenantId,
      name: body.name,
      nameAr: body.nameAr || null,
      nameHe: body.nameHe || null,
      images: normalizeImages(body.images),
      order: Number(body.order ?? 0),
      active: body.active !== false,
    },
  })
  return NextResponse.json({ catalogue }, { status: 201 })
}

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAnyAdmin } from '@/lib/session'

// GET — list products for current tenant
export async function GET(req: NextRequest) {
  const { user, fail } = await requireAnyAdmin()
  if (fail) return fail

  const url = new URL(req.url)
  const tenantId = url.searchParams.get('tenantId')

  // Super admin can fetch any tenant's products; client admin only their own
  const targetTenantId = user!.role === 'SUPER_ADMIN' && tenantId ? tenantId : user!.tenantId
  if (!targetTenantId) return NextResponse.json({ products: [] })

  const products = await db.product.findMany({
    where: { tenantId: targetTenantId },
    include: { category: true },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json({ products })
}

// POST — create product for current tenant
export async function POST(req: NextRequest) {
  const { user, fail } = await requireAnyAdmin()
  if (fail) return fail

  const targetTenantId = user!.tenantId
  if (!targetTenantId) return NextResponse.json({ error: 'No tenant on user' }, { status: 400 })

  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  if (!body.name || body.price == null) {
    return NextResponse.json({ error: 'Missing required fields (name, price)' }, { status: 400 })
  }

  try {
    const product = await db.product.create({
      data: {
        tenantId: targetTenantId,
        categoryId: body.categoryId || null,
        name: body.name,
        nameAr: body.nameAr || null,
        nameHe: body.nameHe || null,
        description: body.description || null,
        descriptionAr: body.descriptionAr || null,
        descriptionHe: body.descriptionHe || null,
        price: Number(body.price),
        compareAt: body.compareAt != null ? Number(body.compareAt) : null,
        sku: body.sku || null,
        stock: Number(body.stock ?? 0),
        image: body.image || '📦',
        images: body.images || '[]',
        featured: !!body.featured,
        status: body.status || 'ACTIVE',
      },
      include: { category: true },
    })
    return NextResponse.json({ product }, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to create product' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Public endpoint: returns everything needed to render a tenant storefront
export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const slug = url.searchParams.get('slug')

  if (!slug) return NextResponse.json({ error: 'Missing slug' }, { status: 400 })

  const tenant = await db.tenant.findUnique({
    where: { slug },
    include: {
      layout: true,
      categories: { include: { _count: { select: { products: true } } }, orderBy: { name: 'asc' } },
      heroSlides: { orderBy: { order: 'asc' } },
      products: {
        include: { category: true },
        orderBy: { createdAt: 'desc' },
        where: { status: 'ACTIVE' },
      },
    },
  })

  if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
  if (tenant.status === 'PAUSED') {
    return NextResponse.json({ paused: true, tenant: { name: tenant.name, nameAr: tenant.nameAr, nameHe: tenant.nameHe } })
  }
  if (tenant.status === 'SUSPENDED') {
    return NextResponse.json({ suspended: true, tenant: { name: tenant.name } })
  }

  return NextResponse.json({ tenant })
}

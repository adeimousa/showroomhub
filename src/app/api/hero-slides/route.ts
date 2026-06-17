import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAnyAdmin } from '@/lib/session'

export async function GET(req: NextRequest) {
  const { user, fail } = await requireAnyAdmin()
  if (fail) return fail
  const url = new URL(req.url)
  const tenantId = url.searchParams.get('tenantId')
  const targetTenantId = user!.role === 'SUPER_ADMIN' && tenantId ? tenantId : user!.tenantId
  if (!targetTenantId) return NextResponse.json({ slides: [] })

  const slides = await db.heroSlide.findMany({
    where: { tenantId: targetTenantId },
    orderBy: { order: 'asc' },
  })
  return NextResponse.json({ slides })
}

export async function POST(req: NextRequest) {
  const { user, fail } = await requireAnyAdmin()
  if (fail) return fail
  if (!user!.tenantId) return NextResponse.json({ error: 'No tenant on user' }, { status: 400 })

  const body = await req.json().catch(() => null)
  if (!body?.title) return NextResponse.json({ error: 'Missing title' }, { status: 400 })

  const slide = await db.heroSlide.create({
    data: {
      tenantId: user!.tenantId,
      title: body.title,
      titleAr: body.titleAr || null,
      titleHe: body.titleHe || null,
      subtitle: body.subtitle || null,
      subtitleAr: body.subtitleAr || null,
      subtitleHe: body.subtitleHe || null,
      image: body.image || '🖼️',
      ctaText: body.ctaText || 'Shop Now',
      ctaLink: body.ctaLink || '#',
      order: Number(body.order ?? 0),
      active: body.active !== false,
    },
  })
  return NextResponse.json({ slide }, { status: 201 })
}

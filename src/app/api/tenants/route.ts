import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireSuperAdmin, requireAnyAdmin } from '@/lib/session'

// GET — Super admin: all tenants. Client admin: their tenant only.
export async function GET() {
  const { user, fail } = await requireAnyAdmin()
  if (fail) return fail

  if (user!.role === 'SUPER_ADMIN') {
    const tenants = await db.tenant.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        layout: { select: { id: true, name: true, category: true, premium: true } },
        _count: { select: { products: true, payments: true, users: true } },
      },
    })
    return NextResponse.json({ tenants })
  } else {
    if (!user!.tenantId) return NextResponse.json({ tenants: [] })
    const tenant = await db.tenant.findUnique({
      where: { id: user!.tenantId },
      include: {
        layout: { select: { id: true, name: true, category: true, premium: true, headerStyle: true, heroStyle: true, productGrid: true, footerStyle: true, primaryColor: true, accentColor: true, bgColor: true, textColor: true, fontHeading: true, fontBody: true, borderRadius: true, animation: true } },
      },
    })
    return NextResponse.json({ tenants: tenant ? [tenant] : [] })
  }
}

// POST — Super admin only
export async function POST(req: NextRequest) {
  const { fail } = await requireSuperAdmin()
  if (fail) return fail

  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })

  if (!body.name || !body.slug) {
    return NextResponse.json({ error: 'Missing required fields (name, slug)' }, { status: 400 })
  }

  const existing = await db.tenant.findUnique({ where: { slug: body.slug } })
  if (existing) return NextResponse.json({ error: 'Slug already taken' }, { status: 409 })

  try {
    const tenant = await db.tenant.create({
      data: {
        name: body.name,
        nameAr: body.nameAr || null,
        nameHe: body.nameHe || null,
        slug: body.slug,
        email: body.email || null,
        phone: body.phone || null,
        whatsappNumber: body.whatsappNumber || null,
        whatsappPrefill: body.whatsappPrefill || null,
        ownerName: body.ownerName || null,
        ownerEmail: body.ownerEmail || null,
        ownerPhone: body.ownerPhone || null,
        validUntil: body.validUntil ? new Date(body.validUntil) : null,
        customDomains: body.customDomains || '[]',
        description: body.description || null,
        descriptionAr: body.descriptionAr || null,
        descriptionHe: body.descriptionHe || null,
        status: body.status || 'ACTIVE',
        plan: body.plan || 'BASIC',
        layoutId: body.layoutId || null,
        themePrimary: body.themePrimary || '#0f766e',
        themeAccent: body.themeAccent || '#f59e0b',
        themeBg: body.themeBg || '#ffffff',
        themeFont: body.themeFont || 'Inter',
        rtl: !!body.rtl,
      },
      include: { layout: { select: { id: true, name: true, category: true } } },
    })
    return NextResponse.json({ tenant }, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to create tenant' }, { status: 500 })
  }
}

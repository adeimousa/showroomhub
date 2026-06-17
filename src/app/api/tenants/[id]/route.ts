import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireSuperAdmin, getCurrentUser } from '@/lib/session'

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { fail } = await requireSuperAdmin()
  if (fail) return fail
  const { id } = await ctx.params
  const tenant = await db.tenant.findUnique({
    where: { id },
    include: {
      layout: true,
      _count: { select: { products: true, categories: true, heroSlides: true, payments: true, users: true } },
    },
  })
  if (!tenant) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ tenant })
}

// Fields a client admin is allowed to edit on their own tenant
const CLIENT_ADMIN_FIELDS = new Set([
  'whatsappNumber', 'whatsappPrefill',
  'themePrimary', 'themeAccent', 'themeBg', 'themeFont', 'rtl',
  'email', 'phone',
  'description', 'descriptionAr', 'descriptionHe',
])

// Fields only a super admin can edit
const SUPER_ADMIN_ONLY_FIELDS = new Set([
  'name', 'nameAr', 'nameHe', 'slug', 'domain', 'customDomains',
  'status', 'plan', 'layoutId',
])

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await ctx.params
  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })

  // Authorization:
  //   - Super admin can edit any tenant and any field
  //   - Client admin can only edit their own tenant, and only CLIENT_ADMIN_FIELDS
  const isSuperAdmin = user.role === 'SUPER_ADMIN'
  if (!isSuperAdmin) {
    if (user.tenantId !== id) {
      return NextResponse.json({ error: 'Not your tenant' }, { status: 403 })
    }
  }

  // Sanitize — only allow known fields, and enforce field-level permissions
  const allowed: Record<string, any> = {}
  const allKnownFields = new Set([...CLIENT_ADMIN_FIELDS, ...SUPER_ADMIN_ONLY_FIELDS])
  for (const [key, value] of Object.entries(body)) {
    if (!allKnownFields.has(key)) continue
    if (!isSuperAdmin && SUPER_ADMIN_ONLY_FIELDS.has(key)) {
      // Client admin trying to edit a super-admin-only field — silently drop
      continue
    }
    allowed[key] = value
  }

  // If slug is changing, check uniqueness
  if (allowed.slug) {
    const existing = await db.tenant.findUnique({ where: { slug: allowed.slug } })
    if (existing && existing.id !== id) {
      return NextResponse.json({ error: 'Slug already taken' }, { status: 409 })
    }
  }

  try {
    const tenant = await db.tenant.update({
      where: { id },
      data: allowed,
      include: { layout: { select: { id: true, name: true, category: true } } },
    })
    return NextResponse.json({ tenant })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to update tenant' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { fail } = await requireSuperAdmin()
  if (fail) return fail
  const { id } = await ctx.params
  await db.tenant.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}

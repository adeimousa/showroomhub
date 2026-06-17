import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireSuperAdmin } from '@/lib/session'

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

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { fail } = await requireSuperAdmin()
  if (fail) return fail
  const { id } = await ctx.params
  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })

  // Sanitize — only allow known fields
  const allowed: Record<string, any> = {}
  const fields = [
    'name','nameAr','nameHe','slug','domain','email','phone','description','descriptionAr','descriptionHe',
    'status','plan','layoutId','themePrimary','themeAccent','themeBg','themeFont','rtl'
  ]
  for (const f of fields) {
    if (body[f] !== undefined) allowed[f] = body[f]
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

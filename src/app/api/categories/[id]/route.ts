import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAnyAdmin } from '@/lib/session'

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { user, fail } = await requireAnyAdmin()
  if (fail) return fail
  const { id } = await ctx.params
  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })

  const existing = await db.category.findUnique({ where: { id } })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (user!.role !== 'SUPER_ADMIN' && existing.tenantId !== user!.tenantId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const allowed: Record<string, any> = {}
  for (const f of ['name','nameAr','nameHe','icon']) {
    if (body[f] !== undefined) allowed[f] = body[f]
  }
  const category = await db.category.update({ where: { id }, data: allowed })
  return NextResponse.json({ category })
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { user, fail } = await requireAnyAdmin()
  if (fail) return fail
  const { id } = await ctx.params

  const existing = await db.category.findUnique({ where: { id } })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (user!.role !== 'SUPER_ADMIN' && existing.tenantId !== user!.tenantId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Detach products from this category before deleting
  await db.product.updateMany({ where: { categoryId: id }, data: { categoryId: null } })
  await db.category.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}

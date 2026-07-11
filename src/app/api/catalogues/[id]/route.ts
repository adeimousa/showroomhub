import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAnyAdmin } from '@/lib/session'

function normalizeImages(input: unknown): string {
  let arr: unknown = input
  if (typeof input === 'string') {
    try { arr = JSON.parse(input) } catch { arr = [] }
  }
  if (!Array.isArray(arr)) arr = []
  const clean = (arr as unknown[]).filter((x): x is string => typeof x === 'string' && x.trim().length > 0)
  return JSON.stringify(clean)
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { user, fail } = await requireAnyAdmin()
  if (fail) return fail
  const { id } = await ctx.params
  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })

  const existing = await db.catalogue.findUnique({ where: { id } })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (user!.role !== 'SUPER_ADMIN' && existing.tenantId !== user!.tenantId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const allowed: Record<string, any> = {}
  for (const f of ['name', 'nameAr', 'nameHe', 'order', 'active']) {
    if (body[f] !== undefined) allowed[f] = body[f]
  }
  if (body.images !== undefined) allowed.images = normalizeImages(body.images)

  const catalogue = await db.catalogue.update({ where: { id }, data: allowed })
  return NextResponse.json({ catalogue })
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { user, fail } = await requireAnyAdmin()
  if (fail) return fail
  const { id } = await ctx.params

  const existing = await db.catalogue.findUnique({ where: { id } })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (user!.role !== 'SUPER_ADMIN' && existing.tenantId !== user!.tenantId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await db.catalogue.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}

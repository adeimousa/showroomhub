import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAnyAdmin } from '@/lib/session'

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { user, fail } = await requireAnyAdmin()
  if (fail) return fail

  const { id } = await ctx.params
  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })

  const existing = await db.product.findUnique({ where: { id } })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (user!.role !== 'SUPER_ADMIN' && existing.tenantId !== user!.tenantId) {
    return NextResponse.json({ error: 'Not your product' }, { status: 403 })
  }

  const allowed: Record<string, any> = {}
  const fields = ['name','nameAr','nameHe','description','descriptionAr','descriptionHe','price','compareAt','sku','stock','image','featured','status','categoryId']
  for (const f of fields) {
    if (body[f] !== undefined) {
      if (['price','compareAt','stock'].includes(f)) {
        allowed[f] = body[f] == null ? null : Number(body[f])
      } else {
        allowed[f] = body[f]
      }
    }
  }

  const product = await db.product.update({
    where: { id },
    data: allowed,
    include: { category: true },
  })
  return NextResponse.json({ product })
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { user, fail } = await requireAnyAdmin()
  if (fail) return fail
  const { id } = await ctx.params

  const existing = await db.product.findUnique({ where: { id } })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (user!.role !== 'SUPER_ADMIN' && existing.tenantId !== user!.tenantId) {
    return NextResponse.json({ error: 'Not your product' }, { status: 403 })
  }

  await db.product.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}

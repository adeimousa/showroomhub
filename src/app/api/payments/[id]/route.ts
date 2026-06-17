import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireSuperAdmin } from '@/lib/session'

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { fail } = await requireSuperAdmin()
  if (fail) return fail
  const { id } = await ctx.params

  const body = await req.json().catch(() => ({}))

  const allowed: Record<string, any> = {}
  for (const f of ['status','method','invoiceNo','amount','currency','period']) {
    if (body[f] !== undefined) {
      if (f === 'amount') allowed[f] = Number(body[f])
      else allowed[f] = body[f]
    }
  }

  // If marking as paid, stamp paidAt
  if (body.status === 'PAID' && !body.paidAt) {
    allowed.paidAt = new Date()
  }

  const payment = await db.payment.update({
    where: { id },
    data: allowed,
    include: { tenant: { select: { id: true, name: true, slug: true } } },
  })
  return NextResponse.json({ payment })
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { fail } = await requireSuperAdmin()
  if (fail) return fail
  const { id } = await ctx.params
  await db.payment.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}

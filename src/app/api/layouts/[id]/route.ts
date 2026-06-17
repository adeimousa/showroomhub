import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireSuperAdmin } from '@/lib/session'

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { fail } = await requireSuperAdmin()
  if (fail) return fail
  const { id } = await ctx.params
  await db.layout.delete({ where: { id } }).catch(() => null)
  return NextResponse.json({ ok: true })
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { fail } = await requireSuperAdmin()
  if (fail) return fail
  const { id } = await ctx.params
  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  const layout = await db.layout.update({ where: { id }, data: body })
  return NextResponse.json({ layout })
}

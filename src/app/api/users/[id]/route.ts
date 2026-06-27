import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireSuperAdmin } from '@/lib/session'

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { fail } = await requireSuperAdmin()
  if (fail) return fail
  const { id } = await ctx.params
  const user = await db.user.findUnique({
    where: { id },
    include: { tenant: { select: { id: true, name: true } } },
  })
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ user })
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { fail } = await requireSuperAdmin()
  if (fail) return fail

  const { id } = await ctx.params
  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })

  // Validate: must have either email or phone
  if (body.email === null && body.phone === null) {
    return NextResponse.json({ error: 'Must have either email or phone' }, { status: 400 })
  }

  const allowed: Record<string, any> = {}

  if (body.name !== undefined) allowed.name = body.name
  if (body.email !== undefined) allowed.email = body.email ? body.email.toLowerCase() : null
  if (body.phone !== undefined) {
    // Sanitize phone: remove all non-digits
    allowed.phone = body.phone ? body.phone.replace(/\D/g, '') : null
  }
  if (body.password !== undefined) allowed.password = body.password
  if (body.role !== undefined) allowed.role = body.role
  if (body.tenantId !== undefined) allowed.tenantId = body.tenantId

  // Check uniqueness of email if changing
  if (allowed.email) {
    const existing = await db.user.findUnique({ where: { email: allowed.email } })
    if (existing && existing.id !== id) {
      return NextResponse.json({ error: 'Email already taken' }, { status: 409 })
    }
  }

  // Check uniqueness of phone if changing
  if (allowed.phone) {
    const existing = await db.user.findUnique({ where: { phone: allowed.phone } })
    if (existing && existing.id !== id) {
      return NextResponse.json({ error: 'Phone already taken' }, { status: 409 })
    }
  }

  try {
    const user = await db.user.update({
      where: { id },
      data: allowed,
      include: { tenant: { select: { id: true, name: true } } },
    })
    return NextResponse.json({ user })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to update user' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { fail } = await requireSuperAdmin()
  if (fail) return fail
  const { id } = await ctx.params
  await db.user.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}

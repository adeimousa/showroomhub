import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireSuperAdmin } from '@/lib/session'

// GET — Super admin: all users
export async function GET() {
  const { fail } = await requireSuperAdmin()
  if (fail) return fail

  const users = await db.user.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      tenant: { select: { id: true, name: true } },
    },
  })
  return NextResponse.json({ users })
}

// POST — Super admin only
export async function POST(req: NextRequest) {
  const { fail } = await requireSuperAdmin()
  if (fail) return fail

  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })

  if (!body.name || !body.password) {
    return NextResponse.json({ error: 'Missing required fields (name, password)' }, { status: 400 })
  }

  // Validate: must have either email or phone
  if (!body.email && !body.phone) {
    return NextResponse.json({ error: 'Must provide either email or phone' }, { status: 400 })
  }

  // Check uniqueness of email if provided
  if (body.email) {
    const existing = await db.user.findUnique({ where: { email: body.email.toLowerCase() } })
    if (existing) return NextResponse.json({ error: 'Email already taken' }, { status: 409 })
  }

  // Check uniqueness of phone if provided
  if (body.phone) {
    const existing = await db.user.findUnique({ where: { phone: body.phone } })
    if (existing) return NextResponse.json({ error: 'Phone already taken' }, { status: 409 })
  }

  try {
    const user = await db.user.create({
      data: {
        name: body.name,
        email: body.email ? body.email.toLowerCase() : null,
        phone: body.phone || null,
        password: body.password,
        role: body.role || 'CLIENT_ADMIN',
        tenantId: body.tenantId || null,
      },
      include: { tenant: { select: { id: true, name: true } } },
    })
    return NextResponse.json({ user }, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to create user' }, { status: 500 })
  }
}

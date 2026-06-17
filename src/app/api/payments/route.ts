import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireSuperAdmin } from '@/lib/session'

export async function GET() {
  const { fail } = await requireSuperAdmin()
  if (fail) return fail

  const payments = await db.payment.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      tenant: { select: { id: true, name: true, slug: true, plan: true, email: true } },
    },
  })
  return NextResponse.json({ payments })
}

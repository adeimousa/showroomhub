import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// GET — fetch a single order by ID (with tenant permission check)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  if (!id) {
    return NextResponse.json({ error: 'Missing order ID' }, { status: 400 })
  }

  try {
    const order = await db.order.findUnique({
      where: { id },
      include: {
        items: true,
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
          }
        }
      },
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Permission check: only allow tenant admins to view their own orders
    const session = await getServerSession(authOptions)
    if (session?.user) {
      const user = session.user as any
      if (user.role === 'CLIENT_ADMIN' && user.tenantId !== order.tenantId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
      }
    }

    return NextResponse.json({ order })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to fetch order' }, { status: 500 })
  }
}

// PATCH — update order status or notes (admin only)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await req.json().catch(() => null)

  if (!body) {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!id) {
    return NextResponse.json({ error: 'Missing order ID' }, { status: 400 })
  }

  // Authentication required for updates
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Fetch order to check tenant ownership
    const order = await db.order.findUnique({
      where: { id },
      select: { tenantId: true }
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Permission check: only allow tenant admins to update their own orders
    const user = session.user as any
    if (user.role === 'CLIENT_ADMIN' && user.tenantId !== order.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Allow updating status, notes, customerName, and customerPhone
    const { status, notes, customerName, customerPhone } = body
    const updateData: any = {}
    if (status) updateData.status = status
    if (notes !== undefined) updateData.notes = notes
    if (customerName !== undefined) updateData.customerName = customerName
    if (customerPhone !== undefined) updateData.customerPhone = customerPhone

    const updatedOrder = await db.order.update({
      where: { id },
      data: updateData,
      include: { items: true },
    })

    return NextResponse.json({ order: updatedOrder })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to update order' }, { status: 500 })
  }
}

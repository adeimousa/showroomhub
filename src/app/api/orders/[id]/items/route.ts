import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// POST — add a new item to an order
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: orderId } = await params
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  if (!body) {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { productId, productName, productSku, price, quantity, notes } = body

  if (!productName || !price || !quantity) {
    return NextResponse.json({
      error: 'Missing required fields (productName, price, quantity)'
    }, { status: 400 })
  }

  try {
    // Verify order exists and user has permission
    const order = await db.order.findUnique({
      where: { id: orderId },
      select: { tenantId: true, total: true }
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    const user = session.user as any
    if (user.role === 'CLIENT_ADMIN' && user.tenantId !== order.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const itemTotal = Number(price) * Number(quantity)

    // Create the new item
    const newItem = await db.orderItem.create({
      data: {
        orderId,
        productId: productId || null,
        productName,
        productSku: productSku || null,
        price: Number(price),
        quantity: Number(quantity),
        total: itemTotal,
        notes: notes || null,
      },
    })

    // Update order total
    await db.order.update({
      where: { id: orderId },
      data: {
        total: order.total + itemTotal,
      },
    })

    return NextResponse.json({ item: newItem }, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to add item' }, { status: 500 })
  }
}

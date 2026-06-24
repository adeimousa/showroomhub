import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET — list orders for current tenant (admin only)
export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const tenantId = url.searchParams.get('tenantId')

  if (!tenantId) {
    return NextResponse.json({ error: 'Missing tenantId' }, { status: 400 })
  }

  try {
    const orders = await db.order.findMany({
      where: { tenantId },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ orders })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to fetch orders' }, { status: 500 })
  }
}

// POST — create a new order (public endpoint for customers)
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })

  const { tenantId, customerName, customerPhone, items, total } = body

  if (!tenantId || !items || !total) {
    return NextResponse.json({
      error: 'Missing required fields (tenantId, items, total)'
    }, { status: 400 })
  }

  try {
    // Generate order number
    const count = await db.order.count({ where: { tenantId } })
    const orderNumber = `ORD-${String(count + 1).padStart(4, '0')}`

    const order = await db.order.create({
      data: {
        orderNumber,
        tenantId,
        customerName: customerName || null,
        customerPhone,
        total: Number(total),
        status: 'PENDING',
        items: {
          create: items.map((item: any) => ({
            productId: item.productId || null,
            productName: item.name,
            productSku: item.sku || null,
            price: Number(item.price),
            quantity: Number(item.qty),
            total: Number(item.price) * Number(item.qty),
          })),
        },
      },
      include: { items: true },
    })

    return NextResponse.json({ order }, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to create order' }, { status: 500 })
  }
}

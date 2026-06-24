import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// PATCH — update an order item (quantity or notes)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  const { id: orderId, itemId } = await params
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  if (!body) {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  try {
    // Get the item and verify permissions
    const item = await db.orderItem.findUnique({
      where: { id: itemId },
      include: {
        order: {
          select: { tenantId: true, total: true }
        }
      }
    })

    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 })
    }

    if (item.orderId !== orderId) {
      return NextResponse.json({ error: 'Item does not belong to this order' }, { status: 400 })
    }

    const user = session.user as any
    if (user.role === 'CLIENT_ADMIN' && user.tenantId !== item.order.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const updateData: any = {}
    let totalDifference = 0

    // Update quantity if provided
    if (body.quantity !== undefined) {
      const newQuantity = Number(body.quantity)
      if (newQuantity <= 0) {
        return NextResponse.json({ error: 'Quantity must be greater than 0' }, { status: 400 })
      }

      const oldTotal = item.total
      const newTotal = item.price * newQuantity

      updateData.quantity = newQuantity
      updateData.total = newTotal
      totalDifference = newTotal - oldTotal
    }

    // Update notes if provided
    if (body.notes !== undefined) {
      updateData.notes = body.notes || null
    }

    // Update the item
    const updatedItem = await db.orderItem.update({
      where: { id: itemId },
      data: updateData,
    })

    // Update order total if quantity changed
    if (totalDifference !== 0) {
      await db.order.update({
        where: { id: orderId },
        data: {
          total: item.order.total + totalDifference,
        },
      })
    }

    return NextResponse.json({ item: updatedItem })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to update item' }, { status: 500 })
  }
}

// DELETE — remove an item from the order
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  const { id: orderId, itemId } = await params
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Get the item and verify permissions
    const item = await db.orderItem.findUnique({
      where: { id: itemId },
      include: {
        order: {
          select: { tenantId: true, total: true },
          include: { items: true }
        }
      }
    })

    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 })
    }

    if (item.orderId !== orderId) {
      return NextResponse.json({ error: 'Item does not belong to this order' }, { status: 400 })
    }

    const user = session.user as any
    if (user.role === 'CLIENT_ADMIN' && user.tenantId !== item.order.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Prevent deleting the last item
    if (item.order.items.length <= 1) {
      return NextResponse.json({
        error: 'Cannot delete the last item from an order'
      }, { status: 400 })
    }

    // Delete the item
    await db.orderItem.delete({
      where: { id: itemId },
    })

    // Update order total
    await db.order.update({
      where: { id: orderId },
      data: {
        total: item.order.total - item.total,
      },
    })

    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to delete item' }, { status: 500 })
  }
}

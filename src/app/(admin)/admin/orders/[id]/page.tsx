import { notFound, redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { OrderDetailClient } from '@/components/client-admin/order-detail-client'

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    redirect('/auth/signin')
  }

  const user = session.user as any
  if (user.role !== 'CLIENT_ADMIN') {
    redirect('/admin')
  }

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
    notFound()
  }

  // Permission check: ensure admin can only view their own tenant's orders
  if (order.tenantId !== user.tenantId) {
    notFound()
  }

  return <OrderDetailClient order={order} />
}

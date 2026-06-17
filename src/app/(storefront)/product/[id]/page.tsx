import { headers } from 'next/headers'
import { db } from '@/lib/db'
import { ProductPageClient } from '@/components/storefront/product-page-client'

/**
 * Tenant product detail page.
 * URL: velvetnight.com/product/<productId>
 *
 * Middleware has set x-tenant-id. We fetch the product server-side
 * and pass it to the client component.
 */
export default async function ProductPageRoute({ params }: { params: Promise<{ id: string }> }) {
  const { id: productId } = await params
  const h = await headers()
  const tenantId = h.get('x-tenant-id')

  if (!tenantId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="text-5xl mb-4">🔍</div>
          <p className="text-sm text-muted-foreground">Product not found</p>
        </div>
      </div>
    )
  }

  const tenant = await db.tenant.findUnique({
    where: { id: tenantId },
    include: {
      layout: true,
      categories: { include: { _count: { select: { products: true } } } },
      products: { include: { category: true } },
    },
  })

  if (!tenant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="text-5xl mb-4">🔍</div>
          <p className="text-sm text-muted-foreground">Store not found</p>
        </div>
      </div>
    )
  }

  const product = tenant.products.find((p) => p.id === productId)
  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">🔍</div>
          <h1 className="text-xl font-bold mb-2">Product not found</h1>
          <p className="text-sm text-muted-foreground mb-4">
            This product may have been removed or is no longer available.
          </p>
          <a href="/" className="text-sm text-rose-600 underline">Back to store</a>
        </div>
      </div>
    )
  }

  return <ProductPageClient tenant={JSON.parse(JSON.stringify(tenant))} product={JSON.parse(JSON.stringify(product))} />
}

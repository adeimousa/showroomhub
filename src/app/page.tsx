import { headers } from 'next/headers'
import { db } from '@/lib/db'
import { SuperAdminEntry } from '@/components/super-admin/super-admin-entry'
import { StorefrontClient } from '@/components/storefront/storefront-client'
import { NotConfigured } from '@/components/not-configured'
import { StoreStatus } from '@/components/storefront/store-status'

/**
 * Root page — routes based on the Host header (set by middleware).
 *
 * - If host === ADMIN_DOMAIN → super admin login/dashboard
 * - If host is a tenant domain → tenant storefront (or paused/suspended page)
 * - Otherwise → "not configured" page
 *
 * Legacy URLs (?view=site&slug=…) are kept for sandbox preview testing.
 */
export default async function Home({ searchParams }: { searchParams: Promise<{ [key: string]: string | undefined }> }) {
  const params = await searchParams
  const h = await headers()
  const tenantId = h.get('x-tenant-id')
  const isAdminDomain = h.get('x-is-admin-domain') === '1'

  // Legacy: ?view=site&slug=… (sandbox preview)
  if (params.view === 'site' && params.slug) {
    const tenant = await db.tenant.findUnique({
      where: { slug: params.slug },
      include: {
        layout: true,
        categories: { include: { _count: { select: { products: true } } }, orderBy: { name: 'asc' } },
        heroSlides: { orderBy: { order: 'asc' } },
        products: { include: { category: true }, orderBy: { createdAt: 'desc' }, where: { status: 'ACTIVE' } },
      },
    })
    if (tenant) {
      if (tenant.status === 'PAUSED' || tenant.status === 'SUSPENDED') {
        return <StoreStatus tenant={JSON.parse(JSON.stringify(tenant))} />
      }
      return <StorefrontClient tenant={JSON.parse(JSON.stringify(tenant))} />
    }
    return <NotConfigured />
  }

  // If on the admin domain → super admin
  if (isAdminDomain) {
    return <SuperAdminEntry />
  }

  // If on a tenant domain → storefront
  if (tenantId) {
    const tenant = await db.tenant.findUnique({
      where: { id: tenantId },
      include: {
        layout: true,
        categories: { include: { _count: { select: { products: true } } }, orderBy: { name: 'asc' } },
        heroSlides: { orderBy: { order: 'asc' } },
        products: { include: { category: true }, orderBy: { createdAt: 'desc' }, where: { status: 'ACTIVE' } },
      },
    })
    if (tenant) {
      if (tenant.status === 'PAUSED' || tenant.status === 'SUSPENDED') {
        return <StoreStatus tenant={JSON.parse(JSON.stringify(tenant))} />
      }
      return <StorefrontClient tenant={JSON.parse(JSON.stringify(tenant))} />
    }
  }

  // Unknown domain → not configured
  return <NotConfigured />
}


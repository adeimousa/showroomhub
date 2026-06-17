import { headers } from 'next/headers'

/**
 * Get the tenant context from the request headers (set by middleware).
 * Used by server components and API routes to know which tenant the
 * current request belongs to.
 *
 * Returns:
 *   { tenantId, tenantSlug, tenantName } — if on a tenant domain
 *   { isAdminDomain: true } — if on the super admin domain
 *   null — if no tenant context (e.g. on /not-configured)
 */
export async function getTenantContext(): Promise<{
  tenantId?: string
  tenantSlug?: string
  tenantName?: string
  isAdminDomain?: boolean
} | null> {
  const h = await headers()
  const tenantId = h.get('x-tenant-id')
  const tenantSlug = h.get('x-tenant-slug')
  const tenantName = h.get('x-tenant-name')
  const isAdminDomain = h.get('x-is-admin-domain') === '1'

  if (tenantId) {
    return { tenantId, tenantSlug, tenantName }
  }
  if (isAdminDomain) {
    return { isAdminDomain: true }
  }
  return null
}

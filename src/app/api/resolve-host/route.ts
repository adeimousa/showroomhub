import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * GET /api/resolve-host?host=velvetnight.com
 *
 * Looks up which tenant owns a given host. Used by:
 *   - src/middleware.ts (to route requests based on host)
 *   - Client components (to know which tenant they're rendering)
 *
 * Returns:
 *   200 { tenantId, tenantSlug, tenantName } — if found
 *   404 { error: 'Not configured' } — if no tenant owns this host
 *
 * The host can be:
 *   - A custom domain (e.g. velvetnight.com) — matched against tenant.customDomains
 *   - A subdomain of the main domain (e.g. velvetnight.showroomhub.com) — NOT supported in v1
 *   - The main admin domain (e.g. showroomhub.com) — returns { isAdmin: true }
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const host = url.searchParams.get('host')

  if (!host) {
    return NextResponse.json({ error: 'Missing host parameter' }, { status: 400 })
  }

  // Normalize: strip port, strip leading www. for matching (but keep both in DB)
  const hostname = host.split(':')[0].toLowerCase()

  // Check if this is the main admin domain
  const adminDomain = process.env.ADMIN_DOMAIN || 'showroomhub.com'
  if (hostname === adminDomain.toLowerCase() || hostname === `www.${adminDomain.toLowerCase()}`) {
    return NextResponse.json({ isAdmin: true, host: hostname })
  }

  // Look up tenant by customDomains (JSON array stored as string)
  // SQLite doesn't have native JSON array queries, so we fetch all tenants
  // and filter in JS. This is fine for <1000 tenants; for more, switch to Postgres
  // with a proper array column or a join table.
  const tenants = await db.tenant.findMany({
    where: { status: { not: 'SUSPENDED' } },
    select: { id: true, slug: true, name: true, customDomains: true, domain: true },
  })

  for (const t of tenants) {
    let domains: string[] = []
    try {
      domains = JSON.parse(t.customDomains || '[]')
    } catch {
      domains = []
    }
    // Also include the legacy `domain` field if set
    if (t.domain && !domains.includes(t.domain)) {
      domains.push(t.domain)
    }

    const normalizedDomains = domains.map((d) => d.toLowerCase().trim())
    if (normalizedDomains.includes(hostname)) {
      return NextResponse.json({
        tenantId: t.id,
        tenantSlug: t.slug,
        tenantName: t.name,
        host: hostname,
      })
    }
  }

  return NextResponse.json({ error: 'Not configured', host: hostname }, { status: 404 })
}

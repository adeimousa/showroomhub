import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * White-label host-based routing middleware.
 *
 * Routing logic:
 *   1. If host === ADMIN_DOMAIN (e.g. showroomhub.com):
 *      - /            → super admin login page
 *      - /root-adminstration → super admin dashboard
 *      - /admin       → redirect to /root-adminstration
 *      - /api/*       → pass through
 *
 *   2. If host is a tenant's custom domain (looked up via /api/resolve-host):
 *      - /            → tenant storefront
 *      - /product/:id → tenant product page
 *      - /admin       → tenant admin login + dashboard
 *      - /api/*       → pass through (API resolves tenant from x-tenant-id header)
 *
 *   3. If host is not configured:
 *      - rewrite to /not-configured (generic page, no branding)
 *
 * Dev testing:
 *   - Append ?host=velvetnight.com to any URL to simulate that host
 *   - Works on localhost:3000
 *
 * The middleware sets these request headers for downstream pages/APIs:
 *   - x-tenant-id     — the tenant's database ID (if host is a tenant domain)
 *   - x-tenant-slug   — the tenant's slug
 *   - x-tenant-name   — the tenant's name
 *   - x-is-admin-domain — '1' if this is the super admin domain
 */

const ADMIN_DOMAIN = process.env.ADMIN_DOMAIN || 'showroomhub.com'

// Cache host → tenant lookups for 60 seconds to avoid hitting the DB on every request
const hostCache = new Map<string, { data: any; expires: number }>()
const CACHE_TTL = 60_000 // 60 seconds

async function resolveHost(host: string, origin: string): Promise<any> {
  const now = Date.now()
  const cached = hostCache.get(host)
  if (cached && cached.expires > now) {
    return cached.data
  }

  // Call our own API to resolve the host. Use an absolute URL so fetch works in edge runtime.
  try {
    const res = await fetch(`${origin}/api/resolve-host?host=${encodeURIComponent(host)}`, {
      // Avoid caching at the fetch layer — we have our own cache
      cache: 'no-store',
    })
    const data = await res.json()
    hostCache.set(host, { data, expires: now + CACHE_TTL })
    return data
  } catch (e) {
    // If the resolve API fails (e.g. DB not ready), treat as not configured
    return { error: 'Not configured' }
  }
}

export async function middleware(req: NextRequest) {
  const url = req.nextUrl
  const path = url.pathname

  // Skip static files and API routes (API routes resolve tenant themselves)
  if (
    path.startsWith('/api/') ||
    path.startsWith('/_next/') ||
    path.startsWith('/favicon') ||
    path.includes('.')
  ) {
    return NextResponse.next()
  }

  // Determine the effective host:
  // - In production: use the Host header
  // - In dev: allow ?host= override for testing
  const hostHeader = req.headers.get('host') || ''
  const hostname = hostHeader.split(':')[0].toLowerCase()
  const hostOverride = url.searchParams.get('host')
  const effectiveHost = (hostOverride || hostname).toLowerCase()

  // ----- Case 1: Super admin domain -----
  if (effectiveHost === ADMIN_DOMAIN.toLowerCase() || effectiveHost === `www.${ADMIN_DOMAIN.toLowerCase()}`) {
    // /admin → redirect to /root-adminstration
    if (path === '/admin' || path.startsWith('/admin/')) {
      return NextResponse.redirect(new URL('/root-adminstration', req.url))
    }
    // Everything else on the admin domain → pass through to (super-admin) route group
    const requestHeaders = new Headers(req.headers)
    requestHeaders.set('x-is-admin-domain', '1')
    return NextResponse.next({ request: { headers: requestHeaders } })
  }

  // ----- Case 2: Tenant domain -----
  const origin = new URL(req.url).origin
  const resolved = await resolveHost(effectiveHost, origin)

  if (resolved.tenantId) {
    // Set tenant headers and pass through
    const requestHeaders = new Headers(req.headers)
    requestHeaders.set('x-tenant-id', resolved.tenantId)
    requestHeaders.set('x-tenant-slug', resolved.tenantSlug)
    requestHeaders.set('x-tenant-name', resolved.tenantName)

    // In local dev, keep the ?host= parameter in the URL so buildTenantUrl() can preserve it
    // In production (custom domains), there's no ?host= parameter anyway
    return NextResponse.next({ request: { headers: requestHeaders } })
  }

  // ----- Case 3: Unknown domain -----
  // Rewrite to /not-configured (generic page, no branding)
  if (path !== '/not-configured') {
    const notConfiguredUrl = new URL('/not-configured', req.url)
    return NextResponse.rewrite(notConfiguredUrl)
  }

  return NextResponse.next()
}

export const config = {
  // Run on all routes except static assets and Next.js internals
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Builds a tenant-aware URL that works in both local dev and production.
 *
 * In local dev (localhost):
 *   - Preserves the ?host= parameter from the current URL
 *   - Example: buildTenantUrl('/product/123') → '/product/123?host=demo-furniture.com'
 *
 * In production (custom domain):
 *   - Returns the path without any query parameters
 *   - Example: buildTenantUrl('/product/123') → '/product/123'
 *
 * @param path - The path to navigate to (e.g., '/product/123', '/admin', '/')
 * @returns The full URL with host parameter if needed
 */
export function buildTenantUrl(path: string): string {
  if (typeof window === 'undefined') {
    // Server-side: just return the path
    return path
  }

  const currentUrl = new URL(window.location.href)
  const hostParam = currentUrl.searchParams.get('host')

  // If we have a host parameter (local dev), preserve it
  if (hostParam) {
    const url = new URL(path, window.location.origin)
    url.searchParams.set('host', hostParam)
    return url.pathname + url.search + url.hash
  }

  // Production: just return the path
  return path
}

/**
 * Gets the current host (domain) for the tenant.
 * Useful for displaying the current domain or building absolute URLs.
 *
 * @returns The effective host (either from ?host= param or actual domain)
 */
export function getCurrentTenantHost(): string | null {
  if (typeof window === 'undefined') return null

  const currentUrl = new URL(window.location.href)
  const hostParam = currentUrl.searchParams.get('host')

  return hostParam || window.location.hostname
}

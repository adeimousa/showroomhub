'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { LoginScreen } from '@/components/login-screen'
import { ClientAdminDashboard } from '@/components/client-admin/client-admin-dashboard'
import { Loader2 } from 'lucide-react'

/**
 * Tenant admin page.
 * URL: velvetnight.com/admin
 *
 * Shows:
 *   - Login screen (if not authenticated)
 *   - Client admin dashboard (if authenticated as CLIENT_ADMIN for THIS tenant)
 *   - Access denied (if authenticated as a different tenant's admin or as super admin)
 *
 * The tenant is inferred from the host. Cross-tenant logins are rejected.
 */
export default function TenantAdminPage() {
  const { data: session, status } = useSession()
  const [hostTenantId, setHostTenantId] = useState<string | null>(null)
  const [hostTenantName, setHostTenantName] = useState<string>('')

  // Resolve which tenant owns the current host
  useEffect(() => {
    ;(async () => {
      try {
        const url = new URL(window.location.href)
        const host = url.searchParams.get('host') || url.host
        const res = await fetch(`/api/resolve-host?host=${encodeURIComponent(host)}`)
        const data = await res.json()
        if (data.tenantId) {
          setHostTenantId(data.tenantId)
          setHostTenantName(data.tenantName || '')
        }
      } catch {
        // ignore — will show as access denied
      }
    })()
  }, [])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!session?.user) {
    return <LoginScreen tenantName={hostTenantName} />
  }

  const role = (session.user as any).role
  const userTenantId = (session.user as any).tenantId

  if (role === 'SUPER_ADMIN') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="text-center max-w-md">
          <div className="text-5xl mb-4">🔒</div>
          <h1 className="text-xl font-bold mb-2">Super admin detected</h1>
          <p className="text-sm text-muted-foreground mb-4">
            You're logged in as a platform admin. This page is for tenant admins.
          </p>
          <a href="/" className="text-sm text-rose-600 underline">Go to platform admin</a>
        </div>
      </div>
    )
  }

  if (role === 'CLIENT_ADMIN') {
    // Wait for hostTenantId to be resolved
    if (!hostTenantId) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )
    }

    // Cross-tenant check
    if (userTenantId !== hostTenantId) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
          <div className="text-center max-w-md">
            <div className="text-5xl mb-4">🚫</div>
            <h1 className="text-xl font-bold mb-2">Access denied</h1>
            <p className="text-sm text-muted-foreground mb-4">
              Your account doesn't belong to this store. Please use your own store's admin URL.
            </p>
            <button
              onClick={() => window.location.href = '/'}
              className="text-sm text-rose-600 underline"
            >
              Sign out
            </button>
          </div>
        </div>
      )
    }

    return <ClientAdminDashboard />
  }

  return <LoginScreen tenantName={hostTenantName} />
}

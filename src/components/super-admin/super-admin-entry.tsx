'use client'

import { useSession } from 'next-auth/react'
import { LoginScreen } from '@/components/login-screen'
import { SuperAdminDashboard } from '@/components/super-admin/super-admin-dashboard'
import { Loader2 } from 'lucide-react'

/**
 * Entry point for the super admin domain.
 * Shows login (if not authenticated) or super admin dashboard.
 */
export function SuperAdminEntry() {
  const { data: session, status } = useSession()

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!session?.user) {
    return <LoginScreen />
  }

  const role = (session.user as any).role
  if (role === 'SUPER_ADMIN') {
    return <SuperAdminDashboard />
  }

  // A client admin landed on the super admin domain
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="text-center max-w-md">
        <div className="text-5xl mb-4">🔒</div>
        <h1 className="text-xl font-bold mb-2">Wrong domain</h1>
        <p className="text-sm text-muted-foreground mb-4">
          You're logged in as a tenant admin. Please visit your own store's
          domain and go to <code className="px-1 py-0.5 bg-slate-100 rounded">/admin</code>.
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

'use client'

import { useSession } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import { LoginScreen } from '@/components/login-screen'
import { SuperAdminDashboard } from '@/components/super-admin/super-admin-dashboard'
import { ClientAdminDashboard } from '@/components/client-admin/client-admin-dashboard'
import { StorefrontPreview } from '@/components/storefront/storefront-preview'
import { Loader2 } from 'lucide-react'

export default function Home() {
  const { data: session, status } = useSession()
  const search = useSearchParams()
  const view = search.get('view')
  const slug = search.get('slug')

  // Public storefront preview mode (open to anyone with the slug)
  if (view === 'site' && slug) {
    return <StorefrontPreview slug={slug} />
  }

  // Auth loading
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // Not authenticated
  if (!session?.user) {
    return <LoginScreen />
  }

  // Route by role
  const role = (session.user as any).role
  if (role === 'SUPER_ADMIN') return <SuperAdminDashboard />
  if (role === 'CLIENT_ADMIN') return <ClientAdminDashboard />

  // Unknown role → back to login
  return <LoginScreen />
}

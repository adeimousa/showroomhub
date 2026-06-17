import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NextResponse } from 'next/server'

export type SessionUser = {
  id: string
  email: string
  name?: string | null
  role: 'SUPER_ADMIN' | 'CLIENT_ADMIN'
  tenantId?: string | null
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return null
  return {
    // @ts-expect-error custom field
    id: session.user.id || '',
    email: session.user.email,
    name: session.user.name,
    // @ts-expect-error custom field
    role: session.user.role,
    // @ts-expect-error custom field
    tenantId: session.user.tenantId,
  }
}

export function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

export function forbidden(msg = 'Forbidden') {
  return NextResponse.json({ error: msg }, { status: 403 })
}

export async function requireSuperAdmin() {
  const user = await getCurrentUser()
  if (!user) return { user: null, fail: unauthorized() }
  if (user.role !== 'SUPER_ADMIN') return { user: null, fail: forbidden('Super admin only') }
  return { user, fail: null }
}

export async function requireClientAdmin(tenantId?: string) {
  const user = await getCurrentUser()
  if (!user) return { user: null, fail: unauthorized() }
  if (user.role !== 'CLIENT_ADMIN') return { user: null, fail: forbidden('Client admin only') }
  if (tenantId && user.tenantId !== tenantId) {
    return { user: null, fail: forbidden('Not your tenant') }
  }
  return { user, fail: null }
}

export async function requireAnyAdmin() {
  const user = await getCurrentUser()
  if (!user) return { user: null, fail: unauthorized() }
  if (user.role !== 'SUPER_ADMIN' && user.role !== 'CLIENT_ADMIN') {
    return { user: null, fail: forbidden('Admin only') }
  }
  return { user, fail: null }
}

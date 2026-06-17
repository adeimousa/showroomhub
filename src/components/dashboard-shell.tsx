'use client'

import { signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
import { useI18n } from '@/hooks/use-i18n'
import { LanguageSwitcher } from '@/components/language-switcher'
import { Button } from '@/components/ui/button'
import { Sofa, LogOut, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export type NavItem = {
  key: string
  label: string
  icon: React.ComponentType<{ className?: string }>
}

export function DashboardShell({
  role,
  user,
  navItems,
  activeKey,
  onChange,
  children,
  headerAccent = 'from-amber-500 to-rose-500',
}: {
  role: 'SUPER_ADMIN' | 'CLIENT_ADMIN'
  user: { name?: string | null; email?: string | null; tenantName?: string | null }
  navItems: NavItem[]
  activeKey: string
  onChange: (key: string) => void
  children: React.ReactNode
  headerAccent?: string
}) {
  const { t, isRTL } = useI18n()
  const router = useRouter()
  const [outLoading, setOutLoading] = useState(false)

  const handleLogout = async () => {
    setOutLoading(true)
    try {
      await signOut({ redirect: false })
      toast.success(t('auth.logout'))
      router.refresh()
    } finally {
      setOutLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Top header */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200">
        <div className="px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <div className={cn('h-8 w-8 rounded-lg bg-gradient-to-br flex items-center justify-center shrink-0', headerAccent)}>
              <Sofa className="h-4 w-4 text-white" />
            </div>
            <div className="min-w-0">
              <div className="font-semibold text-sm truncate">{t('brand.name')}</div>
              <div className="text-[10px] text-muted-foreground truncate">
                {role === 'SUPER_ADMIN' ? 'Platform Administration' : user.tenantName || 'Store Administration'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100">
              <div className="text-xs">
                <div className="font-medium leading-tight">{user.name || user.email}</div>
                <div className="text-muted-foreground leading-tight text-[10px]">{user.email}</div>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={handleLogout} disabled={outLoading} className="gap-1.5">
              {outLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
              <span className="hidden sm:inline">{t('auth.logout')}</span>
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <nav className="px-4 sm:px-6 flex gap-1 overflow-x-auto" dir={isRTL ? 'rtl' : 'ltr'}>
          {navItems.map((item) => {
            const Icon = item.icon
            const active = item.key === activeKey
            return (
              <button
                key={item.key}
                onClick={() => onChange(item.key)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors',
                  active
                    ? 'border-amber-500 text-amber-700'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-slate-50'
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </button>
            )
          })}
        </nav>
      </header>

      <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>

      <footer className="mt-auto py-4 px-6 text-center text-xs text-muted-foreground border-t border-slate-200 bg-white">
        {t('brand.name')} · Multi-tenant furniture SaaS · {new Date().getFullYear()}
      </footer>
    </div>
  )
}

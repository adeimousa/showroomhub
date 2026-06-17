'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useI18n } from '@/hooks/use-i18n'
import { DashboardShell, NavItem } from '@/components/dashboard-shell'
import { LayoutGrid, Building2, Palette, CreditCard } from 'lucide-react'
import { OverviewTab } from './overview-tab'
import { TenantsTab } from './tenants-tab'
import { LayoutsTab } from './layouts-tab'
import { PaymentsTab } from './payments-tab'

export function SuperAdminDashboard() {
  const { t } = useI18n()
  const { data: session } = useSession()
  const [active, setActive] = useState('overview')

  const navItems: NavItem[] = [
    { key: 'overview', label: t('nav.overview'),    icon: LayoutGrid },
    { key: 'tenants',  label: t('nav.tenants'),     icon: Building2 },
    { key: 'layouts',  label: t('nav.layouts'),     icon: Palette },
    { key: 'payments', label: t('nav.payments'),    icon: CreditCard },
  ]

  return (
    <DashboardShell
      role="SUPER_ADMIN"
      user={{
        name: session?.user?.name,
        email: session?.user?.email,
      }}
      navItems={navItems}
      activeKey={active}
      onChange={setActive}
      headerAccent="from-rose-500 to-amber-500"
    >
      {active === 'overview' && <OverviewTab onNavigate={setActive} />}
      {active === 'tenants'  && <TenantsTab />}
      {active === 'layouts'  && <LayoutsTab />}
      {active === 'payments' && <PaymentsTab />}
    </DashboardShell>
  )
}

'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useI18n } from '@/hooks/use-i18n'
import { DashboardShell, NavItem } from '@/components/dashboard-shell'
import { Package, FolderTree, Images, Palette, ExternalLink, MessageCircle } from 'lucide-react'
import { ProductsTab } from './products-tab'
import { CategoriesTab } from './categories-tab'
import { HeroSlidesTab } from './hero-slides-tab'
import { ThemeTab } from './theme-tab'
import { ContactTab } from './contact-tab'
import { Button } from '@/components/ui/button'
import { useQuery } from '@tanstack/react-query'

export function ClientAdminDashboard() {
  const { t } = useI18n()
  const { data: session } = useSession()
  const [active, setActive] = useState('products')

  // Fetch the current tenant so we know the slug for "View site"
  const tenantQ = useQuery<{ tenants: any[] }>({
    queryKey: ['my-tenant'],
    queryFn: async () => {
      const r = await fetch('/api/tenants')
      if (!r.ok) throw new Error('failed')
      return r.json()
    },
  })
  const myTenant = tenantQ.data?.tenants?.[0]
  const tenantName = myTenant?.name

  const navItems: NavItem[] = [
    { key: 'products',    label: t('nav.products'),    icon: Package },
    { key: 'categories',  label: t('nav.categories'),  icon: FolderTree },
    { key: 'heroSlides',  label: t('nav.heroSlides'),  icon: Images },
    { key: 'theme',       label: t('nav.theme'),       icon: Palette },
    { key: 'contact',     label: t('nav.contact'),     icon: MessageCircle },
  ]

  const handleViewSite = () => {
    if (myTenant?.slug) {
      // Use the preview URL with slug for development/testing
      const url = new URL(window.location.href)
      const host = url.searchParams.get('host')
      if (host) {
        // If we have a host param, use it to view the live site
        window.open(`/?host=${encodeURIComponent(host)}`, '_blank')
      } else {
        // Fallback to slug-based preview
        window.open(`/?view=site&slug=${encodeURIComponent(myTenant.slug)}`, '_blank')
      }
    }
  }

  return (
    <DashboardShell
      role="CLIENT_ADMIN"
      user={{
        name: session?.user?.name,
        email: session?.user?.email,
        tenantName,
      }}
      navItems={navItems}
      activeKey={active}
      onChange={setActive}
      headerAccent="from-emerald-500 to-amber-500"
    >
      <div className="space-y-4">
        {myTenant?.slug && (
          <div className="flex justify-end">
            <Button onClick={handleViewSite} variant="outline" size="sm" className="gap-1.5">
              <ExternalLink className="h-3.5 w-3.5" />
              {t('common.viewSite')}
            </Button>
          </div>
        )}
        {active === 'products'   && <ProductsTab />}
        {active === 'categories' && <CategoriesTab />}
        {active === 'heroSlides' && <HeroSlidesTab />}
        {active === 'theme'      && <ThemeTab />}
        {active === 'contact'    && <ContactTab />}
      </div>
    </DashboardShell>
  )
}

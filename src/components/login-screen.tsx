'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useI18n } from '@/hooks/use-i18n'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { LanguageSwitcher } from '@/components/language-switcher'
import { Separator } from '@/components/ui/separator'
import { Sofa, Loader2, ShieldCheck, Store } from 'lucide-react'

const DEMO_ACCOUNTS = [
  { label: 'Super Admin',  identifier: 'admin@platform.com',       password: 'admin123',     role: 'SUPER_ADMIN'  },
  { label: 'Demo Tenant',  identifier: 'admin@demofurniture.com',  password: 'demo123',      role: 'CLIENT_ADMIN' },
  { label: 'Heritage Oak', identifier: 'admin@heritageoak.com',    password: 'heritage123',  role: 'CLIENT_ADMIN' },
]

export function LoginScreen({ tenantName }: { tenantName?: string } = {}) {
  const { t } = useI18n()
  const router = useRouter()
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  // If tenantName is provided, we're on a tenant admin page — hide the
  // "ShowroomHub" branding and demo accounts, show the tenant's name instead.
  const isTenantAdmin = !!tenantName

  const handleSubmit = async (e: React.FormEvent, preset?: { identifier: string; password: string }) => {
    e.preventDefault()
    const finalIdentifier = preset?.identifier ?? identifier
    const finalPassword = preset?.password ?? password

    if (!finalIdentifier || !finalPassword) {
      toast.error(t('auth.invalidCreds'))
      return
    }

    setLoading(true)
    try {
      const res = await signIn('credentials', {
        identifier: finalIdentifier,
        password: finalPassword,
        redirect: false,
      })
      if (res?.error) {
        toast.error(t('auth.invalidCreds'))
      } else if (res?.ok) {
        toast.success(t('auth.welcome'))
        router.refresh()
      }
    } catch (err) {
      toast.error(t('toast.error'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex flex-col bg-gradient-to-br from-slate-50 via-white to-amber-50">
      {/* Top bar */}
      <header className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          {isTenantAdmin ? (
            // Tenant admin login — show tenant's name, no ShowroomHub branding
            <>
              <div className="h-9 w-9 rounded-lg bg-slate-800 flex items-center justify-center">
                <Store className="h-5 w-5 text-white" />
              </div>
              <span className="font-bold text-lg">{tenantName} Admin</span>
            </>
          ) : (
            // Super admin login — ShowroomHub branding
            <>
              <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-amber-500 to-rose-500 flex items-center justify-center">
                <Sofa className="h-5 w-5 text-white" />
              </div>
              <span className="font-bold text-lg">{t('brand.name')}</span>
            </>
          )}
        </div>
        <LanguageSwitcher />
      </header>

      {/* Main */}
      <main className="flex-1 grid lg:grid-cols-2 items-stretch">
        {/* Left — hero (only shown on super admin login, NOT on tenant admin login) */}
        {!isTenantAdmin && (
        <section className="hidden lg:flex flex-col justify-center px-12 xl:px-24 py-12 bg-gradient-to-br from-amber-500/10 via-rose-500/5 to-transparent">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-medium mb-6">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
              30 unique storefront layouts · 3 languages · RTL-ready
            </div>
            <h1 className="text-4xl xl:text-5xl font-bold tracking-tight text-slate-900 leading-tight">
              One platform. <span className="bg-gradient-to-r from-amber-600 to-rose-600 bg-clip-text text-transparent">Thirty storefronts.</span>
            </h1>
            <p className="mt-4 text-lg text-slate-600 leading-relaxed">
              ShowroomHub lets you spin up branded furniture storefronts in minutes. Pick a layout, customize colors, and your tenant is live.
            </p>
            <ul className="mt-8 space-y-3">
              {[
                'Modern, Luxury, Minimal, Creative, Classic — 6 layouts each',
                'Per-tenant theme overrides and font picker',
                'Super admin dashboard with pause/resume & payment tracking',
                'Multilingual storefronts: English, Arabic (RTL), Hebrew (RTL)',
              ].map((line, i) => (
                <li key={i} className="flex items-start gap-3 text-slate-700">
                  <span className="mt-1 h-5 w-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs">✓</span>
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
        )}

        {/* Right — login form */}
        <section className="flex items-center justify-center px-6 py-12">
          <Card className="w-full max-w-md shadow-xl border-slate-200">
            <CardHeader className="space-y-2 text-center">
              <div className="mx-auto lg:hidden h-12 w-12 rounded-xl bg-gradient-to-br from-amber-500 to-rose-500 flex items-center justify-center mb-2">
                <Sofa className="h-6 w-6 text-white" />
              </div>
              <CardTitle className="text-2xl">{t('auth.welcome')}</CardTitle>
              <CardDescription>{t('brand.tagline')}</CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="identifier">Email or Phone</Label>
                  <Input
                    id="identifier"
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="you@example.com or phone number"
                    autoComplete="username"
                    disabled={loading}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="password">{t('auth.password')}</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    disabled={loading}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {t('auth.signingIn')}
                    </>
                  ) : (
                    t('auth.signinBtn')
                  )}
                </Button>
              </form>

              {/* Demo accounts — only shown on super admin login, NOT on tenant admin login */}
              {!isTenantAdmin && (
              <>
              <div className="relative my-6">
                <Separator />
                <span className="absolute inset-0 -top-3 mx-auto w-fit bg-white px-3 text-xs text-muted-foreground">
                  {t('auth.demoCreds')}
                </span>
              </div>

              <div className="space-y-2">
                {DEMO_ACCOUNTS.map((acc) => (
                  <button
                    key={acc.identifier}
                    onClick={(e) => handleSubmit(e, acc)}
                    disabled={loading}
                    className="w-full text-left p-3 rounded-lg border border-slate-200 hover:border-amber-400 hover:bg-amber-50/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed group"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${acc.role === 'SUPER_ADMIN' ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
                        {acc.role === 'SUPER_ADMIN' ? <ShieldCheck className="h-4 w-4" /> : <Store className="h-4 w-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium">{acc.label}</div>
                        <div className="text-xs text-muted-foreground truncate">{acc.identifier}</div>
                      </div>
                      <div className="text-xs text-muted-foreground group-hover:text-amber-700 font-mono">
                        {acc.password}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              </>
              )}
            </CardContent>

            <CardFooter className="text-center text-xs text-muted-foreground justify-center">
              {isTenantAdmin
                ? `${tenantName} · ${new Date().getFullYear()}`
                : `${t('brand.name')} · ${new Date().getFullYear()}`}
            </CardFooter>
          </Card>
        </section>
      </main>
    </div>
  )
}

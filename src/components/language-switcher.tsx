'use client'

import { useI18n } from '@/hooks/use-i18n'
import { LANGS } from '@/lib/i18n'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import { Languages } from 'lucide-react'

export function LanguageSwitcher({ variant = 'ghost' }: { variant?: 'ghost' | 'outline' }) {
  const { lang, setLang } = useI18n()
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size="sm" className="gap-1.5">
          <Languages className="h-4 w-4" />
          <span className="hidden sm:inline">{LANGS.find((l) => l.code === lang)?.native}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {LANGS.map((l) => (
          <DropdownMenuItem
            key={l.code}
            onClick={() => setLang(l.code)}
            className={lang === l.code ? 'bg-accent' : ''}
          >
            <span className="mr-2">{l.native}</span>
            <span className="text-xs text-muted-foreground">({l.label})</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

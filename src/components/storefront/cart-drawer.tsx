'use client'

import { useState, useEffect } from 'react'
import { useI18n } from '@/hooks/use-i18n'
import { useCartStore } from '@/hooks/use-cart'
import { buildWhatsAppMessage, buildWhatsAppUrl, buildFollowUpMessage } from '@/lib/whatsapp'
import { toast } from 'sonner'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  ShoppingCart, X, Plus, Minus, Trash2, MessageCircle, Loader2, CheckCircle2, AlertCircle, Send,
} from 'lucide-react'
import { cn } from '@/lib/utils'

type Props = {
  tenant: {
    name: string
    slug: string
    whatsappNumber: string | null
    whatsappPrefill: string | null
  }
}

export function CartDrawer({ tenant }: Props) {
  const { t, isRTL, lang } = useI18n()
  const { items, isOpen, close, increment, decrement, remove, clear, subtotal, totalItems } = useCartStore()
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [sendCount, setSendCount] = useState(0)

  // Reset sent state when cart contents change after a send
  useEffect(() => {
    if (sent && sendCount > 0 && items.length === 0) {
      queueMicrotask(() => {
        setSent(false)
        setSendCount(0)
      })
    }
  }, [items, sent, sendCount])

  const hasWhatsApp = !!tenant.whatsappNumber
  const total = subtotal()
  const count = totalItems()

  const handleSend = async () => {
    if (!hasWhatsApp) {
      toast.error(t('cart.noWhatsapp'), { description: t('cart.noWhatsappMsg') })
      return
    }
    if (items.length === 0) return

    setSending(true)
    try {
      // If this is the first send, use the full message format.
      // On subsequent sends, the cart is intentionally kept so the customer
      // can add more items and send a follow-up message to the same
      // WhatsApp conversation.
      const isFirst = sendCount === 0
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
      const message = isFirst
        ? buildWhatsAppMessage({
            intro: tenant.whatsappPrefill,
            tenantName: tenant.name,
            items: items.map((i) => ({ id: i.id, name: i.name, sku: i.sku, price: i.price, qty: i.qty })),
            lang,
            tenantSlug: tenant.slug,
            baseUrl,
          })
        : buildFollowUpMessage({
            items: items.map((i) => ({ id: i.id, name: i.name, sku: i.sku, price: i.price, qty: i.qty })),
            sendCount,
            lang,
            tenantSlug: tenant.slug,
            baseUrl,
          })

      const url = buildWhatsAppUrl(tenant.whatsappNumber!, message)
      window.open(url, '_blank')

      setSent(true)
      setSendCount((c) => c + 1)
      toast.success(t('cart.sent'), {
        description: t('cart.sentMsg'),
        duration: 6000,
      })
    } catch (e: any) {
      toast.error(t('toast.error'))
    } finally {
      setSending(false)
    }
  }

  const handleClear = () => {
    clear()
    setSent(false)
    setSendCount(0)
    toast.success(t('cart.cleared'))
  }

  return (
    <Sheet open={isOpen} onOpenChange={(o) => !o && close()}>
      <SheetContent
        side={isRTL ? 'left' : 'right'}
        className="w-full sm:max-w-md flex flex-col p-0"
      >
        {/* Header */}
        <SheetHeader className="px-4 py-4 border-b border-slate-200 space-y-1">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2 text-base">
              <ShoppingCart className="h-4 w-4" />
              {t('cart.title')}
              {count > 0 && (
                <Badge variant="secondary" className="text-[10px]">
                  {count} {count === 1 ? t('cart.item') : t('cart.items')}
                </Badge>
              )}
            </SheetTitle>
          </div>
          <SheetDescription className="text-xs">
            {tenant.name} · {t('cart.subtotal')}: ₪{total.toLocaleString()}
          </SheetDescription>
        </SheetHeader>

        {/* Body */}
        <div className="flex-1 overflow-y-auto scroll-thin">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center px-6 text-center">
              <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                <ShoppingCart className="h-7 w-7 text-slate-400" />
              </div>
              <h3 className="font-medium text-sm mb-1">{t('cart.empty')}</h3>
              <p className="text-xs text-muted-foreground mb-4">{t('cart.emptyMsg')}</p>
              <Button variant="outline" size="sm" onClick={close}>
                {t('cart.continueShopping')}
              </Button>
            </div>
          ) : (
            <div className="p-3 space-y-2">
              {items.map((item) => (
                <div key={item.id} className="flex items-center gap-3 p-2 rounded-lg border border-slate-100 hover:bg-slate-50">
                  <div className="h-12 w-12 rounded-md bg-slate-100 flex items-center justify-center text-2xl shrink-0 overflow-hidden">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-[9px] text-muted-foreground text-center px-1">{t('common.noImage')}</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium line-clamp-1">{item.name}</div>
                    {item.sku && <div className="text-[10px] text-muted-foreground font-mono">{item.sku}</div>}
                    <div className="text-xs text-muted-foreground">
                      ₪{item.price.toLocaleString()} {t('cart.each')}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => decrement(item.id)}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-7 text-center text-sm font-medium">{item.qty}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => increment(item.id)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 ml-1 text-rose-600 hover:text-rose-700"
                      onClick={() => remove(item.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <div className="text-sm font-bold w-16 text-right shrink-0">
                    ₪{(item.price * item.qty).toLocaleString()}
                  </div>
                </div>
              ))}

              {sent && (
                <div className="mt-3 p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                    <div className="flex-1">
                      <div className="text-xs font-medium text-emerald-800">
                        {t('cart.sent')} · #{sendCount}
                      </div>
                      <div className="text-[10px] text-emerald-700 mt-0.5">
                        {t('cart.keepCart')}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {!hasWhatsApp && items.length > 0 && (
                <div className="mt-3 p-3 rounded-lg bg-amber-50 border border-amber-200">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                    <div className="flex-1">
                      <div className="text-xs font-medium text-amber-800">{t('cart.noWhatsapp')}</div>
                      <div className="text-[10px] text-amber-700 mt-0.5">{t('cart.noWhatsappMsg')}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <SheetFooter className="border-t border-slate-200 p-3 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{t('cart.subtotal')}</span>
              <span className="font-bold text-lg">₪{total.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{t('cart.totalItems')}</span>
              <span>{count}</span>
            </div>
            <Separator />
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleClear}
                className="gap-1.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
              >
                <Trash2 className="h-3.5 w-3.5" />
                {t('cart.clear')}
              </Button>
              <Button
                size="sm"
                onClick={handleSend}
                disabled={sending || !hasWhatsApp}
                className="gap-1.5 bg-emerald-600 hover:bg-emerald-700"
              >
                {sending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : sent ? (
                  <Send className="h-3.5 w-3.5" />
                ) : (
                  <MessageCircle className="h-3.5 w-3.5" />
                )}
                {sent ? t('cart.sendAnother') : t('cart.sendWhatsapp')}
              </Button>
            </div>
            {sent && (
              <p className="text-[10px] text-center text-muted-foreground">
                {t('cart.keepCart')}
              </p>
            )}
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  )
}

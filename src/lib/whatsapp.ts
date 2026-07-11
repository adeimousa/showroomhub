import { translate, type Lang } from './i18n'

/**
 * Build a full, clickable product URL for the storefront.
 *
 * WhatsApp only auto-links strings that look like real URLs, so we need an
 * absolute URL with a scheme + host — a bare "slug/p/id" renders as broken
 * text. Points at the real /product/[id] route.
 * Returns null when we don't have a base URL to build an absolute link from.
 */
function productUrl(baseUrl: string | null | undefined, id: string): string | null {
  if (!baseUrl) return null
  const origin = baseUrl.replace(/\/+$/, '')
  return `${origin}/product/${encodeURIComponent(id)}`
}

/**
 * Compose a WhatsApp order message from cart items.
 *
 * The message format is:
 *   <intro line, set by tenant>
 *
 *   1. <Product name>
 *      <sku>
 *      Qty: 2 × ₪199 = ₪398
 *
 *   2. <Product name>
 *      ...
 *
 *   ———
 *   Total items: 5
 *   Subtotal: ₪1,234
 *
 *   Sent from <tenant name> storefront
 */
export function buildWhatsAppMessage(opts: {
  intro?: string | null
  introAr?: string | null
  introHe?: string | null
  tenantName: string
  items: Array<{ id?: string; name: string; sku?: string | null; price: number; qty: number }>
  currency?: string
  lang?: Lang
  tenantSlug?: string
  baseUrl?: string
  orderId?: string
  orderNumber?: string
}): string {
  const { intro, introAr, introHe, tenantName, items, currency = 'ILS', lang = 'en', tenantSlug, baseUrl, orderId, orderNumber } = opts
  const sym = currency === 'ILS' ? '₪' : `${currency} `
  const t = (key: string) => translate(lang, key, '', { tenantName })

  // Select the appropriate intro based on language with fallback
  let customIntro: string | null = null
  if (lang === 'ar' && introAr) {
    customIntro = introAr
  } else if (lang === 'he' && introHe) {
    customIntro = introHe
  } else if (intro) {
    customIntro = intro
  }

  const lines: string[] = []
  // Use custom intro if available, otherwise use translated default
  lines.push(customIntro || t('whatsapp.intro'))
  lines.push('')

  // Limit to 10 items to avoid URL length issues
  const MAX_ITEMS = 10
  const displayItems = items.slice(0, MAX_ITEMS)
  const hasMore = items.length > MAX_ITEMS

  displayItems.forEach((it, i) => {
    const lineTotal = it.qty * it.price
    lines.push(`${i + 1}. ${it.name}`)
    // Full, clickable link to the product page
    if (it.id) {
      const url = productUrl(baseUrl, it.id)
      if (url) lines.push(`   ${url}`)
    }
    if (it.sku) lines.push(`   ${t('whatsapp.sku')} ${it.sku}`)
    lines.push(`   ${t('whatsapp.qty')} ${it.qty} × ${sym}${it.price.toLocaleString()} = ${sym}${lineTotal.toLocaleString()}`)
    lines.push('')
  })

  if (hasMore) {
    lines.push(`... ${translate(lang, 'whatsapp.andMore', '', { count: items.length - MAX_ITEMS })}`)
    lines.push('')
  }

  const totalItems = items.reduce((s, i) => s + i.qty, 0)
  const subtotal = items.reduce((s, i) => s + i.qty * i.price, 0)
  lines.push('———')
  lines.push(`${t('whatsapp.totalItems')} ${totalItems}`)
  lines.push(`${t('whatsapp.subtotal')} ${sym}${subtotal.toLocaleString()}`)
  lines.push('')

  // Add order number if available
  if (orderId && orderNumber) {
    lines.push(`${translate(lang, 'whatsapp.orderNumber', '', { orderNumber })}`)
    lines.push('')
  }

  lines.push(t('whatsapp.sentFrom'))
  return lines.join('\n')
}

/**
 * Build a wa.me URL that opens WhatsApp with a pre-filled message.
 *
 * `number` should be E.164 digits only (no +, no spaces).
 */
export function buildWhatsAppUrl(number: string, message: string): string {
  const clean = number.replace(/[^0-9]/g, '')
  return `https://wa.me/${clean}?text=${encodeURIComponent(message)}`
}

/**
 * Build a "follow-up" message for sending additional items to the same
 * conversation. The follow-up is intentionally lighter than the first
 * message — it just lists what's new since the last send.
 */
export function buildFollowUpMessage(opts: {
  items: Array<{ id?: string; name: string; sku?: string | null; price: number; qty: number }>
  currency?: string
  sendCount: number
  lang?: Lang
  tenantSlug?: string
  baseUrl?: string
  orderId?: string
  orderNumber?: string
}): string {
  const { items, currency = 'ILS', sendCount, lang = 'en', tenantSlug, baseUrl, orderId, orderNumber } = opts
  const sym = currency === 'ILS' ? '₪' : `${currency} `
  const t = (key: string) => translate(lang, key, '', { sendCount })

  const lines: string[] = []
  lines.push(t('whatsapp.followUp'))
  lines.push('')

  // Limit to 10 items to avoid URL length issues
  const MAX_ITEMS = 10
  const displayItems = items.slice(0, MAX_ITEMS)
  const hasMore = items.length > MAX_ITEMS

  displayItems.forEach((it, i) => {
    const lineTotal = it.qty * it.price
    lines.push(`${i + 1}. ${it.name}`)
    // Full, clickable link to the product page
    if (it.id) {
      const url = productUrl(baseUrl, it.id)
      if (url) lines.push(`   ${url}`)
    }
    if (it.sku) lines.push(`   ${t('whatsapp.sku')} ${it.sku}`)
    lines.push(`   ${t('whatsapp.qty')} ${it.qty} × ${sym}${it.price.toLocaleString()} = ${sym}${lineTotal.toLocaleString()}`)
    lines.push('')
  })

  if (hasMore) {
    lines.push(`... ${translate(lang, 'whatsapp.andMore', '', { count: items.length - MAX_ITEMS })}`)
    lines.push('')
  }

  const subtotal = items.reduce((s, i) => s + i.qty * i.price, 0)
  lines.push(`${t('whatsapp.subtotalItems')} ${sym}${subtotal.toLocaleString()}`)
  lines.push('')

  // Add order number if available
  if (orderId && orderNumber) {
    lines.push(`${translate(lang, 'whatsapp.orderNumber', '', { orderNumber })}`)
  }

  return lines.join('\n')
}

/**
 * Build a single-item WhatsApp message — used by the "Order via WhatsApp"
 * button on a product details dialog. Bypasses the cart entirely.
 *
 * Format:
 *   <intro>
 *
 *   <Product name>
 *   SKU: ...
 *   Price: ₪199 each
 *   Quantity: 2
 *   Total: ₪398
 *
 *   Sent from <tenant> storefront
 *
 * If the tenant has set a custom intro, we use it verbatim (since it's their
 * voice). Otherwise we synthesize a sensible singular-form default.
 */
export function buildSingleItemMessage(opts: {
  intro?: string | null
  introAr?: string | null
  introHe?: string | null
  tenantName: string
  item: { id?: string; name: string; sku?: string | null; price: number; qty: number; description?: string | null }
  currency?: string
  lang?: Lang
  tenantSlug?: string
  baseUrl?: string
  orderId?: string
  orderNumber?: string
}): string {
  const { intro, introAr, introHe, tenantName, item, currency = 'ILS', lang = 'en', tenantSlug, baseUrl, orderId, orderNumber } = opts
  const sym = currency === 'ILS' ? '₪' : `${currency} `
  const lineTotal = item.qty * item.price
  const t = (key: string) => translate(lang, key, '', { tenantName })

  // Select the appropriate intro based on language with fallback
  let customIntro: string | null = null
  if (lang === 'ar' && introAr) {
    customIntro = introAr
  } else if (lang === 'he' && introHe) {
    customIntro = introHe
  } else if (intro) {
    customIntro = intro
  }

  const lines: string[] = []
  // Use custom intro if available, otherwise use translated default
  lines.push(customIntro || t('whatsapp.introSingle'))
  lines.push('')
  lines.push(item.name)
  // Full, clickable link to the product page
  if (item.id) {
    const url = productUrl(baseUrl, item.id)
    if (url) lines.push(url)
  }
  if (item.sku) lines.push(`${t('whatsapp.sku')} ${item.sku}`)
  lines.push(`${t('whatsapp.price')} ${sym}${item.price.toLocaleString()} ${translate(lang, 'cart.each')}`)
  lines.push(`${t('whatsapp.quantity')} ${item.qty}`)
  lines.push(`${t('whatsapp.total')} ${sym}${lineTotal.toLocaleString()}`)
  lines.push('')

  // Add order number if available - with product summary
  if (orderId && orderNumber) {
    lines.push('———')
    lines.push(`${translate(lang, 'whatsapp.orderNumber', '', { orderNumber })}`)
    lines.push(`• ${item.name} (×${item.qty})`)
    lines.push('')
  }

  lines.push(t('whatsapp.sentFrom'))
  return lines.join('\n')
}

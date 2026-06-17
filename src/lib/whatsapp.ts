/**
 * Compose a WhatsApp order message from cart items.
 *
 * The message format is:
 *   <intro line, set by tenant>
 *
 *   1. <Product name>
 *      <sku>
 *      Qty: 2 × $199 = $398
 *
 *   2. <Product name>
 *      ...
 *
 *   ———
 *   Total items: 5
 *   Subtotal: $1,234
 *
 *   Sent from <tenant name> storefront
 */
export function buildWhatsAppMessage(opts: {
  intro?: string | null
  tenantName: string
  items: Array<{ name: string; sku?: string | null; price: number; qty: number }>
  currency?: string
}): string {
  const { intro, tenantName, items, currency = 'USD' } = opts
  const sym = currency === 'USD' ? '$' : `${currency} `

  const lines: string[] = []
  lines.push(intro?.trim() || `Hello ${tenantName}! I would like to order the following items:`)
  lines.push('')
  items.forEach((it, i) => {
    const lineTotal = it.qty * it.price
    lines.push(`${i + 1}. ${it.name}`)
    if (it.sku) lines.push(`   SKU: ${it.sku}`)
    lines.push(`   Qty: ${it.qty} × ${sym}${it.price.toLocaleString()} = ${sym}${lineTotal.toLocaleString()}`)
    lines.push('')
  })
  const totalItems = items.reduce((s, i) => s + i.qty, 0)
  const subtotal = items.reduce((s, i) => s + i.qty * i.price, 0)
  lines.push('———')
  lines.push(`Total items: ${totalItems}`)
  lines.push(`Subtotal: ${sym}${subtotal.toLocaleString()}`)
  lines.push('')
  lines.push(`Sent from ${tenantName} storefront`)
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
  items: Array<{ name: string; sku?: string | null; price: number; qty: number }>
  currency?: string
  sendCount: number
}): string {
  const { items, currency = 'USD', sendCount } = opts
  const sym = currency === 'USD' ? '$' : `${currency} `

  const lines: string[] = []
  lines.push(`Follow-up #${sendCount} — additional items for the same order:`)
  lines.push('')
  items.forEach((it, i) => {
    const lineTotal = it.qty * it.price
    lines.push(`${i + 1}. ${it.name}`)
    if (it.sku) lines.push(`   SKU: ${it.sku}`)
    lines.push(`   Qty: ${it.qty} × ${sym}${it.price.toLocaleString()} = ${sym}${lineTotal.toLocaleString()}`)
    lines.push('')
  })
  const subtotal = items.reduce((s, i) => s + i.qty * i.price, 0)
  lines.push(`Subtotal of these items: ${sym}${subtotal.toLocaleString()}`)
  return lines.join('\n')
}

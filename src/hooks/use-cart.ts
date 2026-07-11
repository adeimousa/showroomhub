'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export type CartItem = {
  id: string
  name: string
  // Hebrew product name — order messages are always sent in Hebrew.
  // Falls back to `name` when not provided.
  nameHe?: string | null
  price: number
  image: string | null
  sku: string | null
  qty: number
}

type CartState = {
  items: CartItem[]
  isOpen: boolean
  // tenantKey keeps each tenant's cart isolated in localStorage
  // (so visiting a different storefront doesn't mix carts)
  tenantKey: string | null
  open: () => void
  close: () => void
  toggle: () => void
  initForTenant: (slug: string) => void
  add: (item: Omit<CartItem, 'qty'>, qty?: number) => void
  remove: (id: string) => void
  setQty: (id: string, qty: number) => void
  increment: (id: string) => void
  decrement: (id: string) => void
  clear: () => void
  totalItems: () => number
  subtotal: () => number
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      tenantKey: null,

      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
      toggle: () => set((s) => ({ isOpen: !s.isOpen })),

      // Called when a storefront mounts with a specific slug.
      // If switching to a different tenant, clear and re-init.
      initForTenant: (slug) => {
        const current = get().tenantKey
        if (current !== slug) {
          set({ tenantKey: slug, items: [], isOpen: false })
        }
      },

      add: (item, qty = 1) => {
        const items = get().items.slice()
        const idx = items.findIndex((i) => i.id === item.id)
        if (idx >= 0) {
          items[idx] = { ...items[idx], qty: items[idx].qty + qty }
        } else {
          items.push({ ...item, qty })
        }
        set({ items, isOpen: true })
      },

      remove: (id) => {
        set({ items: get().items.filter((i) => i.id !== id) })
      },

      setQty: (id, qty) => {
        if (qty <= 0) {
          set({ items: get().items.filter((i) => i.id !== id) })
          return
        }
        set({
          items: get().items.map((i) => (i.id === id ? { ...i, qty } : i)),
        })
      },

      increment: (id) => {
        set({
          items: get().items.map((i) => (i.id === id ? { ...i, qty: i.qty + 1 } : i)),
        })
      },

      decrement: (id) => {
        const existing = get().items.find((i) => i.id === id)
        if (!existing) return
        if (existing.qty <= 1) {
          set({ items: get().items.filter((i) => i.id !== id) })
        } else {
          set({
            items: get().items.map((i) => (i.id === id ? { ...i, qty: i.qty - 1 } : i)),
          })
        }
      },

      clear: () => set({ items: [] }),

      totalItems: () => get().items.reduce((sum, i) => sum + i.qty, 0),
      subtotal: () => get().items.reduce((sum, i) => sum + i.qty * i.price, 0),
    }),
    {
      name: 'showroomhub.cart',
      storage: createJSONStorage(() => (typeof window !== 'undefined' ? localStorage : (undefined as any))),
      // Only persist items + tenantKey, not the open/close state
      partialize: (s) => ({ items: s.items, tenantKey: s.tenantKey }) as CartState,
    }
  )
)

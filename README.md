# 🛋️ ShowroomHub

**Multi-tenant furniture SaaS platform** — spin up branded storefronts in minutes. 30 unique layouts, 3 languages (EN/AR/HE with RTL), WhatsApp-based ordering, per-tenant theme customization.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fyour-username%2Fshowroomhub&env=DATABASE_URL,NEXTAUTH_SECRET,NEXTAUTH_URL&envDescription=Database%20connection%20string%2C%20auth%20secret%2C%20and%20public%20URL&project-name=showroomhub&repository-name=showroomhub)

> **Note:** Clicking the button above will fork the repo to your GitHub and start a Vercel deploy. You'll need to push the repo to GitHub first (see [DEPLOY.md](./DEPLOY.md)).

---

## ✨ Features

- **30 storefront layouts** across 5 categories (Modern / Luxury / Minimal / Creative / Classic)
- **3 languages** with full RTL support — English, Arabic, Hebrew
- **Multi-language admin input** — enter product/category/slide names in all 3 languages at once, with English fallback
- **WhatsApp ordering** — customers send their cart (or a single product) directly to the store's WhatsApp number
- **Per-tenant themes** — colors, fonts, RTL toggle, custom WhatsApp intro
- **Super admin dashboard** — manage tenants, layouts, payments (pause/resume/suspend)
- **Client admin dashboard** — products, categories, hero slides, theme, contact info
- **Full-page product details** with shareable URLs (`/?view=product&slug=…&productId=…`)
- **Live search + category filtering** on the storefront
- **Cart with follow-up messages** — send multiple WhatsApp messages to the same conversation

## 🎮 Demo credentials

| Role | Email | Password |
|------|-------|----------|
| Super Admin | `admin@platform.com` | `admin123` |
| Demo Furniture | `admin@demofurniture.com` | `demo123` |
| Heritage Oak (Arabic RTL) | `admin@heritageoak.com` | `heritage123` |

## 🚀 Quick start (local dev)

```bash
# Install dependencies
bun install

# Set up the database
bun run db:push
bun run scripts/seed.ts

# Start the dev server
bun run dev
```

Visit http://localhost:3000 and login with the demo credentials above.

## 📦 Deployment

See **[DEPLOY.md](./DEPLOY.md)** for step-by-step instructions for:

- **Vercel** (serverless, requires Postgres) — easiest path
- **Railway** (Docker, SQLite works) — single-instance
- **VPS with Docker Compose** — full control, custom domain + HTTPS via Caddy

Quick Docker Compose:
```bash
cp .env.example .env
# Edit .env (set NEXTAUTH_SECRET, NEXTAUTH_URL)
docker compose up -d --build
```

## 🏗️ Tech stack

- **Framework:** Next.js 16 (App Router, standalone output)
- **Language:** TypeScript 5
- **Database:** Prisma ORM (SQLite for dev, Postgres for production)
- **Auth:** NextAuth.js v4 (credentials provider)
- **UI:** Tailwind CSS 4 + shadcn/ui (New York)
- **State:** Zustand (cart) + TanStack Query (server state)
- **i18n:** Custom dictionary with `{n}` interpolation + RTL support

## 📁 Project structure

```
prisma/
  schema.prisma              # SQLite schema (default)
  schema.postgres.prisma     # Postgres variant (for Vercel)
scripts/
  seed.ts                    # 30 layouts + 3 demo tenants + products
src/
  app/
    api/                     # REST endpoints (tenants, products, layouts, etc.)
    page.tsx                 # Single-page router: login → dashboard → storefront → product page
  components/
    super-admin/             # 4 tabs: Overview, Tenants, Layouts, Payments
    client-admin/            # 5 tabs: Products, Categories, Hero Slides, Theme, Contact
    storefront/              # StorefrontRenderer (30 layouts) + CartDrawer + ProductPage
    admin/multi-language-input.tsx
  lib/
    i18n.ts                  # EN/AR/HE dictionaries
    whatsapp.ts              # Message builders (cart / single-item / follow-up)
    loc.ts                   # Localized field helper with English fallback
  hooks/
    use-i18n.ts              # Language switcher (useSyncExternalStore)
    use-cart.ts              # Zustand cart store with localStorage persistence
Dockerfile                   # Multi-stage production build
docker-compose.yml           # One-command deploy with persistent volume
DEPLOY.md                    # Vercel / Railway / VPS instructions
```

## 🌐 Public URLs

| URL | Purpose |
|-----|---------|
| `/?view=site&slug=demo-furniture` | Public storefront (anyone with the slug) |
| `/?view=product&slug=demo-furniture&productId=…` | Public product page (shareable) |
| `/` (when logged in) | Dashboard (super admin or client admin depending on role) |

## 📝 License

MIT — use this for your own furniture SaaS, customize freely.

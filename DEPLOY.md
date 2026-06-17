# Deploying ShowroomHub (White-Label Mode)

This guide covers deploying ShowroomHub in **white-label mode**: each tenant gets their own custom domain, customers never see "ShowroomHub" branding, and the super admin lives on a separate stealth domain.

## Architecture

```
velvetnight.com          ──┐
heritage-oak.com         ──┼──→  myapp.vercel.app (single deploy)
demo-furniture.com       ──┤    Middleware reads Host header →
showroomhub.com (admin)  ──┘    looks up tenant → renders their storefront
```

- **Tenant domains** (`velvetnight.com`): public storefront + `/admin` for tenant admin
- **Admin domain** (`showroomhub.com`): super admin login + `/root-adminstration` dashboard
- **Unknown domains**: generic "not configured" page (no branding)

---

## 🚀 Vercel Deployment (recommended)

### Step 1: Push to GitHub
```bash
cd showroomhub
git init && git add . && git commit -m "ShowroomHub white-label"
git remote add origin https://github.com/<you>/showroomhub.git
git push -u origin main
```

### Step 2: Set up Postgres (Vercel needs it — filesystem is read-only)
- Go to https://neon.tech → create free project → copy connection string
- (Or use Vercel Postgres: https://vercel.com/postgres)

### Step 3: Swap Prisma schema to Postgres
```bash
cp prisma/schema.postgres.prisma prisma/schema.prisma
git commit -am "Switch to Postgres" && git push
```

### Step 4: Deploy on Vercel
- Go to https://vercel.com/new → import your GitHub repo
- Add these **Environment Variables**:

| Name | Value |
|------|-------|
| `DATABASE_URL` | `postgresql://user:pass@host/db?sslmode=require` |
| `NEXTAUTH_SECRET` | Run `openssl rand -base64 32` locally |
| `NEXTAUTH_URL` | `https://your-project.vercel.app` (update after first deploy) |
| `ADMIN_DOMAIN` | `showroomhub.com` (or whatever domain you'll use for super admin) |

- Click **Deploy**

### Step 5: Initialize database
```bash
npm i -g vercel
vercel link
vercel env pull .env.production
bun run db:push
bun run scripts/seed.ts
```

### Step 6: Add your super admin domain
1. Buy a domain (e.g. `showroomhub.com` or a stealthy one like `admin.yourname.com`)
2. In Vercel dashboard → your project → **Settings → Domains** → add the domain
3. At your DNS provider, add the CNAME record Vercel shows you
4. Update `NEXTAUTH_URL` env var to `https://showroomhub.com`
5. Update `ADMIN_DOMAIN` env var to `showroomhub.com` (if different from step 4)
6. Redeploy

### Step 7: Add tenant custom domains
For each tenant:
1. **Super admin**: go to `showroomhub.com` → Tenants → edit tenant → add their domain(s) in the "Custom domains" field (one per line)
2. **Vercel dashboard**: Settings → Domains → add the tenant's domain (e.g. `velvetnight.com`)
3. **Tenant**: at their DNS provider, add the CNAME record Vercel shows them
4. Wait for DNS propagation (5 min – 24 hrs)
5. Visit `velvetnight.com` → their storefront loads

---

## 🖥️ VPS / Railway Deployment (Docker)

Same as before, but set these env vars:
```bash
DATABASE_URL=file:/app/db/custom.db  # SQLite works on VPS
NEXTAUTH_SECRET=<openssl rand -base64 32>
NEXTAUTH_URL=https://showroomhub.com
ADMIN_DOMAIN=showroomhub.com
```

For custom domains, use the included Caddyfile (auto-HTTPS):
```
velvetnight.com {
  reverse_proxy localhost:3000
}
heritage-oak.com {
  reverse_proxy localhost:3000
}
showroomhub.com {
  reverse_proxy localhost:3000
}
```

---

## 🔧 How white-label routing works

1. **Middleware** (`src/middleware.ts`) runs on every request
2. Reads the `Host` header (or `?host=` for dev testing)
3. Calls `/api/resolve-host` to look up which tenant owns that host
4. Sets `x-tenant-id` header for downstream pages
5. Routes:
   - `showroomhub.com` → super admin login
   - `showroomhub.com/root-adminstration` → super admin dashboard
   - `showroomhub.com/admin` → redirects to `/root-adminstration`
   - `velvetnight.com` → Velvet Night storefront (public)
   - `velvetnight.com/product/<id>` → product page (public)
   - `velvetnight.com/admin` → Velvet Night admin login
   - `unknown.com` → "not configured" page

### Cross-tenant security
- A Velvet Night admin CANNOT log in at `heritage-oak.com/admin`
- The login page checks the user's `tenantId` against the host's tenant
- Mismatch → "Access denied" page

### Dev testing (no real domains needed)
```bash
# Test any tenant's storefront:
open "http://localhost:3000/?host=velvetnight.com"

# Test tenant admin:
open "http://localhost:3000/admin?host=heritage-oak.com"

# Test super admin:
open "http://localhost:3000/?host=showroomhub.com"

# Test unknown domain:
open "http://localhost:3000/?host=unknown.com"
```

---

## 🔐 Post-deploy checklist

1. Visit `showroomhub.com` → super admin login works
2. Visit `showroomhub.com/root-adminstration` → dashboard loads
3. Visit a tenant domain → storefront renders with that tenant's layout + products
4. Visit `tenant-domain/admin` → branded login (shows tenant name, NOT "ShowroomHub")
5. Try cross-tenant login → should be rejected
6. Visit an unmapped domain → "not configured" page (no branding)
7. Change all demo passwords (`admin123`, `demo123`, `heritage123`)

---

## 🛠️ Managing custom domains

### Adding a new tenant domain
1. Super admin → Tenants → edit tenant → "Custom domains" field → enter `newtenant.com` (one per line)
2. Vercel dashboard → Settings → Domains → add `newtenant.com`
3. Tenant adds CNAME at their DNS: `newtenant.com → cname.vercel-dns.com`
4. Wait for DNS propagation
5. Visit `newtenant.com` → storefront loads

### Removing a domain
1. Super admin → Tenants → edit → remove domain from the field
2. Vercel dashboard → Settings → Domains → remove the domain
3. (Optional) Tell the tenant to remove their CNAME record

### What happens if DNS isn't configured?
If a tenant adds a domain in the super admin but doesn't configure DNS:
- The domain won't resolve to your Vercel → visitor sees their registrar's default page
- No impact on other tenants

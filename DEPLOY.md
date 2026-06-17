# Deploying ShowroomHub

This guide covers 3 deployment paths. Pick the one that matches your needs:

| Host | Difficulty | Cost | Best for |
|------|-----------|------|----------|
| **Vercel** | Easy | Free tier | Serverless, auto-HTTPS, custom domains |
| **Railway** | Easy | $5/mo | Single-instance, Docker, no DB swap needed |
| **VPS (Docker)** | Medium | $5/mo | Full control, custom domain, lowest cost at scale |

All three give you a real URL like `https://showroomhub.com` — no `preview-*` subdomain.

---

## 🚀 Option 1: Vercel (recommended)

Vercel is the easiest path because Vercel is built by the Next.js team. **Caveat: Vercel is serverless, so the filesystem is read-only — you must use Postgres instead of SQLite.**

### Step 1: Push to GitHub
```bash
cd /home/z/my-project
git init
git add .
git commit -m "ShowroomHub ready for production"
git branch -M main
git remote add origin https://github.com/<your-username>/showroomhub.git
git push -u origin main
```

### Step 2: Create a free Postgres database
- Go to https://neon.tech → sign up → create a project → copy the connection string
- (Alternative: https://vercel.com/postgres — built into Vercel dashboard)

### Step 3: Swap the Prisma schema to Postgres
```bash
# In your local repo (before pushing, or via GitHub web editor):
cp prisma/schema.postgres.prisma prisma/schema.prisma
git commit -am "Switch to Postgres for Vercel"
git push
```

### Step 4: Deploy on Vercel
- Go to https://vercel.com/new
- Import your GitHub repo
- Vercel auto-detects Next.js — keep the default build settings
- Add these **Environment Variables** in the Vercel UI:

| Name | Value |
|------|-------|
| `DATABASE_URL` | `postgresql://user:pass@host/db?sslmode=require` (from step 2) |
| `NEXTAUTH_SECRET` | Run `openssl rand -base64 32` locally and paste the output |
| `NEXTAUTH_URL` | `https://your-project.vercel.app` (set this after first deploy — Vercel gives you the URL) |

- Click **Deploy** — Vercel builds + deploys in ~2 minutes

### Step 5: Initialize the database
After the first deploy, you need to create the tables + seed demo data:
```bash
# Install Vercel CLI
npm i -g vercel
# Link to your project
vercel link
# Pull the env vars locally
vercel env pull .env.production
# Push the schema to your Postgres DB
bun run db:push
# Seed demo data
bun run scripts/seed.ts
```

### Step 6: Add a custom domain (optional)
- Vercel dashboard → your project → Settings → Domains → add `showroomhub.com`
- At your DNS provider, add a CNAME record: `showroomhub.com → cname.vercel-dns.com`
- Update `NEXTAUTH_URL` env var to `https://showroomhub.com`
- Redeploy

---

## 🚂 Option 2: Railway

Railway runs Docker containers in a single instance, so **SQLite works fine — no DB swap needed.**

### Step 1: Push to GitHub
(Same as Vercel step 1)

### Step 2: Deploy on Railway
- Go to https://railway.app/new
- Connect your GitHub account → select the `showroomhub` repo
- Railway auto-detects the Dockerfile
- In **Variables**, add:

| Name | Value |
|------|-------|
| `NEXTAUTH_SECRET` | Run `openssl rand -base64 32` and paste |
| `NEXTAUTH_URL` | `https://showroomhub.up.railway.app` (set after first deploy) |

- Railway auto-deploys
- The Dockerfile runs `prisma db push` on startup, so tables are created automatically
- **Note:** The SQLite DB lives in the container's `/app/db` directory. To persist it across deploys, add a Railway Volume mounted at `/app/db`.

### Step 3: Seed demo data (one-time)
```bash
# Railway CLI
npm i -g @railway/cli
railway link
railway run bun run scripts/seed.ts
```

### Step 4: Custom domain (optional)
- Railway dashboard → your project → Settings → Networking → add custom domain
- Add the CNAME record at your DNS provider
- Update `NEXTAUTH_URL`

---

## 🖥️ Option 3: VPS with Docker Compose

Best for full control. Works on DigitalOcean / Hetzner / Linode / Vultr / your own server.

### Step 1: Spin up a VPS
- DigitalOcean droplet / Hetzner CX21 / etc.
- Ubuntu 22.04 LTS, 1GB+ RAM
- SSH in as root

### Step 2: Install Docker
```bash
ssh root@your-server-ip
apt update && apt upgrade -y
curl -fsSL https://get.docker.com | sh
```

### Step 3: Clone the repo
```bash
git clone https://github.com/<your-username>/showroomhub.git
cd showroomhub
```

### Step 4: Configure environment
```bash
cp .env.example .env
# Edit .env:
nano .env
```

Set:
- `NEXTAUTH_SECRET` — generate with `openssl rand -base64 32`
- `NEXTAUTH_URL` — `http://your-server-ip:3000` (or your domain if you've set up DNS)
- `DATABASE_URL` — leave as `file:/app/db/custom.db` for SQLite

### Step 5: Start the app
```bash
docker compose up -d --build
# Wait ~30 seconds for first build
docker compose logs -f  # watch the logs
```

Visit `http://your-server-ip:3000` — your site is live.

### Step 6: Seed demo data (one-time)
```bash
docker compose exec showroomhub npx prisma db push
docker compose exec showroomhub node -e "
  const { PrismaClient } = require('@prisma/client');
  require('./scripts/seed.ts');
"
# (If the seed script doesn't run inside the container, run it locally
#  against the same DATABASE_URL — for SQLite you'd copy the db file in.)
```

### Step 7: Add a domain + HTTPS with Caddy
The repo already includes a `Caddyfile` template. To use it for production:

```bash
# Edit Caddyfile — replace :81 with your domain
cat > Caddyfile <<EOF
showroomhub.com {
  reverse_proxy localhost:3000
}
EOF

# Start Caddy (handles Let's Encrypt SSL automatically)
docker run -d --name caddy \
  --restart unless-stopped \
  -p 80:80 -p 443:443 \
  -v $PWD/Caddyfile:/etc/caddy/Caddyfile \
  -v caddy_data:/data \
  caddy:latest

# Update .env NEXTAUTH_URL to https://showroomhub.com
# Restart the app
docker compose up -d
```

---

## 🔧 Post-deploy checklist

After deploying to any host, verify:

1. **Login works** — visit the site, login with `admin@platform.com / admin123`
2. **Storefront renders** — click "View live site" on a tenant
3. **WhatsApp checkout works** — set a real WhatsApp number in Contact tab, add to cart, click "Send order via WhatsApp"
4. **Multi-language works** — switch to Arabic, verify RTL + Arabic product names show
5. **Change all demo passwords** — login as each demo user via the admin UI and update their passwords/emails. Demo credentials are publicly visible in the source code!

## 🗑️ Removing demo data (for production)

If you don't want the demo tenants visible to real customers:

```bash
# After deploy, run this against your production DB:
# (Vercel: `vercel env pull && bun run scripts/cleanup-demo.ts`)
# (Docker: `docker compose exec showroomhub node scripts/cleanup-demo.js`)
```

You'll need to write `scripts/cleanup-demo.ts` yourself — it should delete the 3 demo tenants (Demo Furniture, Heritage Oak, Velvet Night) but keep the layouts + super admin user.

## 🔐 Security notes for production

- ✅ `NEXTAUTH_SECRET` is set to a random 32-byte value (not the placeholder)
- ✅ `NEXTAUTH_URL` matches your real domain (prevents redirect loops)
- ⚠️ Demo credentials (`admin123`, `demo123`, `heritage123`) are in the source code — change them immediately after deploy
- ⚠️ The `/api/site?slug=…` endpoint is public (no auth) so storefronts load fast — this is intentional, but it means anyone with a slug can view that tenant's products
- ⚠️ Consider rate-limiting on `/api/auth/callback/credentials` if you expect abuse

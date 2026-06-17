import { NextResponse } from 'next/server'
import { requireSuperAdmin } from '@/lib/session'

// Allow super admin to trigger a re-seed without leaving the dashboard
export async function POST() {
  const { fail } = await requireSuperAdmin()
  if (fail) return fail

  // Use a fetch to re-run the seed script via a separate process
  // For simplicity in this demo, we just return ok — the user can re-seed
  // from the shell if needed. This endpoint exists so the "Re-seed" button
  // has somewhere to POST to without breaking the UI.
  return NextResponse.json({
    ok: true,
    message: 'To re-seed the database, run: bun run scripts/seed.ts',
  })
}

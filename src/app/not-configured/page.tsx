/**
 * Generic "Domain not configured" page.
 *
 * Shown when someone points a domain at the Vercel deployment but no
 * tenant has claimed that domain in the database.
 *
 * This page is intentionally generic — NO mention of "ShowroomHub",
 * no links to the admin domain, no contact info. This keeps the
 * white-label stealthy: visitors can't figure out what platform
 * powers this site.
 */
export default function NotConfiguredPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-4">🌐</div>
        <h1 className="text-xl font-bold mb-2 text-slate-900">
          This website is not configured
        </h1>
        <p className="text-sm text-slate-500">
          The domain you're visiting hasn't been set up yet.
          Please check back later.
        </p>
      </div>
    </div>
  )
}

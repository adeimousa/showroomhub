/**
 * Generic "Domain not configured" page.
 * See /app/not-configured/page.tsx for the full implementation.
 * This is a re-export for use from other server components.
 */
export function NotConfigured() {
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

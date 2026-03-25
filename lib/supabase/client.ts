import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  // createBrowserClient already manages a singleton internally —
  // no need for manual singleton caching which can cause stale closures.
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        flowType: 'pkce',
        autoRefreshToken: true,
        detectSessionInUrl: true,
        persistSession: true,
        // Disable navigator.locks — they can deadlock in dev mode or
        // when the page is reopened after the lock was never released.
        // The proxy already validates tokens server-side on every request.
        lock: async <R>(name: string, acquireTimeout: number, fn: () => Promise<R>) => {
          return await fn();
        },
      },
    },
  )
}

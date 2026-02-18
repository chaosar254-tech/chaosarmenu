import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://kenrjnphvocixvbbvwvy.supabase.co";
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_XmtDASp8l0cdNY-neWiLhQ_SpCsuTxX";

/**
 * Cookie domain for cross-subdomain auth.
 * Production: '.chaosarmenu.com' so session is shared across
 * chaosarmenu.com, dashboard.chaosarmenu.com, admin.chaosarmenu.com.
 * Development: undefined so cookies work on localhost.
 */
function getCookieDomain(): string | undefined {
  if (typeof window === "undefined") return undefined;
  const hostname = window.location.hostname;
  if (hostname === "localhost" || hostname === "127.0.0.1") return undefined;
  if (hostname === "chaosarmenu.com" || hostname.endsWith(".chaosarmenu.com")) {
    return ".chaosarmenu.com";
  }
  return undefined;
}

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey, {
  cookieOptions: {
    domain: getCookieDomain(),
    path: "/",
    sameSite: "lax",
    secure: typeof window !== "undefined" && window.location?.protocol === "https:",
  },
});

// Preview-safe Supabase auth client.
// The Lovable preview iframe injects a fetch proxy that can break Supabase auth
// POST requests with "Failed to fetch". This client uses a native fetch bound
// to window, bypassing the proxy, and is intended ONLY for auth calls
// (signup, login, password reset). For database/storage queries keep using
// the standard `supabase` client from "./client".

import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

// Capture the native fetch before any proxy wraps it.
const nativeFetch: typeof fetch =
  typeof window !== "undefined" && (window as any).fetch
    ? (window as any).fetch.bind(window)
    : fetch;

const safeFetch: typeof fetch = async (input, init) => {
  try {
    return await nativeFetch(input, init);
  } catch (err) {
    // Fallback: retry with the global fetch in case the bound reference is stale.
    return await fetch(input as any, init);
  }
};

export const supabaseAuth = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      storage: localStorage,
      persistSession: true,
      autoRefreshToken: true,
      storageKey: "sb-" + SUPABASE_URL.split("//")[1].split(".")[0] + "-auth-token",
    },
    global: {
      fetch: safeFetch,
    },
  }
);

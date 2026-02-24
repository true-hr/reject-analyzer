import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        // ✅ ensure session is persisted in browser storage
        persistSession: true,
        // ✅ auto refresh access token when needed
        autoRefreshToken: true,
        // ✅ capture session from OAuth redirect URL
        detectSessionInUrl: true,
        // ✅ recommended for OAuth in SPAs
        flowType: "pkce",
        // ✅ explicit storage key helps debugging and avoids ambiguity
        storageKey: "sb-truehr-reject-analyzer-auth",
    },
});
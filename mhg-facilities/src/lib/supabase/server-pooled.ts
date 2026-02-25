import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

// Pooled client for DAO layer - uses service role for server-side operations
// This bypasses RLS, so ALL tenant filtering MUST be done in DAO layer
let pooledClient: ReturnType<typeof createClient<Database>> | null = null;

export async function getPooledSupabaseClient() {
  if (!pooledClient) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error(
        "Missing Supabase environment variables for pooled client",
      );
    }

    pooledClient = createClient<Database>(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      db: {
        schema: "public",
      },
    });
  }

  return pooledClient;
}

import { createClient } from "@supabase/supabase-js";

let _client: ReturnType<typeof createClient> | null = null;

export function getSupabaseAdmin() {
  if (!_client) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_KEY;
    if (!url || !key) throw new Error("SUPABASE_URL y SUPABASE_SERVICE_KEY son requeridos");
    _client = createClient(url, key, { auth: { persistSession: false } });
  }
  return _client;
}

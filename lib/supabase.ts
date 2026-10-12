import { createClient, SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

/** Клиент с service role: использовать только на сервере. */
export function admin(): SupabaseClient {
  if (!client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) throw new Error("Не заданы NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY");
    client = createClient(url, key, { auth: { persistSession: false } });
  }
  return client;
}

export const BUCKET = "photos";

export type RecordRow = {
  id: string;
  cert_no: string;
  created_at: string;
  client_time: string | null;
  client_tz: string | null;
  lat: number | null;
  lng: number | null;
  accuracy_m: number | null;
  sha256: string;
  file_path: string;
  place_name: string | null;
  device: string | null;
  project_name: string | null;
  author_name: string | null;
  description: string | null;
  user_agent: string | null;
  status: "valid" | "revoked";
};

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  "https://ywjpxotwovyqeayfpvtz.supabase.co";

const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl3anB4b3R3b3Z5cWVheWZwdnR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYyOTY4MzcsImV4cCI6MjEwMTg3MjgzN30.cqcynfJ9-mCNsyOB626BvTk40_oMaDEK01rbDzNw6ZY";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Save user checkout lead to Supabase (table: leads or subscriptions)
 */
export async function saveLeadEmail(email: string, plan: string = "lifetime_29") {
  try {
    const { data, error } = await supabase.from("leads").insert([
      {
        email,
        plan,
        created_at: new Date().toISOString(),
      },
    ]);

    if (error) {
      // Fallback if table doesn't exist yet, try RPC or log
      console.warn("Supabase lead insertion note:", error.message);
    }
    return { data, error };
  } catch (err) {
    console.warn("Supabase lead error:", err);
    return { data: null, error: err };
  }
}

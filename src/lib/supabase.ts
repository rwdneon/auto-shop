import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

// Temporary debug - will show in the browser console
if (typeof window !== "undefined") {
  console.log("Supabase URL loaded:", supabaseUrl ? "YES" : "NO");
  console.log("Supabase Key loaded:", supabaseAnonKey ? "YES" : "NO");
  console.log("URL starts with http:", supabaseUrl.startsWith("http"));
}

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  !supabaseUrl.includes("your-project") &&
  supabaseUrl.startsWith("http")
);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : (null as any);
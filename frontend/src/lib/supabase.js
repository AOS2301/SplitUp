import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error(
    "Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no frontend/.env",
  );
}

// A sessão fica no localStorage e o supabase-js renova o token sozinho.
export const supabase = createClient(url, anonKey);

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error("Defina SUPABASE_URL e SUPABASE_ANON_KEY no backend/.env");
}

const OPCOES_SEM_SESSAO = {
  auth: { persistSession: false, autoRefreshToken: false },
};

// Client sem usuário, usado só para validar tokens no guard.
export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  OPCOES_SEM_SESSAO,
);

// Client no contexto de um usuário: as queries passam pelas policies de RLS
// como se fossem feitas pelo próprio dono do token.
export function supabaseComToken(accessToken) {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    ...OPCOES_SEM_SESSAO,
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });
}

import { supabase, supabaseComToken } from "../lib/supabase.js";

export async function authGuard(req, res, next) {
  const authHeader = req.headers.authorization;

  // 1. Existe token?
  if (!authHeader) {
    return res.status(401).json({ error: "Token não fornecido" });
  }

  // 2. Extrai o token
  const [esquema, token] = authHeader.split(" ");

  if (esquema !== "Bearer" || !token) {
    return res.status(401).json({ error: "Token mal formatado" });
  }

  // 3. Valida o token no Supabase
  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data?.user) {
    return res.status(401).json({ error: "Token inválido ou expirado" });
  }

  // 4. Injeta o usuário e um client já escopado nele (respeita RLS)
  req.user = data.user;
  req.supabase = supabaseComToken(token);

  // 5. Libera acesso
  next();
}

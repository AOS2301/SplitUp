import jwt from "jsonwebtoken";

export function authGuard(req, res, next) {
  const authHeader = req.headers.authorization;

  // 1. Existe token?
  if (!authHeader) {
    return res.status(401).json({ error: "Token não fornecido" });
  }

  // 2. Extrai o token
  const [, token] = authHeader.split(" ");

  try {
    // 3. Valida token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 4. Injeta usuário na request
    req.user = decoded;

    // 5. Libera acesso
    next();
  } catch {
    return res.status(401).json({ error: "Token inválido ou expirado" });
  }
}
export class AuthController {
  // Login e cadastro são feitos direto no Supabase pelo frontend
  // (supabase.auth.signInWithPassword / signUp). Aqui só devolvemos o
  // perfil do dono do token, já validado pelo authGuard.
  static async me(req, res) {
    const { data, error } = await req.supabase
      .from("profiles")
      .select("id, nome, chave_pix_padrao")
      .eq("id", req.user.id)
      .single();

    if (error) {
      return res.status(500).json({ message: error.message });
    }

    return res.json({
      user: { ...data, email: req.user.email },
    });
  }
}

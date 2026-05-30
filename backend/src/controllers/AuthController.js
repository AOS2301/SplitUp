import { AuthService } from "../services/AuthService.js";

export class AuthController {
  static async login(req, res) {
    try {
      const { email, senha } = req.body;

      const resultado = await AuthService.login(email, senha);

      return res.status(200).json(resultado);
    } catch (error) {
      return res.status(401).json({
        message: error.message,
      });
    }
  }

  static async me(req, res) {
      return res.json({
        user: req.user
      });
  }
}
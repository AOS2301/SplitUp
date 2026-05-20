import { ReadService } from "../services/ReadService.js";
 
export class ReadController {
  static async readReceipt(req, res) {
    try {
      const itens = await ReadService.readReceipt(req);
      return res.status(200).json({ itens });
    } catch (error) {
      return res.status(500).json({ message: error.message || "Erro ao ler recibo." });
    }
  }
}
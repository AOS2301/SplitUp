import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic();

const PROMPT = `Você é um extrator de dados de recibos de restaurante.
Analise o documento e extraia todos os itens consumidos.
Responda APENAS com JSON puro, sem markdown nem texto extra.
Formato: {"itens":[{"nome":"Nome do item","quantidade":1,"preco":12.50}]}
- quantidade: inteiro (padrão 1 se não informado)
- preco: valor unitário em reais (float)
Sem comentários, sem campos extras.`;

export class ReadService {
  static async readReceipt(req) {
    const file = req.file;

    if (!file) throw new Error("Arquivo não enviado.");

    const base64    = file.buffer.toString("base64");
    const isPdf     = file.mimetype === "application/pdf";
    const mediaType = isPdf ? "application/pdf" : (file.mimetype || "image/jpeg");

    const conteudo = isPdf
      ? [
          { type: "document", source: { type: "base64", media_type: mediaType, data: base64 } },
          { type: "text", text: PROMPT },
        ]
      : [
          { type: "image", source: { type: "base64", media_type: mediaType, data: base64 } },
          { type: "text", text: PROMPT },
        ];

    const msg = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      messages: [{ role: "user", content: conteudo }],
    });

    const texto  = msg.content.map((b) => b.text ?? "").join("");
    const limpo  = texto.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(limpo);

    return parsed.itens ?? [];
  }
}
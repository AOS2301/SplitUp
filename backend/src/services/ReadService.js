import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

const PROMPT = `
Você é um extrator de dados de recibos de restaurante.
Analise o documento e extraia todos os itens consumidos.
Responda APENAS com JSON puro, sem markdown nem texto extra.
Formato:
  {
    "itens": [
      { "nome": "Nome do item", "quantidade": 1, "preco": 12.50 }
    ]
  }
- nome: string
- quantidade: inteiro
- preco: valor unitário em reais
`;

export class ReadService {
  static async readReceipt(req) {
    const file = req.file;
    
    if (!file) throw new Error("Arquivo não enviado. (Dentro do service)");

    const base64 = file.buffer.toString("base64");

    const response = await client.chat.completions.create({
      model: "meta-llama/llama-4-scout-17b-16e-instruct",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: PROMPT },
            {
              type: "image_url",
              image_url: { url: `data:${file.mimetype};base64,${base64}` },
            },
          ],
        },
      ],
      temperature: 0,
    });

    const texto = response.choices[0].message.content;
    const limpo = texto.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(limpo);

    return parsed.itens ?? [];
  }
}
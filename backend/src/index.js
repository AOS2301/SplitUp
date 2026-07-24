import "dotenv/config";

import express from "express";
import cors from "cors";
import healthRoutes from "./routes/healthCheck.routes.js";
import readRoutes from "./routes/read.routes.js";
import authRoutes from "./routes/auth.routes.js";


const app = express();

app.use(cors({
  origin: "http://localhost:5173",
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  credentials: true
}));

app.use(express.json());

// Rotas
app.use("/api", healthRoutes);
app.use("/read", readRoutes);
app.use("/auth", authRoutes);

// Rota de teste
app.get("/api", (req, res) => {
  res.json({ mensagem: "API Node funcionando 🚀" });
});

// Servidor
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
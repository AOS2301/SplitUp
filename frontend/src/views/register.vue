<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import "../assets/css/auth.css";

const nome = ref("");
const email = ref("");
const senha = ref("");
const confirmarSenha = ref("");
const errorMsg = ref("");
const successMsg = ref("");
const loading = ref(false);
const router = useRouter();
const API_URL = import.meta.env.VITE_API_URL;

addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    register();
  }
});

async function register() {
  errorMsg.value = "";
  successMsg.value = "";

  if (!nome.value || !email.value || !senha.value || !confirmarSenha.value) {
    errorMsg.value = "Preencha todos os campos";
    return;
  }

  if (senha.value !== confirmarSenha.value) {
    errorMsg.value = "As senhas não coincidem";
    confirmarSenha.value = "";
    return;
  }

  if (senha.value.length < 6) {
    errorMsg.value = "A senha deve ter pelo menos 6 caracteres";
    return;
  }

  loading.value = true;

  try {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        nome: nome.value,
        email: email.value,
        senha: senha.value,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      errorMsg.value = data.message || "Erro ao criar conta";
      return;
    }

    successMsg.value = "Conta criada com sucesso!";
    setTimeout(() => {
      router.push("/login");
    }, 1500);
  } catch (error) {
    errorMsg.value = error.message || "Erro ao criar conta";
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="auth-page">
    <div class="auth-box">
      <div class="auth-inner">

        <div class="auth-header">
          <div class="auth-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <line x1="19" y1="8" x2="19" y2="14"/>
              <line x1="22" y1="11" x2="16" y2="11"/>
            </svg>
          </div>
          <h1>Criar <span>conta</span></h1>
          <p>Preencha os dados para se cadastrar</p>
        </div>

        <div class="auth-fields">
          <div class="auth-field">
            <label for="nome">Nome completo</label>
            <input
              id="nome"
              type="text"
              placeholder="Seu nome"
              v-model="nome"
            />
          </div>

          <div class="auth-field">
            <label for="email">E-mail</label>
            <input
              id="email"
              type="email"
              placeholder="seu@email.com"
              v-model="email"
            />
          </div>

          <div class="auth-field">
            <label for="senha">Senha</label>
            <input
              id="senha"
              type="password"
              placeholder="Mínimo 6 caracteres"
              v-model="senha"
            />
          </div>

          <div class="auth-field">
            <label for="confirmarSenha">Confirmar senha</label>
            <input
              id="confirmarSenha"
              type="password"
              placeholder="••••••••"
              v-model="confirmarSenha"
            />
          </div>
        </div>

        <button class="auth-btn" @click="register" :disabled="loading">
          <span class="auth-spinner" v-if="loading"></span>
          <span>{{ loading ? 'Criando conta...' : 'Criar conta' }}</span>
        </button>

        <div class="auth-divider"></div>

        <p class="auth-footer">
          Já tem uma conta?
          <router-link to="/login">Fazer login</router-link>
        </p>

        <div v-if="errorMsg" class="auth-error">
          <svg viewBox="0 0 24 24" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          {{ errorMsg }}
        </div>

        <div v-if="successMsg" class="auth-success">
          <svg viewBox="0 0 24 24" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="9 12 11 14 15 10"/>
          </svg>
          {{ successMsg }}
        </div>

      </div>
    </div>
  </div>
</template>
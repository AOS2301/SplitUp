<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import "../assets/css/auth.css";

const email = ref("");
const senha = ref("");
const errorMsg = ref("");
const router = useRouter();
const loading = ref(false);
const API_URL = import.meta.env.VITE_API_URL;

addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    login();
  }
});

async function login() {
  loading.value = true;
  errorMsg.value = "";
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: email.value,
        senha: senha.value,
      }),
    });
    const data = await response.json();
    if (!response.ok) {
      errorMsg.value = "Credenciais inválidas";
      email.value = "";
      senha.value = "";
      return;
    }
    localStorage.setItem("token", data.token);
    localStorage.setItem("nome", data.user.nome);
  } catch (error) {
    errorMsg.value = error.message || "Erro ao fazer login";
    statusMsg.value = "";
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
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
              <polyline points="10 17 15 12 10 7"/>
              <line x1="15" y1="12" x2="3" y2="12"/>
            </svg>
          </div>
          <h1>Bem-vindo <span>de volta</span></h1>
          <p>Faça login para continuar</p>
        </div>

        <div class="auth-fields">
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
              placeholder="••••••••"
              v-model="senha"
            />
          </div>
        </div>

        <button class="auth-btn" @click="login" :disabled="loading">
          <span class="auth-spinner" v-if="loading"></span>
          <span>{{ loading ? 'Entrando...' : 'Entrar' }}</span>
        </button>

        <div class="auth-divider"></div>

        <p class="auth-footer">
          Não tem conta?
          <router-link to="/register">Criar conta</router-link>
        </p>

        <div v-if="errorMsg" class="auth-error">
          <svg viewBox="0 0 24 24" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          {{ errorMsg }}
        </div>

      </div>
    </div>
  </div>
</template>
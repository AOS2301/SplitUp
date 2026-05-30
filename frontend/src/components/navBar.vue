<script setup>
import { ref } from 'vue'
import "../assets/css/navBar.css";

const menuAberto = ref(false)
const logado = ref(false)

function toggleMenu() {
  menuAberto.value = !menuAberto.value
}

function login() {
  logado.value = true
}

function logout() {
  logado.value = false
  menuAberto.value = false
}
</script>
<template>
  <div class="app-wrapper">
    <header class="navbar">
      <div class="navbar-inner">
        <span class="logo">
          Split<strong>AI</strong>
        </span>

        <div class="nav-right">

          <button
            v-if="!logado"
            class="login-btn"
            @click="login"
          >
            Entrar
          </button>

          <div
            v-else
            class="user-menu"
          >
            <button
              class="avatar-btn"
              @click="toggleMenu"
            >
              PH/AS
            </button>

            <div
              v-if="menuAberto"
              class="dropdown"
            >
              <button>Perfil</button>
              <button>Histórico</button>
              <button>Sistema</button>

              <div class="divider"></div>

              <button @click="logout">
                Sair
              </button>
            </div>
          </div>

        </div>
      </div>
    </header>

    <RouterView />
  </div>
</template>
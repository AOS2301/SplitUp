<script setup>
import { ref } from 'vue'

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
              PH
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

<style scoped>
.app-wrapper {
  min-height: 100vh;
  background: #0f1117;
}

.navbar {
  position: sticky;
  top: 0;
  z-index: 50;

  background: rgba(15,17,23,.7);

  backdrop-filter: blur(18px);

  border-bottom: 1px solid rgba(255,255,255,.06);

  padding: 0 1.5rem;

  height: 56px;

  display: flex;
  align-items: center;
}

.logo {
  font-size: 1.6rem;
  letter-spacing: -.04em;
  color: #f3f4f6;
}

.logo strong {
  color: #8b5cf6;
}

.navbar-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;

  width: 100%;
}

.nav-right {
  position: relative;
}

.login-btn {
  height: 40px;

  padding: 0 1rem;

  border: none;

  border-radius: 12px;

  background:
    linear-gradient(
      135deg,
      #8b5cf6,
      #7c3aed
    );

  color: white;

  font-weight: 600;

  cursor: pointer;

  transition: .2s;
}

.login-btn:hover {
  transform: translateY(-1px);
}

.avatar-btn {
  width: 42px;
  height: 42px;

  border-radius: 50%;

  border: 1px solid rgba(255,255,255,.08);

  background: rgba(255,255,255,.04);

  color: white;

  font-weight: 700;

  cursor: pointer;

  transition: .2s;
}

.avatar-btn:hover {
  background: rgba(255,255,255,.08);
}

.dropdown {
  position: absolute;

  top: 52px;
  right: 0;

  width: 180px;

  background: rgba(24,28,37,.95);

  backdrop-filter: blur(18px);

  border: 1px solid rgba(255,255,255,.08);

  border-radius: 18px;

  padding: .5rem;

  box-shadow:
    0 20px 40px rgba(0,0,0,.45);

  display: flex;
  flex-direction: column;

  gap: .25rem;
}

.dropdown button {
  height: 40px;

  border: none;

  background: transparent;

  color: #f3f4f6;

  border-radius: 10px;

  text-align: left;

  padding: 0 .75rem;

  cursor: pointer;

  transition: .15s;
}

.dropdown button:hover {
  background: rgba(255,255,255,.05);
}

.divider {
  height: 1px;

  background: rgba(255,255,255,.08);

  margin: .25rem 0;
}
</style>
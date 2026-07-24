<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '../lib/supabase'
import "../assets/css/navBar.css";

const router = useRouter()
const menuAberto = ref(false)
const usuario = ref(null)

const logado = computed(() => usuario.value !== null)

const nome = computed(() =>
  usuario.value?.user_metadata?.nome || usuario.value?.email || ''
)

// "Pedro Henrique" -> "PH"; "pedro@email.com" -> "PE"
const iniciais = computed(() => {
  const partes = nome.value.trim().split(/\s+/).filter(Boolean)
  if (!partes.length) return '?'
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase()
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase()
})

let assinatura = null

onMounted(async () => {
  const { data } = await supabase.auth.getSession()
  usuario.value = data.session?.user ?? null

  // Mantém a navbar em sincronia com login/logout/refresh de token.
  const { data: listener } = supabase.auth.onAuthStateChange((_evento, sessao) => {
    usuario.value = sessao?.user ?? null
  })
  assinatura = listener.subscription
})

onUnmounted(() => assinatura?.unsubscribe())

function toggleMenu() {
  menuAberto.value = !menuAberto.value
}

function login() {
  router.push('/login')
}

async function logout() {
  menuAberto.value = false
  await supabase.auth.signOut()
  router.push('/login')
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
              :title="nome"
              @click="toggleMenu"
            >
              {{ iniciais }}
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
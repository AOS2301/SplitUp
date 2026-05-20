<script setup>
import { ref, reactive, computed } from 'vue'
import '../assets/css/home.css'

// ── Estado ───────────────────────────────────────────────────
const etapa        = ref('upload')   // 'upload' | 'itens' | 'resumo'
const lendo        = ref(false)
const erro         = ref('')
const fileInput    = ref(null)
const arquivo      = ref(null)        // File object

const pessoas      = ref(['Você'])
const pessoaAtiva  = ref('Você')
const gorjetaPct   = ref(10)
const itens        = ref([])
const atribuicoes  = reactive({})    // { itemIdx: { nomePessoa: true } }

// ── Paleta de cores ──────────────────────────────────────────
const CORES = [
  { bg: '#EAF3DE', txt: '#27500A', border: '#3B6D11' },
  { bg: '#E6F1FB', txt: '#0C447C', border: '#185FA5' },
  { bg: '#FAECE7', txt: '#712B13', border: '#993C1D' },
  { bg: '#FBEAF0', txt: '#72243E', border: '#993556' },
  { bg: '#E1F5EE', txt: '#085041', border: '#0F6E56' },
  { bg: '#EEEDFE', txt: '#3C3489', border: '#534AB7' },
  { bg: '#FAEEDA', txt: '#633806', border: '#854F0B' },
]
const corPessoa  = (nome, tipo = 'border') => CORES[pessoas.value.indexOf(nome) % CORES.length][tipo]
const badgeStyle = nome => ({ background: corPessoa(nome, 'bg'), color: corPessoa(nome, 'txt') })

// ── Upload ───────────────────────────────────────────────────
const onFile = e => {
  arquivo.value = e.target.files[0] ?? null
  erro.value = ''
}

const limpar = () => {
  arquivo.value = null
  erro.value = ''
  if (fileInput.value) fileInput.value.value = ''
}

// ── Chamada ao backend ───────────────────────────────────────
async function lerRecibo() {
  if (!arquivo.value) return
  lendo.value = true
  erro.value  = ''

  try {
    const form = new FormData()
    form.append('arquivo', arquivo.value)

    const res = await fetch('/read/receipt',
      {
        method: 'POST'
        , body: form
      }
    )
    const data = await res.json()

    if (!res.ok) throw new Error(data.erro || 'Erro desconhecido')

    itens.value = data.itens ?? []
    itens.value.forEach((_, i) => { atribuicoes[i] = {} })
    etapa.value = 'itens'
  } catch (e) {
    erro.value = e.message || 'Não foi possível ler o recibo.'
  } finally {
    lendo.value = false
  }
}

// ── Lógica de itens ──────────────────────────────────────────
const toggleItem = idx => {
  if (!atribuicoes[idx]) atribuicoes[idx] = {}
  atribuicoes[idx][pessoaAtiva.value]
    ? delete atribuicoes[idx][pessoaAtiva.value]
    : (atribuicoes[idx][pessoaAtiva.value] = true)
}

const adicionarPessoa = () => {
  const n = prompt('Nome da pessoa:')?.trim()
  if (!n || pessoas.value.includes(n)) return
  pessoas.value.push(n)
  pessoaAtiva.value = n
}

// ── Cálculos ─────────────────────────────────────────────────
const subtotal = computed(() =>
  itens.value.reduce((s, it) => s + it.preco * it.quantidade, 0))

const gorjeta = computed(() => subtotal.value * gorjetaPct.value / 100)
const total   = computed(() => subtotal.value + gorjeta.value)

const naoAtribuido = computed(() =>
  itens.value
    .filter((_, i) => !Object.keys(atribuicoes[i] ?? {}).length)
    .reduce((s, it) => s + it.preco * it.quantidade, 0))

const totaisPorPessoa = computed(() => {
  const baseTotal = pessoas.value.reduce((acc, p) => {
    itens.value.forEach((it, i) => {
      const who = Object.keys(atribuicoes[i] ?? {})
      if (who.includes(p)) acc += (it.preco * it.quantidade) / who.length
    })
    return acc
  }, 0)

  return pessoas.value.map(p => {
    let base = 0
    itens.value.forEach((it, i) => {
      const who = Object.keys(atribuicoes[i] ?? {})
      if (who.includes(p)) base += (it.preco * it.quantidade) / who.length
    })
    const gorjeiraP = baseTotal > 0
      ? (base / baseTotal) * gorjeta.value
      : gorjeta.value / pessoas.value.length
    return { nome: p, total: base + gorjeiraP }
  })
})

// ── Reset ────────────────────────────────────────────────────
function novaImportacao() {
  limpar()
  itens.value = []
  Object.keys(atribuicoes).forEach(k => delete atribuicoes[k])
  pessoas.value    = ['Você']
  pessoaAtiva.value = 'Você'
  gorjetaPct.value  = 10
  etapa.value       = 'upload'
}
</script>

<template>
  <div class="home-container">
    <main class="content">
      <header class="header">
        <h2>Dividir <span>Conta</span></h2>
        <p>Envie o recibo do restaurante para dividir automaticamente entre as pessoas</p>
      </header>

      <section class="cards">

        <!-- ── Upload ── -->
        <div v-if="etapa === 'upload'" class="card" style="max-width:580px;margin:0 auto">
          <div class="card-header"><strong>📄</strong> Recibo do restaurante</div>
          <div class="card-body" style="padding:1.5rem">

            <div
              class="upload-zone"
              :class="{ 'upload-zone--filled': arquivo }"
              @click="fileInput.click()"
            >
              <input ref="fileInput" type="file" accept=".pdf,.jpg,.jpeg,.png" style="display:none" @change="onFile" />

              <div v-if="!arquivo" class="upload-placeholder">
                <span class="upload-icon">📂</span>
                <p class="upload-title">Clique para selecionar o arquivo</p>
                <p class="upload-sub">PDF ou imagem do recibo</p>
              </div>

              <div v-else class="upload-selected">
                <span class="upload-icon">✅</span>
                <p class="upload-filename">{{ arquivo.name }}</p>
                <p class="upload-sub">Arquivo pronto para leitura</p>
              </div>
            </div>

            <div v-if="lendo" class="status-bar status-loading">
              <span class="spinner-inline"></span>
              <span>Lendo o recibo com IA…</span>
            </div>

            <div v-if="erro" class="status-bar status-error">✕ {{ erro }}</div>

            <div class="modal-actions" style="margin-top:1rem">
              <button v-if="arquivo" class="btn-secondary" :disabled="lendo" @click="limpar">Limpar</button>
              <button class="btn-primary" :disabled="!arquivo || lendo" @click="lerRecibo">
                {{ lendo ? 'Processando…' : 'Ler recibo' }}
              </button>
            </div>
          </div>
        </div>

        <!-- ── Seleção de itens ── -->
        <div v-if="etapa === 'itens'" class="card" style="max-width:580px;margin:0 auto">
          <div class="card-header"><strong>👥</strong> Quem está na mesa?</div>
          <div class="card-body" style="padding:1.5rem">

            <div class="person-tabs">
              <button
                v-for="p in pessoas" :key="p"
                class="tab" :class="{ 'tab--active': p === pessoaAtiva }"
                @click="pessoaAtiva = p"
              >{{ p }}</button>
              <button class="tab tab--add" @click="adicionarPessoa">+ Pessoa</button>
            </div>

            <p style="font-size:0.85rem;color:#888;margin-bottom:1rem">
              Selecione uma pessoa e marque os itens que ela consumiu.
            </p>

            <div class="gorjeta-row">
              <label>Gorjeta</label>
              <input type="range" v-model.number="gorjetaPct" min="0" max="20" step="1" />
              <span>{{ gorjetaPct }}%</span>
            </div>

            <div class="items-list">
              <div v-for="(item, idx) in itens" :key="idx" class="item-row" @click="toggleItem(idx)">
                <div class="item-check" :class="{ 'item-check--checked': atribuicoes[idx]?.[pessoaAtiva] }">
                  <span v-if="atribuicoes[idx]?.[pessoaAtiva]">✓</span>
                </div>
                <div class="item-info">
                  <span class="item-nome">{{ item.nome }}</span>
                  <div class="item-badges">
                    <span
                      v-for="p in Object.keys(atribuicoes[idx] ?? {})" :key="p"
                      class="badge" :style="badgeStyle(p)"
                    >{{ p }}</span>
                  </div>
                </div>
                <span class="item-qty">{{ item.quantidade > 1 ? `×${item.quantidade}` : '' }}</span>
                <span class="item-preco">R$ {{ (item.preco * item.quantidade).toFixed(2) }}</span>
              </div>
            </div>

            <div class="modal-actions" style="margin-top:1.5rem">
              <button class="btn-secondary" @click="etapa = 'upload'">Voltar</button>
              <button class="btn-primary"   @click="etapa = 'resumo'">Ver resumo</button>
            </div>
          </div>
        </div>

        <!-- ── Resumo ── -->
        <div v-if="etapa === 'resumo'" class="card" style="max-width:580px;margin:0 auto">
          <div class="card-header"><strong>💰</strong> Resumo da conta</div>
          <div class="card-body" style="padding:1.5rem">

            <div class="summary-grid">
              <div class="metric-card">
                <span class="metric-label">Subtotal</span>
                <span class="metric-value">R$ {{ subtotal.toFixed(2) }}</span>
              </div>
              <div class="metric-card">
                <span class="metric-label">Gorjeta ({{ gorjetaPct }}%)</span>
                <span class="metric-value">R$ {{ gorjeta.toFixed(2) }}</span>
              </div>
              <div class="metric-card">
                <span class="metric-label">Total</span>
                <span class="metric-value">R$ {{ total.toFixed(2) }}</span>
              </div>
              <div v-if="naoAtribuido > 0" class="metric-card metric-card--danger">
                <span class="metric-label">Não atribuído</span>
                <span class="metric-value">R$ {{ naoAtribuido.toFixed(2) }}</span>
              </div>
            </div>

            <div class="person-totals">
              <div v-for="pt in totaisPorPessoa" :key="pt.nome" class="person-total-row">
                <div class="person-total-name">
                  <span class="person-dot" :style="{ background: corPessoa(pt.nome) }"></span>
                  {{ pt.nome }}
                </div>
                <span class="person-total-value">R$ {{ pt.total.toFixed(2) }}</span>
              </div>
            </div>

            <div class="modal-actions" style="margin-top:1.5rem">
              <button class="btn-secondary" @click="etapa = 'itens'">Voltar</button>
              <button class="btn-primary"   @click="novaImportacao">Nova conta</button>
            </div>
          </div>
        </div>

      </section>
    </main>
  </div>
</template>
<script setup>
import { ref, reactive, computed } from 'vue'

// ── Estado ──────────────────────────────────────────────────
const etapa = ref('upload')        // 'upload' | 'itens' | 'resumo'
const fileInput = ref(null)
const arquivoSelecionado = ref(false)
const nomeArquivo = ref('')
const lendo = ref(false)
const erro = ref('')
const fileObj = ref(null)

const pessoas = ref(['Você'])
const pessoaAtiva = ref('Você')
const gorjetaPct = ref(10)
const itens = ref([])
const atribuicoes = reactive({})   // { itemIdx: { nomePessoa: true } }

// ── Paleta de cores por pessoa ───────────────────────────────
const CORES = [
  { bg: '#EAF3DE', txt: '#27500A', border: '#3B6D11' },
  { bg: '#E6F1FB', txt: '#0C447C', border: '#185FA5' },
  { bg: '#FAECE7', txt: '#712B13', border: '#993C1D' },
  { bg: '#FBEAF0', txt: '#72243E', border: '#993556' },
  { bg: '#E1F5EE', txt: '#085041', border: '#0F6E56' },
  { bg: '#EEEDFE', txt: '#3C3489', border: '#534AB7' },
  { bg: '#FAEEDA', txt: '#633806', border: '#854F0B' },
]

function corPessoa(nome, tipo = 'border') {
  const idx = pessoas.value.indexOf(nome) % CORES.length
  return CORES[idx][tipo]
}

function badgeStyle(nome) {
  return {
    background: corPessoa(nome, 'bg'),
    color: corPessoa(nome, 'txt'),
  }
}

// ── Upload / leitura ─────────────────────────────────────────
function onFileInput(e) {
  const file = e.target.files[0]
  if (!file) return
  fileObj.value = file
  nomeArquivo.value = file.name
  arquivoSelecionado.value = true
  erro.value = ''
}

function limpar() {
  fileObj.value = null
  arquivoSelecionado.value = false
  nomeArquivo.value = ''
  erro.value = ''
  if (fileInput.value) fileInput.value.value = ''
}

async function lerRecibo() {
  if (!fileObj.value) return
  lendo.value = true
  erro.value = ''

  try {
    const base64 = await toBase64(fileObj.value)
    const isPdf = fileObj.value.type === 'application/pdf'
    const mediaType = isPdf ? 'application/pdf' : (fileObj.value.type || 'image/jpeg')

    const conteudo = isPdf
      ? [
          { type: 'document', source: { type: 'base64', media_type: mediaType, data: base64 } },
          { type: 'text', text: PROMPT },
        ]
      : [
          { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64 } },
          { type: 'text', text: PROMPT },
        ]

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [{ role: 'user', content: conteudo }],
      }),
    })

    const data = await res.json()
    const texto = (data.content || []).map(b => b.text || '').join('')
    const limpo = texto.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(limpo)

    itens.value = parsed.itens || []
    itens.value.forEach((_, i) => { atribuicoes[i] = {} })

    etapa.value = 'itens'
  } catch (e) {
    erro.value = 'Não foi possível ler o recibo. Tente outro arquivo.'
  } finally {
    lendo.value = false
  }
}

const PROMPT = `Você é um extrator de dados de recibos de restaurante. Analise o documento e extraia todos os itens.
Responda APENAS com JSON puro, sem markdown, sem texto antes ou depois.
Formato:
{"itens":[{"nome":"Nome do item","quantidade":1,"preco":12.50}]}
Se não houver quantidade, use 1. Preço é o valor unitário em reais (float). Sem comentários.`

function toBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result.split(',')[1])
    reader.onerror = () => reject(new Error('Falha na leitura'))
    reader.readAsDataURL(file)
  })
}

// ── Lógica de itens ──────────────────────────────────────────
function toggleItem(idx) {
  if (!atribuicoes[idx]) atribuicoes[idx] = {}
  if (atribuicoes[idx][pessoaAtiva.value]) {
    delete atribuicoes[idx][pessoaAtiva.value]
  } else {
    atribuicoes[idx][pessoaAtiva.value] = true
  }
}

function adicionarPessoa() {
  const nome = prompt('Nome da pessoa:')
  if (!nome || !nome.trim()) return
  const n = nome.trim()
  if (pessoas.value.includes(n)) return
  pessoas.value.push(n)
  pessoaAtiva.value = n
}

// ── Cálculos ─────────────────────────────────────────────────
const subtotal = computed(() =>
  itens.value.reduce((s, it) => s + it.preco * it.quantidade, 0)
)

const gorjeta = computed(() => subtotal.value * gorjetaPct.value / 100)

const total = computed(() => subtotal.value + gorjeta.value)

const naoAtribuido = computed(() =>
  itens.value
    .filter((_, i) => !Object.keys(atribuicoes[i] || {}).length)
    .reduce((s, it) => s + it.preco * it.quantidade, 0)
)

const totaisPorPessoa = computed(() => {
  const baseAtribuido = pessoas.value.reduce((s, p) => {
    let soma = 0
    itens.value.forEach((it, i) => {
      const who = Object.keys(atribuicoes[i] || {})
      if (who.includes(p)) soma += (it.preco * it.quantidade) / who.length
    })
    return s + soma
  }, 0)

  return pessoas.value.map(p => {
    let base = 0
    itens.value.forEach((it, i) => {
      const who = Object.keys(atribuicoes[i] || {})
      if (who.includes(p)) base += (it.preco * it.quantidade) / who.length
    })
    const gorjeiraP = baseAtribuido > 0
      ? (base / baseAtribuido) * gorjeta.value
      : gorjeta.value / pessoas.value.length
    return { nome: p, total: base + gorjeiraP }
  })
})

// ── Reset ────────────────────────────────────────────────────
function novaImportacao() {
  limpar()
  itens.value = []
  Object.keys(atribuicoes).forEach(k => delete atribuicoes[k])
  pessoas.value = ['Você']
  pessoaAtiva.value = 'Você'
  gorjetaPct.value = 10
  etapa.value = 'upload'
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
        <div v-if="etapa === 'upload'" class="card" style="max-width: 580px; margin: 0 auto;">
          <div class="card-header">
            <strong>📄</strong> Recibo do restaurante
          </div>
          <div class="card-body" style="padding: 1.5rem;">

            <div
              class="upload-zone"
              :class="{ 'upload-zone--filled': arquivoSelecionado }"
              @click="$refs.fileInput.click()"
            >
              <input ref="fileInput" type="file" accept=".pdf,.jpg,.jpeg,.png" style="display:none" @change="onFileInput" />

              <div v-if="!arquivoSelecionado" class="upload-placeholder">
                <span class="upload-icon">📂</span>
                <p class="upload-title">Clique para selecionar o arquivo</p>
                <p class="upload-sub">PDF ou imagem do recibo</p>
              </div>

              <div v-else class="upload-selected">
                <span class="upload-icon">✅</span>
                <p class="upload-filename">{{ nomeArquivo }}</p>
                <p class="upload-sub">Arquivo pronto para leitura</p>
              </div>
            </div>

            <div v-if="lendo" class="status-bar status-loading">
              <span class="spinner-inline"></span>
              <span>Lendo o recibo com IA…</span>
            </div>

            <div v-if="erro" class="status-bar status-error">
              ✕ {{ erro }}
            </div>

            <div class="modal-actions" style="margin-top: 1rem;">
              <button v-if="arquivoSelecionado" class="btn-secondary" @click="limpar" :disabled="lendo">
                Limpar
              </button>
              <button class="btn-primary" @click="lerRecibo" :disabled="!arquivoSelecionado || lendo">
                {{ lendo ? 'Processando…' : 'Ler recibo' }}
              </button>
            </div>
          </div>
        </div>

        <!-- ── Seleção de itens ── -->
        <div v-if="etapa === 'itens'" class="card" style="max-width: 580px; margin: 0 auto;">
          <div class="card-header">
            <strong>👥</strong> Quem está na mesa?
          </div>
          <div class="card-body" style="padding: 1.5rem;">

            <!-- Abas de pessoas -->
            <div class="person-tabs">
              <button
                v-for="p in pessoas"
                :key="p"
                class="tab"
                :class="{ 'tab--active': p === pessoaAtiva }"
                @click="pessoaAtiva = p"
              >
                {{ p }}
              </button>
              <button class="tab tab--add" @click="adicionarPessoa">+ Pessoa</button>
            </div>

            <p style="font-size: 0.85rem; color: #888; margin-bottom: 1rem;">
              Selecione uma pessoa e marque os itens que ela consumiu.
            </p>

            <!-- Gorjeta -->
            <div class="gorjeta-row">
              <label>Gorjeta</label>
              <input type="range" v-model.number="gorjetaPct" min="0" max="20" step="1" />
              <span>{{ gorjetaPct }}%</span>
            </div>

            <!-- Lista de itens -->
            <div class="items-list">
              <div
                v-for="(item, idx) in itens"
                :key="idx"
                class="item-row"
                @click="toggleItem(idx)"
              >
                <div class="item-check" :class="{ 'item-check--checked': atribuicoes[idx]?.[pessoaAtiva] }">
                  <span v-if="atribuicoes[idx]?.[pessoaAtiva]">✓</span>
                </div>
                <div class="item-info">
                  <span class="item-nome">{{ item.nome }}</span>
                  <div class="item-badges">
                    <span
                      v-for="p in Object.keys(atribuicoes[idx] || {})"
                      :key="p"
                      class="badge"
                      :style="badgeStyle(p)"
                    >{{ p }}</span>
                  </div>
                </div>
                <span class="item-qty">{{ item.quantidade > 1 ? `×${item.quantidade}` : '' }}</span>
                <span class="item-preco">R$ {{ (item.preco * item.quantidade).toFixed(2) }}</span>
              </div>
            </div>

            <div class="modal-actions" style="margin-top: 1.5rem;">
              <button class="btn-secondary" @click="etapa = 'upload'">Voltar</button>
              <button class="btn-primary" @click="etapa = 'resumo'">Ver resumo</button>
            </div>
          </div>
        </div>

        <!-- ── Resumo ── -->
        <div v-if="etapa === 'resumo'" class="card" style="max-width: 580px; margin: 0 auto;">
          <div class="card-header">
            <strong>💰</strong> Resumo da conta
          </div>
          <div class="card-body" style="padding: 1.5rem;">

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

            <div class="modal-actions" style="margin-top: 1.5rem;">
              <button class="btn-secondary" @click="etapa = 'itens'">Voltar</button>
              <button class="btn-primary" @click="novaImportacao">Nova conta</button>
            </div>
          </div>
        </div>

      </section>
    </main>
  </div>
</template>
<style scoped>
/* ── Layout base (reutiliza o estilo do seu projeto) ── */
.home-container { display: flex; justify-content: center; padding: 2rem 1rem; }
.content { width: 100%; max-width: 640px; }

.header { margin-bottom: 2rem; }
.header h2 { font-size: 1.75rem; font-weight: 700; margin-bottom: .25rem; }
.header h2 span { color: var(--color-primary, #3B6D11); }
.header p { color: #888; font-size: 0.9rem; }

/* ── Card ── */
.card { border-radius: 12px; border: 1px solid #e5e7eb; background: #fff; overflow: hidden; }
.card-header {
  padding: .75rem 1.25rem;
  border-bottom: 1px solid #e5e7eb;
  font-size: .875rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: .5rem;
  background: #fafafa;
}

/* ── Upload zone ── */
.upload-zone {
  border: 2px dashed #d1d5db;
  border-radius: 10px;
  padding: 2.5rem 1rem;
  text-align: center;
  cursor: pointer;
  transition: border-color .2s, background .2s;
}
.upload-zone:hover { border-color: #9ca3af; background: #f9fafb; }
.upload-zone--filled { border-style: solid; border-color: #6b7280; }

.upload-icon { font-size: 2rem; display: block; margin-bottom: .5rem; }
.upload-title { font-size: .95rem; font-weight: 600; margin-bottom: .25rem; }
.upload-filename { font-size: .9rem; font-weight: 600; margin-bottom: .25rem; color: #374151; }
.upload-sub { font-size: .8rem; color: #9ca3af; }

/* ── Status ── */
.status-bar {
  display: flex;
  align-items: center;
  gap: .5rem;
  padding: .5rem .75rem;
  border-radius: 8px;
  font-size: .85rem;
  margin-top: .75rem;
}
.status-loading { background: #eff6ff; color: #1d4ed8; }
.status-error { background: #fef2f2; color: #b91c1c; }

.spinner-inline {
  width: 14px;
  height: 14px;
  border: 2px solid currentColor;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin .7s linear infinite;
  flex-shrink: 0;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ── Botões ── */
.modal-actions { display: flex; gap: .75rem; justify-content: flex-end; }
.btn-primary {
  padding: .5rem 1.25rem;
  border-radius: 8px;
  font-size: .875rem;
  font-weight: 600;
  border: none;
  background: #1f2937;
  color: #fff;
  cursor: pointer;
  transition: opacity .15s;
}
.btn-primary:hover { opacity: .85; }
.btn-primary:disabled { opacity: .4; cursor: not-allowed; }
.btn-secondary {
  padding: .5rem 1.25rem;
  border-radius: 8px;
  font-size: .875rem;
  font-weight: 600;
  border: 1px solid #d1d5db;
  background: transparent;
  cursor: pointer;
  transition: background .15s;
}
.btn-secondary:hover { background: #f3f4f6; }
.btn-secondary:disabled { opacity: .4; cursor: not-allowed; }

/* ── Abas de pessoas ── */
.person-tabs { display: flex; flex-wrap: wrap; gap: .5rem; margin-bottom: 1rem; }
.tab {
  padding: .35rem 1rem;
  border-radius: 50px;
  border: 1px solid #d1d5db;
  background: transparent;
  font-size: .8rem;
  cursor: pointer;
  color: #6b7280;
  transition: all .15s;
}
.tab:hover { border-color: #9ca3af; color: #374151; }
.tab--active { background: #1f2937; color: #fff; border-color: #1f2937; }
.tab--add { border-style: dashed; color: #9ca3af; }
.tab--add:hover { border-style: solid; color: #374151; }

/* ── Gorjeta ── */
.gorjeta-row {
  display: flex;
  align-items: center;
  gap: .75rem;
  margin-bottom: 1.25rem;
}
.gorjeta-row label { font-size: .85rem; color: #6b7280; white-space: nowrap; }
.gorjeta-row input[type=range] { flex: 1; }
.gorjeta-row span { font-size: .85rem; font-weight: 600; min-width: 32px; }

/* ── Lista de itens ── */
.items-list { border-top: 1px solid #f3f4f6; }
.item-row {
  display: flex;
  align-items: center;
  gap: .75rem;
  padding: .75rem 0;
  border-bottom: 1px solid #f3f4f6;
  cursor: pointer;
  transition: background .1s;
  border-radius: 6px;
}
.item-row:hover { background: #f9fafb; }
.item-check {
  width: 20px;
  height: 20px;
  border-radius: 5px;
  border: 1.5px solid #d1d5db;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: .75rem;
  font-weight: 700;
  transition: all .15s;
}
.item-check--checked { background: #1f2937; border-color: #1f2937; color: #fff; }
.item-info { flex: 1; min-width: 0; }
.item-nome { font-size: .875rem; color: #374151; display: block; }
.item-badges { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 4px; }
.badge { font-size: .7rem; padding: 2px 8px; border-radius: 50px; }
.item-qty { font-size: .75rem; color: #9ca3af; min-width: 28px; text-align: right; }
.item-preco { font-size: .875rem; font-weight: 600; color: #374151; min-width: 80px; text-align: right; }

/* ── Resumo ── */
.summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: .75rem; margin-bottom: 1.25rem; }
.metric-card {
  background: #f9fafb;
  border-radius: 8px;
  padding: .75rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.metric-card--danger { background: #fef2f2; }
.metric-label { font-size: .75rem; color: #6b7280; }
.metric-value { font-size: 1.2rem; font-weight: 700; color: #1f2937; }
.metric-card--danger .metric-value { color: #b91c1c; }

.person-totals { border-top: 1px solid #f3f4f6; padding-top: 1rem; }
.person-total-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: .6rem 0;
  border-bottom: 1px solid #f3f4f6;
  font-size: .875rem;
}
.person-total-row:last-child { border-bottom: none; font-weight: 600; }
.person-total-name { display: flex; align-items: center; gap: .5rem; }
.person-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
.person-total-value { font-weight: 600; color: #1f2937; }
</style>
-- SplitUp - schema inicial (Supabase / Postgres)
-- Fluxo: usuário cria sala + chave pix -> sobe nota (itens) -> compartilha link
-- -> convidados (sem login) entram, escolhem itens -> criador confirma pagamento manualmente.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- profiles: dados de perfil do usuário autenticado (estende auth.users)
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nome text not null,
  chave_pix_padrao text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles: select own" on public.profiles
  for select using (auth.uid() = id);

create policy "profiles: insert own" on public.profiles
  for insert with check (auth.uid() = id);

create policy "profiles: update own" on public.profiles
  for update using (auth.uid() = id);

-- ---------------------------------------------------------------------------
-- salas: cada "sala" criada por um usuário autenticado
-- ---------------------------------------------------------------------------
create table public.salas (
  id uuid primary key default gen_random_uuid(),
  criador_id uuid not null references auth.users (id) on delete cascade,
  nome text,
  chave_pix text not null,
  tipo_chave_pix text check (tipo_chave_pix in ('cpf', 'cnpj', 'email', 'telefone', 'aleatoria')),
  codigo_convite text not null unique,
  status text not null default 'aberta' check (status in ('aberta', 'fechada')),
  created_at timestamptz not null default now()
);

create index salas_criador_id_idx on public.salas (criador_id);

alter table public.salas enable row level security;

-- Convidados acessam a sala pelo codigo_convite (link-capability), por isso
-- o select fica liberado; só o criador pode escrever.
create policy "salas: select all" on public.salas
  for select using (true);

create policy "salas: insert own" on public.salas
  for insert with check (auth.uid() = criador_id);

create policy "salas: update own" on public.salas
  for update using (auth.uid() = criador_id);

create policy "salas: delete own" on public.salas
  for delete using (auth.uid() = criador_id);

-- ---------------------------------------------------------------------------
-- itens: produtos extraídos da nota fiscal (saída do ReadService)
-- ---------------------------------------------------------------------------
create table public.itens (
  id uuid primary key default gen_random_uuid(),
  sala_id uuid not null references public.salas (id) on delete cascade,
  nome text not null,
  quantidade numeric not null,
  valor_unitario numeric(10, 2) not null,
  created_at timestamptz not null default now()
);

create index itens_sala_id_idx on public.itens (sala_id);

alter table public.itens enable row level security;

create policy "itens: select all" on public.itens
  for select using (true);

create policy "itens: insert by dono da sala" on public.itens
  for insert with check (
    auth.uid() = (select criador_id from public.salas where salas.id = itens.sala_id)
  );

create policy "itens: update by dono da sala" on public.itens
  for update using (
    auth.uid() = (select criador_id from public.salas where salas.id = itens.sala_id)
  );

create policy "itens: delete by dono da sala" on public.itens
  for delete using (
    auth.uid() = (select criador_id from public.salas where salas.id = itens.sala_id)
  );

-- ---------------------------------------------------------------------------
-- participantes: convidados que entram pelo link (sem login)
-- ---------------------------------------------------------------------------
create table public.participantes (
  id uuid primary key default gen_random_uuid(),
  sala_id uuid not null references public.salas (id) on delete cascade,
  nome text not null,
  pago boolean not null default false,
  pago_em timestamptz,
  created_at timestamptz not null default now()
);

create index participantes_sala_id_idx on public.participantes (sala_id);

alter table public.participantes enable row level security;

create policy "participantes: select all" on public.participantes
  for select using (true);

create policy "participantes: insert all" on public.participantes
  for insert with check (true);

-- Só o criador da sala marca o convidado como pago.
create policy "participantes: update by dono da sala" on public.participantes
  for update using (
    auth.uid() = (select criador_id from public.salas where salas.id = participantes.sala_id)
  );

-- ---------------------------------------------------------------------------
-- participante_itens: o que cada convidado consumiu (permite dividir 1 item
-- entre várias pessoas via a coluna quantidade)
-- ---------------------------------------------------------------------------
create table public.participante_itens (
  id uuid primary key default gen_random_uuid(),
  participante_id uuid not null references public.participantes (id) on delete cascade,
  item_id uuid not null references public.itens (id) on delete cascade,
  quantidade numeric not null default 1,
  created_at timestamptz not null default now(),
  unique (participante_id, item_id)
);

create index participante_itens_participante_id_idx on public.participante_itens (participante_id);
create index participante_itens_item_id_idx on public.participante_itens (item_id);

alter table public.participante_itens enable row level security;

create policy "participante_itens: select all" on public.participante_itens
  for select using (true);

-- MVP: qualquer pessoa com o link da sala pode registrar/ajustar o que
-- consumiu. Limitação conhecida (sem token por convidado ainda).
create policy "participante_itens: insert all" on public.participante_itens
  for insert with check (true);

create policy "participante_itens: update all" on public.participante_itens
  for update using (true);

create policy "participante_itens: delete all" on public.participante_itens
  for delete using (true);

-- ---------------------------------------------------------------------------
-- participante_totais: total devido por participante (derivado, não guardado)
-- ---------------------------------------------------------------------------
create view public.participante_totais as
select
  pi.participante_id,
  p.sala_id,
  round(sum(pi.quantidade * i.valor_unitario), 2) as total
from public.participante_itens pi
join public.itens i on i.id = pi.item_id
join public.participantes p on p.id = pi.participante_id
group by pi.participante_id, p.sala_id;

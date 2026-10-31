-- DocMeg: Supabase スキーマ（src/lib/types.ts と対応）
create extension if not exists vector;

create table documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade default auth.uid(),
  title text not null,
  authors text[] not null default '{}',
  year int, venue text, doi text, abstract text,
  tags text[] not null default '{}',
  lang text not null default 'en',
  status text not null default 'processing' check (status in ('processing','indexed','error')),
  pages int default 0,
  starred boolean not null default false,
  file_path text,                       -- storage: papers/{user_id}/{id}.pdf
  embedding vector(1024),               -- 文献全体（要約）のベクトル：関連グラフ用
  created_at timestamptz not null default now()
);

create table chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references documents on delete cascade,
  page int, section text, content text not null,
  embedding vector(1024)                -- BAAI/bge-m3
);
create index on chunks using hnsw (embedding vector_cosine_ops);

create table highlights (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references documents on delete cascade,
  chunk_id uuid references chunks on delete cascade,   -- 手動マーカーは null 可
  kind text not null check (kind in ('ai_key','ai_query','user')),
  quote text not null,                                   -- PDF 上の照合に使う原文
  page int,
  reason text,
  created_at timestamptz not null default now()
);

create table document_relations (
  source uuid references documents on delete cascade,
  target uuid references documents on delete cascade,
  kind text not null check (kind in ('cites','similar')),
  weight real not null default 1,
  primary key (source, target, kind)
);

create table factchecks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade default auth.uid(),
  title text, manuscript text not null,
  results jsonb not null default '[]',  -- CitationCheck[]
  created_at timestamptz not null default now()
);

-- RLS: 自分のデータのみ
alter table documents enable row level security;
alter table chunks enable row level security;
alter table highlights enable row level security;
alter table document_relations enable row level security;
alter table factchecks enable row level security;
create policy own on documents for all using (user_id = auth.uid());
create policy own on factchecks for all using (user_id = auth.uid());
create policy own on chunks for all using (exists (select 1 from documents d where d.id = document_id and d.user_id = auth.uid()));
create policy own on highlights for all using (exists (select 1 from documents d where d.id = document_id and d.user_id = auth.uid()));
create policy own on document_relations for all using (exists (select 1 from documents d where d.id = source and d.user_id = auth.uid()));

-- 意味検索（RAG API から呼ぶ）
create or replace function match_chunks(query_embedding vector(1024), match_count int default 20, doc_ids uuid[] default null)
returns table (id uuid, document_id uuid, page int, section text, content text, score float)
language sql stable as $$
  select c.id, c.document_id, c.page, c.section, c.content, 1 - (c.embedding <=> query_embedding) as score
  from chunks c join documents d on d.id = c.document_id
  where d.user_id = auth.uid() and (doc_ids is null or c.document_id = any(doc_ids))
  order by c.embedding <=> query_embedding
  limit match_count;
$$;

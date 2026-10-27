-- Configurações de descontos separadas por loja.
-- Execute no Supabase SQL Editor antes de instalar/testar o front-end.

create table if not exists public.configuracoes_descontos (
    loja_id uuid primary key references public.lojas(id) on delete cascade,
    desconto_maximo_ativo boolean not null default true,
    desconto_avista_ativo boolean not null default true,
    desconto_avista_percentual numeric(5,2) not null default 8.00,
    updated_at timestamptz not null default now(),
    constraint configuracoes_descontos_percentual_check
        check (desconto_avista_percentual >= 0 and desconto_avista_percentual <= 99.99)
);

alter table public.configuracoes_descontos enable row level security;

grant select, insert, update on table public.configuracoes_descontos to authenticated;

-- Admins e vendedores podem apenas ler a configuração da própria loja.
drop policy if exists configuracoes_descontos_select_propria_loja on public.configuracoes_descontos;
create policy configuracoes_descontos_select_propria_loja
on public.configuracoes_descontos
for select
to authenticated
using (
    exists (
        select 1
        from public.perfis p
        where p.id = auth.uid()
          and p.ativo is true
          and p.loja_id = configuracoes_descontos.loja_id
          and p.tipo in ('admin', 'vendedor')
    )
);

-- Somente um administrador ativo da própria loja pode criar sua configuração.
drop policy if exists configuracoes_descontos_insert_admin_propria_loja on public.configuracoes_descontos;
create policy configuracoes_descontos_insert_admin_propria_loja
on public.configuracoes_descontos
for insert
to authenticated
with check (
    exists (
        select 1
        from public.perfis p
        where p.id = auth.uid()
          and p.ativo is true
          and p.tipo = 'admin'
          and p.loja_id = configuracoes_descontos.loja_id
    )
);

-- Somente um administrador ativo da própria loja pode atualizar as regras.
drop policy if exists configuracoes_descontos_update_admin_propria_loja on public.configuracoes_descontos;
create policy configuracoes_descontos_update_admin_propria_loja
on public.configuracoes_descontos
for update
to authenticated
using (
    exists (
        select 1
        from public.perfis p
        where p.id = auth.uid()
          and p.ativo is true
          and p.tipo = 'admin'
          and p.loja_id = configuracoes_descontos.loja_id
    )
)
with check (
    exists (
        select 1
        from public.perfis p
        where p.id = auth.uid()
          and p.ativo is true
          and p.tipo = 'admin'
          and p.loja_id = configuracoes_descontos.loja_id
    )
);

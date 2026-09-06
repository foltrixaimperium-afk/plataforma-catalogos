-- ═══════════════════════════════════════════════════════════════════════
--  ETAPA 7 · Vencimientos y cobros
--  Pegá TODO este archivo en Supabase → SQL Editor → Run.
--  Se puede volver a correr las veces que quieras sin romper nada.
-- ═══════════════════════════════════════════════════════════════════════


-- ─────────────────────────────────────────────────────────────
--  1. TRES DATOS NUEVOS EN CADA TIENDA
--     Van acá y no en una tabla aparte porque son uno por cliente:
--     hasta cuándo tiene pago, cuánto cobra y lo que quieras anotar.
-- ─────────────────────────────────────────────────────────────

alter table public.tiendas add column if not exists vence       date;
alter table public.tiendas add column if not exists cobro_monto numeric(12,2) not null default 0;
alter table public.tiendas add column if not exists cobro_notas text;


-- ─────────────────────────────────────────────────────────────
--  2. LOS PAGOS
--     Una fila por cada vez que cobrás. El historial nunca se pisa:
--     si un cliente te paga doce veces, quedan las doce.
-- ─────────────────────────────────────────────────────────────

create table if not exists public.pagos (
  id        uuid primary key default gen_random_uuid(),
  tienda_id uuid not null references public.tiendas(id) on delete cascade,
  fecha     date not null default current_date,
  monto     numeric(12,2) not null default 0,
  nota      text,
  creado_en timestamptz not null default now()
);

create index if not exists idx_pagos_tienda on public.pagos (tienda_id, fecha desc);


-- ─────────────────────────────────────────────────────────────
--  3. EL CANDADO
--     La plata es cosa tuya y de nadie más: los pagos los ve y los
--     toca solamente el administrador. Ningún cliente, ni el dueño
--     de la tienda, puede leer esta tabla.
-- ─────────────────────────────────────────────────────────────

alter table public.pagos enable row level security;

drop policy if exists "pagos admin" on public.pagos;

create policy "pagos admin" on public.pagos
  for all using (public.es_admin()) with check (public.es_admin());


-- ─────────────────────────────────────────────────────────────
--  4. QUE EL CLIENTE NO SE TOQUE SU PROPIO VENCIMIENTO
--     Es la misma protección que ya tenían el plan y la dirección
--     web: se reescribe entera, agregándole los tres campos nuevos.
-- ─────────────────────────────────────────────────────────────

create or replace function public.proteger_tienda()
returns trigger
language plpgsql security definer set search_path = public
as $fn$
begin
  -- Desde el SQL Editor o el servidor no hay candado.
  if auth.uid() is not null and not public.es_admin() then
    if new.slug        is distinct from old.slug
    or new.plan        is distinct from old.plan
    or new.activa      is distinct from old.activa
    or new.dueno_id    is distinct from old.dueno_id
    or new.vence       is distinct from old.vence
    or new.cobro_monto is distinct from old.cobro_monto
    or new.cobro_notas is distinct from old.cobro_notas then
      raise exception 'Ese dato solo lo puede cambiar el administrador';
    end if;
  end if;
  new.actualizado_en := now();
  return new;
end;
$fn$;

drop trigger if exists al_editar_tienda on public.tiendas;
create trigger al_editar_tienda
  before update on public.tiendas
  for each row execute function public.proteger_tienda();


-- ─────────────────────────────────────────────────────────────
--  Nota: el cliente SÍ puede leer su propio "vence" (la tienda es
--  suya y la lee entera). No es un problema: es la fecha hasta la
--  que pagó, y no la puede cambiar. Lo que no ve nunca es la tabla
--  de pagos.
-- ─────────────────────────────────────────────────────────────

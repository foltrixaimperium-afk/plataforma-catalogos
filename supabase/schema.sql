-- ═══════════════════════════════════════════════════════════════════════
--  PLATAFORMA DE CATÁLOGOS · Estructura de la base de datos
--  Pegá TODO este archivo en Supabase → SQL Editor → Run.
--  Se puede volver a correr las veces que quieras sin romper nada.
-- ═══════════════════════════════════════════════════════════════════════


-- ─────────────────────────────────────────────────────────────
--  1. LAS TABLAS
-- ─────────────────────────────────────────────────────────────

-- Quién es cada usuario. Se crea sola cuando nace una cuenta.
create table if not exists public.perfiles (
  id        uuid primary key references auth.users(id) on delete cascade,
  rol       text not null default 'cliente' check (rol in ('cliente', 'admin')),
  nombre    text,
  creado_en timestamptz not null default now()
);

-- Una fila por cliente. El "slug" es lo que va después de la barra:
-- misitio.com/bazar-aurora  ->  slug = 'bazar-aurora'
create table if not exists public.tiendas (
  id             uuid primary key default gen_random_uuid(),
  dueno_id       uuid not null references auth.users(id) on delete cascade,
  slug           text not null unique,
  nombre         text not null,
  logo_url       text,
  color          text not null default '#1E7CAB',
  whatsapp       text,
  frase          text,
  instagram      text,
  envios         text,
  horario        text,
  moneda         text not null default '$',
  plan           text not null default 'autogestion' check (plan in ('autogestion', 'full')),
  activa         boolean not null default true,
  creado_en      timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),

  -- Solo minúsculas, números y guiones.
  constraint slug_valido check (slug ~ '^[a-z0-9][a-z0-9-]{0,38}[a-z0-9]$'),

  -- Estas direcciones son del sistema: ningún cliente puede quedarse con ellas.
  constraint slug_no_reservado check (
    slug not in ('entrar', 'panel', 'admin', 'api', 'app', 'assets', 'login',
                 'salir', 'static', 'netlify', 'www', 'index', 'ayuda')
  )
);

create table if not exists public.categorias (
  id        uuid primary key default gen_random_uuid(),
  tienda_id uuid not null references public.tiendas(id) on delete cascade,
  nombre    text not null,
  orden     int  not null default 0,
  creado_en timestamptz not null default now(),
  unique (tienda_id, nombre)
);

create table if not exists public.productos (
  id           uuid primary key default gen_random_uuid(),
  tienda_id    uuid not null references public.tiendas(id) on delete cascade,
  categoria_id uuid references public.categorias(id) on delete set null,
  nombre       text not null,
  precio       numeric(12,2) not null default 0,
  detalle      text,
  disponible   boolean not null default true,
  orden        int not null default 0,
  creado_en    timestamptz not null default now()
);

-- Las fotos NO se guardan acá adentro: se suben al depósito de archivos
-- (Storage) y en esta tabla queda solamente la dirección de cada una.
-- "url" es la foto recortada 600x800 que ve el público.
-- "url_original" y "encuadre" guardan la foto sin recortar y cómo quedó
-- encuadrada, para que el cliente pueda volver a acomodarla cuando quiera
-- sin que pierda calidad ni tenga que subirla de nuevo.
create table if not exists public.producto_fotos (
  id           uuid primary key default gen_random_uuid(),
  producto_id  uuid not null references public.productos(id) on delete cascade,
  url          text not null,
  url_original text,
  encuadre     jsonb,
  orden        int  not null default 0
);

alter table public.producto_fotos add column if not exists url_original text;
alter table public.producto_fotos add column if not exists encuadre jsonb;

create index if not exists idx_tiendas_slug      on public.tiendas (slug);
create index if not exists idx_tiendas_dueno     on public.tiendas (dueno_id);
create index if not exists idx_categorias_tienda on public.categorias (tienda_id);
create index if not exists idx_productos_tienda  on public.productos (tienda_id);
create index if not exists idx_fotos_producto    on public.producto_fotos (producto_id);


-- ─────────────────────────────────────────────────────────────
--  2. AYUDANTES  (preguntas que la base se hace a sí misma)
-- ─────────────────────────────────────────────────────────────

-- ¿El que está pidiendo es el administrador?
create or replace function public.es_admin()
returns boolean
language sql stable security definer set search_path = public
as $fn$
  select exists (
    select 1 from public.perfiles where id = auth.uid() and rol = 'admin'
  );
$fn$;

-- ¿Puede editar esta tienda? (es su dueño, o es el administrador)
create or replace function public.puede_editar(t uuid)
returns boolean
language sql stable security definer set search_path = public
as $fn$
  select public.es_admin() or exists (
    select 1 from public.tiendas where id = t and dueno_id = auth.uid()
  );
$fn$;

-- ¿Puede VER esta tienda? (está publicada, o es suya, o es el administrador)
create or replace function public.puede_ver(t uuid)
returns boolean
language sql stable security definer set search_path = public
as $fn$
  select exists (
    select 1 from public.tiendas
    where id = t and (activa or dueno_id = auth.uid())
  ) or public.es_admin();
$fn$;


-- ─────────────────────────────────────────────────────────────
--  3. LOS CANDADOS  (Row Level Security)
--     Viven en la base, no en la página. Aunque alguien manipule
--     el navegador, no puede tocar datos que no son suyos.
-- ─────────────────────────────────────────────────────────────

alter table public.perfiles       enable row level security;
alter table public.tiendas        enable row level security;
alter table public.categorias     enable row level security;
alter table public.productos      enable row level security;
alter table public.producto_fotos enable row level security;

drop policy if exists "perfiles ver"      on public.perfiles;
drop policy if exists "perfiles crear"    on public.perfiles;
drop policy if exists "perfiles editar"   on public.perfiles;
drop policy if exists "perfiles admin"    on public.perfiles;
drop policy if exists "tiendas ver"       on public.tiendas;
drop policy if exists "tiendas crear"     on public.tiendas;
drop policy if exists "tiendas editar"    on public.tiendas;
drop policy if exists "tiendas borrar"    on public.tiendas;
drop policy if exists "categorias ver"    on public.categorias;
drop policy if exists "categorias editar" on public.categorias;
drop policy if exists "productos ver"     on public.productos;
drop policy if exists "productos editar"  on public.productos;
drop policy if exists "fotos ver"         on public.producto_fotos;
drop policy if exists "fotos editar"      on public.producto_fotos;

-- PERFILES: cada uno ve el suyo; el administrador ve todos.
create policy "perfiles ver" on public.perfiles
  for select using (id = auth.uid() or public.es_admin());

-- Red de seguridad: si una cuenta quedó sin perfil (por ejemplo, se creó
-- antes de correr este archivo), se puede armar el suyo, siempre como cliente.
create policy "perfiles crear" on public.perfiles
  for insert with check (id = auth.uid() and rol = 'cliente');

create policy "perfiles editar" on public.perfiles
  for update using (id = auth.uid() or public.es_admin())
  with check (id = auth.uid() or public.es_admin());

create policy "perfiles admin" on public.perfiles
  for all using (public.es_admin()) with check (public.es_admin());

-- TIENDAS: el público ve las publicadas (así el catálogo funciona sin que
-- nadie tenga cuenta). El dueño ve la suya aunque esté dada de baja.
create policy "tiendas ver" on public.tiendas
  for select using (activa or dueno_id = auth.uid() or public.es_admin());

-- Solo el administrador da de alta tiendas.
create policy "tiendas crear" on public.tiendas
  for insert with check (public.es_admin());

create policy "tiendas editar" on public.tiendas
  for update using (dueno_id = auth.uid() or public.es_admin())
  with check (dueno_id = auth.uid() or public.es_admin());

create policy "tiendas borrar" on public.tiendas
  for delete using (public.es_admin());

-- CATEGORÍAS Y PRODUCTOS: se ven si la tienda se ve, se editan si la tienda se edita.
create policy "categorias ver" on public.categorias
  for select using (public.puede_ver(tienda_id));

create policy "categorias editar" on public.categorias
  for all using (public.puede_editar(tienda_id))
  with check (public.puede_editar(tienda_id));

create policy "productos ver" on public.productos
  for select using (public.puede_ver(tienda_id));

create policy "productos editar" on public.productos
  for all using (public.puede_editar(tienda_id))
  with check (public.puede_editar(tienda_id));

create policy "fotos ver" on public.producto_fotos
  for select using (
    exists (select 1 from public.productos p
            where p.id = producto_id and public.puede_ver(p.tienda_id))
  );

create policy "fotos editar" on public.producto_fotos
  for all using (
    exists (select 1 from public.productos p
            where p.id = producto_id and public.puede_editar(p.tienda_id))
  )
  with check (
    exists (select 1 from public.productos p
            where p.id = producto_id and public.puede_editar(p.tienda_id))
  );


-- ─────────────────────────────────────────────────────────────
--  4. AUTOMATISMOS
-- ─────────────────────────────────────────────────────────────

-- Cuando nace una cuenta, se le arma el perfil sola.
-- El rol sale de "app_metadata", que SOLO puede escribir el servidor:
-- así nadie puede hacerse administrador a sí mismo desde el navegador.
create or replace function public.crear_perfil_nuevo()
returns trigger
language plpgsql security definer set search_path = public
as $fn$
begin
  insert into public.perfiles (id, nombre, rol)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'nombre', ''),
    case when new.raw_app_meta_data ->> 'rol' = 'admin' then 'admin' else 'cliente' end
  )
  on conflict (id) do nothing;
  return new;
end;
$fn$;

drop trigger if exists al_crear_usuario on auth.users;
create trigger al_crear_usuario
  after insert on auth.users
  for each row execute function public.crear_perfil_nuevo();

-- Nadie se cambia el rol a sí mismo.
create or replace function public.proteger_rol()
returns trigger
language plpgsql security definer set search_path = public
as $fn$
begin
  -- auth.uid() vacío = la orden no viene del navegador de nadie, sino del
  -- SQL Editor o del servidor. Ahí el candado no corresponde.
  if new.rol is distinct from old.rol
     and auth.uid() is not null
     and not public.es_admin() then
    raise exception 'El rol solo lo puede cambiar el administrador';
  end if;
  return new;
end;
$fn$;

drop trigger if exists al_editar_perfil on public.perfiles;
create trigger al_editar_perfil
  before update on public.perfiles
  for each row execute function public.proteger_rol();

-- El cliente edita su tienda, pero no su dirección, su plan ni si está
-- publicada: eso es cosa del administrador.
create or replace function public.proteger_tienda()
returns trigger
language plpgsql security definer set search_path = public
as $fn$
begin
  -- Igual que arriba: desde el SQL Editor o el servidor no hay candado.
  if auth.uid() is not null and not public.es_admin() then
    if new.slug     is distinct from old.slug
    or new.plan     is distinct from old.plan
    or new.activa   is distinct from old.activa
    or new.dueno_id is distinct from old.dueno_id then
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
--  5. EL DEPÓSITO DE FOTOS
--     Cada tienda guarda en su propia carpeta: fotos/<id-de-tienda>/...
-- ─────────────────────────────────────────────────────────────

insert into storage.buckets (id, name, public)
values ('fotos', 'fotos', true)
on conflict (id) do nothing;

create or replace function public.puede_editar_carpeta(carpeta text)
returns boolean
language plpgsql stable security definer set search_path = public
as $fn$
declare t uuid;
begin
  begin
    t := carpeta::uuid;
  exception when others then
    return false;
  end;
  return public.puede_editar(t);
end;
$fn$;

drop policy if exists "fotos lectura publica" on storage.objects;
drop policy if exists "fotos subir"           on storage.objects;
drop policy if exists "fotos reemplazar"      on storage.objects;
drop policy if exists "fotos borrar"          on storage.objects;

create policy "fotos lectura publica" on storage.objects
  for select using (bucket_id = 'fotos');

create policy "fotos subir" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'fotos'
              and public.puede_editar_carpeta((storage.foldername(name))[1]));

create policy "fotos reemplazar" on storage.objects
  for update to authenticated
  using (bucket_id = 'fotos'
         and public.puede_editar_carpeta((storage.foldername(name))[1]));

create policy "fotos borrar" on storage.objects
  for delete to authenticated
  using (bucket_id = 'fotos'
         and public.puede_editar_carpeta((storage.foldername(name))[1]));

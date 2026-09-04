-- ═══════════════════════════════════════════════════════════════
--  ETAPA 4 — Guardar el email en el perfil.
--  Pegá esto en el SQL Editor y apretá Run.
--
--  Los emails viven en una tabla del sistema a la que la página no
--  llega. Copiándolo al perfil, tu panel puede mostrar con qué email
--  entra cada cliente sin necesidad de permisos especiales.
-- ═══════════════════════════════════════════════════════════════

alter table public.perfiles add column if not exists email text;

-- Los que ya existen
update public.perfiles p
set email = u.email
from auth.users u
where u.id = p.id and p.email is distinct from u.email;

-- Y los que vengan
create or replace function public.crear_perfil_nuevo()
returns trigger
language plpgsql security definer set search_path = public
as $fn$
begin
  insert into public.perfiles (id, email, nombre, rol)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'nombre', ''),
    case when new.raw_app_meta_data ->> 'rol' = 'admin' then 'admin' else 'cliente' end
  )
  on conflict (id) do nothing;
  return new;
end;
$fn$;

-- Comprobar
select email, rol from public.perfiles;

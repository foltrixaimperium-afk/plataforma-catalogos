-- ═══════════════════════════════════════════════════════════════
--  PASO 1 — Ver qué cuentas existen y cómo está escrito el email.
--  Seleccioná estas líneas y apretá Run.
-- ═══════════════════════════════════════════════════════════════

select u.email, p.rol
from public.perfiles p
join auth.users u on u.id = p.id
order by u.created_at;


-- ═══════════════════════════════════════════════════════════════
--  PASO 2 — Si en la lista de arriba hay UNA SOLA cuenta (la tuya),
--  seleccioná estas líneas y apretá Run. Listo.
-- ═══════════════════════════════════════════════════════════════

update public.perfiles
set rol = 'admin'
where (select count(*) from public.perfiles) = 1;


-- ═══════════════════════════════════════════════════════════════
--  PASO 3 — Comprobar. Tiene que decir 'admin'.
-- ═══════════════════════════════════════════════════════════════

select u.email, p.rol
from public.perfiles p
join auth.users u on u.id = p.id;


-- ═══════════════════════════════════════════════════════════════
--  (Para más adelante, cuando ya haya varias cuentas: convertir en
--  administrador a una en particular. No distingue mayúsculas ni
--  espacios de más.)
-- ═══════════════════════════════════════════════════════════════

-- update public.perfiles p
-- set rol = 'admin'
-- from auth.users u
-- where u.id = p.id
--   and lower(trim(u.email)) = lower(trim('PONE-EL-EMAIL-ACA@ejemplo.com'));

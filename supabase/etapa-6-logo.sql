-- ═══════════════════════════════════════════════════════════════
--  Poder reencuadrar el logo, igual que las fotos de los productos.
--  Pegá esto en el SQL Editor y apretá Run.
--
--  Guardamos el logo sin recortar y cómo quedó acomodado, para que
--  se pueda volver a encuadrar sin subirlo de nuevo ni perder calidad.
-- ═══════════════════════════════════════════════════════════════

alter table public.tiendas add column if not exists logo_url_original text;
alter table public.tiendas add column if not exists logo_encuadre jsonb;

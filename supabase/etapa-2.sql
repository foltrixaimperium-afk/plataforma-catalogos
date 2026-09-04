-- ═══════════════════════════════════════════════════════════════
--  ETAPA 2 — Dos datos más para las fotos.
--  Pegá esto en el SQL Editor y apretá Run.
--
--  Guardamos la foto sin recortar y cómo quedó encuadrada, para que
--  el cliente pueda volver a acomodarla cuando quiera sin perder
--  calidad ni tener que subirla de nuevo.
-- ═══════════════════════════════════════════════════════════════

alter table public.producto_fotos add column if not exists url_original text;
alter table public.producto_fotos add column if not exists encuadre jsonb;

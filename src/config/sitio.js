/* ═══════════════════════════════════════════════════════════════════
   EL ÚNICO ARCHIVO DEL PROYECTO QUE SABE CUÁL ES LA DIRECCIÓN DEL SITIO.

   No hace falta tocarlo nunca. La dirección se escribe en netlify.toml,
   en la línea VITE_SITE_URL. Acá solo se lee.

   En tu computadora, cuando esa variable no existe, se usa la dirección
   desde la que abriste la página (http://localhost:5173). Así no tenés
   que configurar nada para trabajar local.
   ═══════════════════════════════════════════════════════════════════ */

const configurada = (import.meta.env.VITE_SITE_URL || "").trim();

/** La dirección del sitio, sin barra al final. */
export const URL_SITIO = (
  configurada || (typeof window !== "undefined" ? window.location.origin : "")
).replace(/\/+$/, "");

/** El link público del catálogo de una tienda. */
export function linkCatalogo(slug) {
  return `${URL_SITIO}/${slug}`;
}

/** Lo mismo, pero cortito, para mostrar en pantalla. */
export function linkCatalogoCorto(slug) {
  return `${URL_SITIO.replace(/^https?:\/\//, "")}/${slug}`;
}

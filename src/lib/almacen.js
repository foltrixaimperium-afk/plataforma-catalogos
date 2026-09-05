import { supabase } from "./supabase";

/* El depósito de fotos. Cada tienda escribe solo adentro de su carpeta:
   fotos/<id-de-tienda>/<id-de-producto>/<archivo>
   Eso no lo decide esta página: lo hace cumplir la base de datos. */

const BALDE = "fotos";

function extension(blob) {
  return blob.type === "image/webp" ? "webp" : "jpg";
}

/** Sube (o pisa) un archivo y devuelve su dirección pública. */
export async function subir(ruta, blob) {
  const { error } = await supabase.storage.from(BALDE).upload(ruta, blob, {
    upsert: true,
    contentType: blob.type,
    cacheControl: "31536000"
  });
  if (error) throw error;

  const { data } = supabase.storage.from(BALDE).getPublicUrl(ruta);
  /* El número del final obliga al navegador a mostrar la versión nueva
     cuando el cliente vuelve a encuadrar una foto que ya estaba. */
  return `${data.publicUrl}?v=${Date.now()}`;
}

export function rutaFoto(tiendaId, productoId, fotoId, blob) {
  return `${tiendaId}/${productoId}/${fotoId}.${extension(blob)}`;
}

export function rutaOriginal(tiendaId, productoId, fotoId, blob) {
  return `${tiendaId}/${productoId}/${fotoId}-original.${extension(blob)}`;
}

export function rutaLogo(tiendaId, blob) {
  return `${tiendaId}/logo.${extension(blob)}`;
}

/** Saca de la dirección pública la ruta interna, para poder borrar. */
export function rutaDesdeUrl(url) {
  if (!url) return null;
  const marca = `/${BALDE}/`;
  const i = url.indexOf(marca);
  if (i === -1) return null;
  return decodeURIComponent(url.slice(i + marca.length).split("?")[0]);
}

/** Borra archivos. Si alguno ya no está, no pasa nada. */
export async function borrar(urls) {
  const rutas = urls.map(rutaDesdeUrl).filter(Boolean);
  if (!rutas.length) return;
  await supabase.storage.from(BALDE).remove(rutas);
}

export function rutaLogoOriginal(tiendaId, blob) {
  return `${tiendaId}/logo-original.${extension(blob)}`;
}

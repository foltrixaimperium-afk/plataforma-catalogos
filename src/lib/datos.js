import { supabase } from "./supabase";
import { subir, borrar, rutaFoto, rutaOriginal, rutaDesdeUrl } from "./almacen";

/* Todo lo que la app le pide o le manda a la base de datos.
   Las reglas de quién puede tocar qué no están acá: están en la base.
   Si alguien intentara algo raro, la base lo rechaza igual. */

/* ---------- Categorías ---------- */

export async function traerCategorias(tiendaId) {
  const { data, error } = await supabase
    .from("categorias")
    .select("id, nombre, orden")
    .eq("tienda_id", tiendaId)
    .order("orden")
    .order("nombre");
  if (error) throw error;
  return data || [];
}

export async function crearCategoria(tiendaId, nombre, orden) {
  const { data, error } = await supabase
    .from("categorias")
    .insert({ tienda_id: tiendaId, nombre: nombre.trim(), orden })
    .select("id, nombre, orden")
    .single();
  if (error) throw error;
  return data;
}

export async function renombrarCategoria(id, nombre) {
  const { error } = await supabase
    .from("categorias")
    .update({ nombre: nombre.trim() })
    .eq("id", id);
  if (error) throw error;
}

/** Al borrar una categoría, sus productos quedan en "Sin categoría". */
export async function borrarCategoria(id) {
  const { error } = await supabase.from("categorias").delete().eq("id", id);
  if (error) throw error;
}

/* ---------- Productos ---------- */

export async function traerProductos(tiendaId) {
  const { data, error } = await supabase
    .from("productos")
    .select("id, nombre, precio, detalle, disponible, orden, categoria_id, producto_fotos(id, url, url_original, encuadre, orden)")
    .eq("tienda_id", tiendaId)
    .order("orden");
  if (error) throw error;

  return (data || []).map((p) => ({
    ...p,
    precio: Number(p.precio) || 0,
    fotos: [...(p.producto_fotos || [])]
      .sort((a, b) => a.orden - b.orden)
      .map((f) => ({
        id: f.id,
        url: f.url,
        urlOriginal: f.url_original,
        encuadre: f.encuadre,
        vista: f.url
      }))
  }));
}

/** Guarda el producto y todas sus fotos. Devuelve el id. */
export async function guardarProducto(tiendaId, datos, fotos, fotosDeAntes = []) {
  const id = datos.id || crypto.randomUUID();

  const { error } = await supabase.from("productos").upsert({
    id,
    tienda_id: tiendaId,
    nombre: datos.nombre.trim(),
    precio: Number(datos.precio) || 0,
    detalle: (datos.detalle || "").trim() || null,
    categoria_id: datos.categoria_id || null,
    disponible: datos.disponible !== false,
    orden: datos.orden ?? 0
  });
  if (error) throw error;

  /* Las fotos que el cliente sacó de la lista: se borran de la base y del depósito. */
  const quedan = new Set(fotos.map((f) => f.id));
  const sacadas = fotosDeAntes.filter((f) => !quedan.has(f.id));

  if (sacadas.length) {
    await supabase.from("producto_fotos").delete().in("id", sacadas.map((f) => f.id));
    await borrar(sacadas.flatMap((f) => [f.url, f.urlOriginal].filter(Boolean)));
  }

  /* Las que quedan: se suben las nuevas y se guarda el orden. */
  for (let i = 0; i < fotos.length; i++) {
    const f = fotos[i];
    let url = f.url;
    let urlOriginal = f.urlOriginal;

    if (f.blobRecortada) {
      /* Si la foto ya estaba, se pisa el mismo archivo. */
      const ruta = rutaDesdeUrl(f.url) || rutaFoto(tiendaId, id, f.id, f.blobRecortada);
      url = await subir(ruta, f.blobRecortada);
    }
    if (f.blobOriginal) {
      const ruta = rutaDesdeUrl(f.urlOriginal) || rutaOriginal(tiendaId, id, f.id, f.blobOriginal);
      urlOriginal = await subir(ruta, f.blobOriginal);
    }

    const { error: e2 } = await supabase.from("producto_fotos").upsert({
      id: f.id,
      producto_id: id,
      url,
      url_original: urlOriginal || null,
      encuadre: f.encuadre || null,
      orden: i
    });
    if (e2) throw e2;
  }

  return id;
}

export async function borrarProducto(producto) {
  const urls = (producto.fotos || []).flatMap((f) => [f.url, f.urlOriginal].filter(Boolean));
  const { error } = await supabase.from("productos").delete().eq("id", producto.id);
  if (error) throw error;
  await borrar(urls);
}

/** Guarda el orden de los productos que se movieron.
 *  Recibe solo los que cambiaron, así al mover uno se tocan dos filas
 *  y no la lista entera. */
export async function guardarOrden(cambios) {
  for (const p of cambios) {
    const { error } = await supabase
      .from("productos")
      .update({ orden: p.orden })
      .eq("id", p.id);
    if (error) throw error;
  }
}

/* ---------- La tienda ---------- */

export async function traerTienda(tiendaId) {
  const { data, error } = await supabase
    .from("tiendas")
    .select("*")
    .eq("id", tiendaId)
    .single();
  if (error) throw error;
  return data;
}

export async function guardarTienda(tiendaId, datos) {
  const { error } = await supabase.from("tiendas").update(datos).eq("id", tiendaId);
  if (error) throw error;
}

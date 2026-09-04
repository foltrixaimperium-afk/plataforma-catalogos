/* ═══════════════════════════════════════════════════════════════════
   Manejo de fotos. Todo esto sale del generador original
   (referencia/creador de catalogo 2.1.html), portado tal cual:
   achicar la foto antes de subirla, encuadrarla en un recuadro 3:4,
   y poder elegir entre "llenar el recuadro" o "foto entera con fondo
   blanco".

   Todo pasa en el celular del cliente, antes de subir nada. Por eso
   una foto de 5 MB termina viajando como 50 KB.
   ═══════════════════════════════════════════════════════════════════ */

export const ANCHO_FINAL = 600;
export const ALTO_FINAL  = 800;

/** Tamaño máximo que se guarda de la foto sin recortar, para poder
 *  volver a encuadrarla después sin que pierda calidad. */
export const LADO_ORIGINAL = 1100;

export function cargarImagen(src) {
  return new Promise((ok, err) => {
    const img = new Image();
    img.onload = () => ok(img);
    img.onerror = err;
    img.src = src;
  });
}

/** WebP pesa bastante menos. Si el celular no sabe generarlo, cae en JPEG. */
function lienzoABlob(lienzo, calidad) {
  return new Promise((ok) => {
    lienzo.toBlob(
      (b) => {
        if (b && b.type === "image/webp") return ok(b);
        lienzo.toBlob((j) => ok(j), "image/jpeg", calidad);
      },
      "image/webp",
      calidad
    );
  });
}

function leerComoDataUrl(archivo) {
  return new Promise((ok, err) => {
    const lector = new FileReader();
    lector.onload = () => ok(lector.result);
    lector.onerror = err;
    lector.readAsDataURL(archivo);
  });
}

/** Baja la foto a un tamaño manejable. Devuelve el dataURL (para
 *  dibujar en pantalla) y el blob (para subir). */
export async function achicarArchivo(archivo, ladoMaximo = LADO_ORIGINAL) {
  const url = await leerComoDataUrl(archivo);
  const img = await cargarImagen(url);

  const escala = Math.min(1, ladoMaximo / Math.max(img.width, img.height));
  const lienzo = document.createElement("canvas");
  lienzo.width  = Math.round(img.width  * escala);
  lienzo.height = Math.round(img.height * escala);

  const pincel = lienzo.getContext("2d");
  pincel.imageSmoothingQuality = "high";
  pincel.drawImage(img, 0, 0, lienzo.width, lienzo.height);

  const blob = await lienzoABlob(lienzo, 0.86);
  return { dataUrl: lienzo.toDataURL("image/jpeg", 0.86), blob };
}

/* ---------- El encuadre ---------- */

/** Cuánto se agranda la foto para el recuadro. Con "entera" se ve completa
 *  y queda fondo blanco en lo que sobra; si no, tapa todo el recuadro. */
export function escalaBase(img, entera) {
  return entera
    ? Math.min(ANCHO_FINAL / img.width, ALTO_FINAL / img.height)
    : Math.max(ANCHO_FINAL / img.width, ALTO_FINAL / img.height);
}

/** Encuadre por defecto: centrado y sin zoom. */
export function encuadreCentrado(img, entera) {
  const base = escalaBase(img, entera);
  return {
    zoom: 1,
    entera: !!entera,
    x: (ANCHO_FINAL - img.width  * base) / 2,
    y: (ALTO_FINAL  - img.height * base) / 2
  };
}

export function dibujarEncuadre(pincel, img, encuadre) {
  const base = escalaBase(img, encuadre.entera) * encuadre.zoom;
  pincel.fillStyle = encuadre.entera ? "#FFFFFF" : "#0E1A20";
  pincel.fillRect(0, 0, ANCHO_FINAL, ALTO_FINAL);
  pincel.imageSmoothingQuality = "high";
  pincel.drawImage(img, encuadre.x, encuadre.y, img.width * base, img.height * base);
}

/** Deja la foto adentro del recuadro: si lo tapa, sin franjas en los bordes;
 *  si es más chica que el recuadro, sin que se escape para afuera. */
export function acomodar(img, encuadre) {
  const base = escalaBase(img, encuadre.entera) * encuadre.zoom;
  const dentro = (recuadro, tamano, valor) =>
    tamano >= recuadro
      ? Math.min(0, Math.max(recuadro - tamano, valor))
      : Math.max(0, Math.min(recuadro - tamano, valor));
  encuadre.x = dentro(ANCHO_FINAL, img.width  * base, encuadre.x);
  encuadre.y = dentro(ALTO_FINAL,  img.height * base, encuadre.y);
  return encuadre;
}

/** Al mover el zoom, agranda desde el centro y no desde la esquina. */
export function aplicarZoom(img, encuadre, nuevoZoom) {
  const base = escalaBase(img, encuadre.entera);
  const antes = encuadre.zoom;
  const centroX = (ANCHO_FINAL / 2 - encuadre.x) / (base * antes);
  const centroY = (ALTO_FINAL  / 2 - encuadre.y) / (base * antes);
  return {
    ...encuadre,
    zoom: nuevoZoom,
    x: ANCHO_FINAL / 2 - centroX * base * nuevoZoom,
    y: ALTO_FINAL  / 2 - centroY * base * nuevoZoom
  };
}

/** Genera la foto final 600x800 que va a ver el público. */
export async function recortar(dataUrlOriginal, encuadre) {
  const img = await cargarImagen(dataUrlOriginal);
  const uso = acomodar(img, encuadre ? { ...encuadre } : encuadreCentrado(img, false));

  const lienzo = document.createElement("canvas");
  lienzo.width  = ANCHO_FINAL;
  lienzo.height = ALTO_FINAL;
  dibujarEncuadre(lienzo.getContext("2d"), img, uso);

  return { blob: await lienzoABlob(lienzo, 0.78), encuadre: uso };
}

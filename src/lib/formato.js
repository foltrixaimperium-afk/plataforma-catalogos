/* Pequeñas ayudas de formato, portadas del generador original. */

/** 2604806530 -> 5492604806530 */
export function normalizarWhatsapp(crudo) {
  let n = String(crudo || "").replace(/\D/g, "");
  if (!n) return "";
  if (n.startsWith("549")) return n;
  if (n.startsWith("54"))  return "549" + n.slice(2);
  n = n.replace(/^0/, "");
  n = n.replace(/^(\d{2,4})15/, "$1");
  return "549" + n;
}

export function instagramUrl(crudo) {
  const t = String(crudo || "").trim();
  if (!t) return "";
  if (/^https?:\/\//i.test(t)) return t;
  return "https://www.instagram.com/" + t.replace(/^@/, "").replace(/\/+$/, "") + "/";
}

/** Mezcla un color con blanco. p=0 devuelve el color, p=1 devuelve blanco. */
export function aclarar(hex, p) {
  const c = (hex || "#1E7CAB").replace("#", "");
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  const m = (v) => Math.round(v + (255 - v) * p).toString(16).padStart(2, "0");
  return "#" + m(r) + m(g) + m(b);
}

/** Contraste con el blanco, para avisar si el color es muy claro. */
export function contrasteConBlanco(hex) {
  const c = (hex || "#1E7CAB").replace("#", "");
  const canal = (v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  const L =
    0.2126 * canal(parseInt(c.slice(0, 2), 16)) +
    0.7152 * canal(parseInt(c.slice(2, 4), 16)) +
    0.0722 * canal(parseInt(c.slice(4, 6), 16));
  return 1.05 / (L + 0.05);
}

export function plata(monto, moneda) {
  return `${moneda || "$"} ${Number(monto || 0).toLocaleString("es-AR")}`;
}

/** "Bazar Aurora" -> "bazar-aurora". Es lo que va después de la barra
 *  en la dirección del catálogo. */
export function aSlug(texto) {
  return (texto || "")
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40)
    .replace(/-+$/g, "");
}

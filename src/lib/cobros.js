/* Cuentas de fechas para los vencimientos.
 *
 * Todo se maneja con fechas sueltas ("2026-09-10"), sin hora y sin zona
 * horaria: un vencimiento es un día del calendario, no un instante. Por eso
 * acá no se usa Date.toISOString() en ningún lado — eso convierte a hora de
 * Londres y puede correr un día para atrás. */

const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul",
               "ago", "sep", "oct", "nov", "dic"];

/** Un objeto Date -> "2026-09-10" */
function aTexto(d) {
  return d.getFullYear() + "-" +
         String(d.getMonth() + 1).padStart(2, "0") + "-" +
         String(d.getDate()).padStart(2, "0");
}

/** "2026-09-10" -> un objeto Date a las 00:00 de acá. */
function aFecha(iso) {
  const p = String(iso).split("-");
  return new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
}

export function hoy() {
  return aTexto(new Date());
}

/** "2026-09-10" -> "10 sep 2026" */
export function fechaLinda(iso) {
  if (!iso) return "sin fecha";
  const d = aFecha(iso);
  if (isNaN(d)) return "sin fecha";
  return d.getDate() + " " + MESES[d.getMonth()] + " " + d.getFullYear();
}

/** Cuántos días faltan. Negativo = ya venció. null = no tiene fecha. */
export function diasQueFaltan(iso) {
  if (!iso) return null;
  const objetivo = aFecha(iso);
  if (isNaN(objetivo)) return null;
  return Math.round((objetivo - aFecha(hoy())) / 86400000);
}

/** Correr una fecha unos meses para adelante.
 *  El 31 de enero + 1 mes cae el 28 de febrero, no el 3 de marzo. */
export function sumarMeses(iso, meses) {
  const d = aFecha(iso);
  const diaOriginal = d.getDate();
  d.setMonth(d.getMonth() + Number(meses));
  if (d.getDate() < diaOriginal) d.setDate(0);
  return aTexto(d);
}

/** El semáforo: "vencido", "pronto" (esta semana), "aldia" o "sinfecha". */
export function estado(iso) {
  const dias = diasQueFaltan(iso);
  if (dias === null) return "sinfecha";
  if (dias < 0)  return "vencido";
  if (dias <= 7) return "pronto";
  return "aldia";
}

/** Lo que se lee en la ficha: "Vencido hace 3 días", "Vence mañana"… */
export function comoVa(iso) {
  const dias = diasQueFaltan(iso);
  if (dias === null) return "Sin fecha de vencimiento";
  if (dias < 0) {
    const d = Math.abs(dias);
    return "Vencido hace " + d + (d === 1 ? " día" : " días");
  }
  if (dias === 0) return "Vence hoy";
  if (dias === 1) return "Vence mañana";
  if (dias <= 7)  return "Vence en " + dias + " días";
  return "Faltan " + dias + " días";
}

/** Ordena por el que vence primero. Los que no tienen fecha, al final. */
export function porVencimiento(a, b) {
  const da = diasQueFaltan(a.vence);
  const db = diasQueFaltan(b.vence);
  if (da === null && db === null) return (a.nombre || "").localeCompare(b.nombre || "");
  if (da === null) return 1;
  if (db === null) return -1;
  return da - db;
}

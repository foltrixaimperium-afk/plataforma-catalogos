import { createClient } from "@supabase/supabase-js";

const url   = import.meta.env.VITE_SUPABASE_URL;
const clave = import.meta.env.VITE_SUPABASE_ANON_KEY;

/** Se avisa fuerte si falta el archivo .env, para no perder tiempo adivinando. */
export const faltaConfiguracion = !url || !clave;

export const supabase = faltaConfiguracion
  ? null
  : createClient(url, clave, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false
      }
    });

/** Traduce los errores de Supabase al castellano de todos los días.
 *  Al cliente nunca le llega una palabra técnica: lo que no sabemos
 *  traducir se muestra genérico y queda en la consola para nosotros. */
export function enCastellano(error) {
  if (!error) return "";
  const m = (error.message || "").toLowerCase();

  if (m.includes("invalid login credentials")) return "El email o la contraseña no son correctos.";
  if (m.includes("email not confirmed"))       return "Esa cuenta todavía no está confirmada.";
  if (m.includes("failed to fetch") || m.includes("networkerror"))
    return "No hay conexión con el servidor. Revisá internet y probá de nuevo.";
  if (m.includes("rate limit") || m.includes("too many"))
    return "Probaste muchas veces seguidas. Esperá un minuto.";
  if (m.includes("duplicate key") || m.includes("already exists"))
    return "Ya existe algo con ese nombre. Probá con otro.";
  if (m.includes("row-level security") || m.includes("not authorized") || m.includes("permission denied"))
    return "No tenés permiso para hacer eso.";
  if (m.includes("payload too large") || m.includes("exceeded the maximum"))
    return "El archivo es muy grande. Probá con una foto más liviana.";

  console.error("Error sin traducir:", error);
  return "Algo salió mal. Probá de nuevo en un momento.";
}

/* ═══════════════════════════════════════════════════════════════════
   Crear cuentas de clientes y cambiarles la contraseña.

   ¿Por qué esto no vive en la página? Porque crear usuarios necesita
   la clave secreta de Supabase, y todo lo que está en la página lo
   puede leer cualquiera que abra el navegador. Acá corre del lado del
   servidor, donde la clave está a salvo.

   Lo primero que hace es comprobar que quien llama sea el
   administrador. Si no lo es, no pasa de la puerta.
   ═══════════════════════════════════════════════════════════════════ */

import { createClient } from "jsr:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

/* Se sube con cada cambio. Sirve para saber de una si lo que está
   corriendo en Supabase es la última versión o quedó una vieja. */
const VERSION = 4;

const responder = (cuerpo: Record<string, unknown>, estado = 200) =>
  new Response(JSON.stringify({ ...cuerpo, version: VERSION }), {
    status: estado,
    headers: { ...cors, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  const url     = Deno.env.get("SUPABASE_URL")!;
  const secreta = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const admin = createClient(url, secreta, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  /* ---- ¿Quién está llamando? ----
     El pase del usuario viene en la cabecera del pedido. */
  const pase = (req.headers.get("Authorization") ?? "")
    .replace(/^Bearer\s+/i, "")
    .trim();

  if (!pase) {
    return responder({ error: "Tenés que iniciar sesión.", detalle: "no llegó la cabecera" }, 401);
  }

  /* Le preguntamos a Supabase, derecho viejo, de quién es este pase.
     Es más confiable que pedírselo a la librería, que acá adentro busca
     una sesión guardada que no existe. */
  const respuesta = await fetch(`${url}/auth/v1/user`, {
    headers: { apikey: secreta, Authorization: `Bearer ${pase}` },
  });

  if (!respuesta.ok) {
    return responder({
      error: "Tenés que iniciar sesión.",
      detalle: `el pase no sirve (${respuesta.status})`,
    }, 401);
  }

  const user = await respuesta.json();
  if (!user?.id) {
    return responder({ error: "Tenés que iniciar sesión.", detalle: "sin usuario" }, 401);
  }

  /* Con el usuario ya confirmado, miramos su rol. */
  const { data: perfil } = await admin
    .from("perfiles").select("rol").eq("id", user.id).maybeSingle();

  if (perfil?.rol !== "admin") {
    return responder({ error: "Solo el administrador puede hacer esto." }, 403);
  }

  let cuerpo: any;
  try {
    cuerpo = await req.json();
  } catch {
    return responder({ error: "No entendimos el pedido." }, 400);
  }

  /* ---- Crear un cliente nuevo ---- */
  if (cuerpo.accion === "crear") {
    const { email, password, nombreTienda, slug, plan } = cuerpo;

    if (!email || !password || !nombreTienda || !slug) {
      return responder({ error: "Faltan datos." }, 400);
    }
    if (String(password).length < 8) {
      return responder({ error: "La contraseña tiene que tener al menos 8 caracteres." }, 400);
    }
    if (!/^[a-z0-9][a-z0-9-]{0,38}[a-z0-9]$/.test(slug)) {
      return responder({ error: "La dirección solo puede llevar minúsculas, números y guiones." }, 400);
    }

    /* Que la dirección esté libre antes de crear la cuenta. */
    const { data: ocupado } = await admin
      .from("tiendas").select("id").eq("slug", slug).maybeSingle();
    if (ocupado) {
      return responder({ error: "Esa dirección ya la está usando otro cliente." }, 400);
    }

    const { data: creado, error } = await admin.auth.admin.createUser({
      email: String(email).trim(),
      password,
      email_confirm: true,
      user_metadata: { nombre: nombreTienda },
    });

    if (error || !creado?.user) {
      const m = (error?.message || "").toLowerCase();
      return responder({
        error: m.includes("already") || m.includes("registered")
          ? "Ya existe una cuenta con ese email."
          : (error?.message || "No pudimos crear la cuenta."),
      }, 400);
    }

    const { error: errorTienda } = await admin.from("tiendas").insert({
      dueno_id: creado.user.id,
      slug,
      nombre: nombreTienda,
      plan: plan === "full" ? "full" : "autogestion",
    });

    if (errorTienda) {
      /* Si la tienda falla, se borra la cuenta: no dejamos cuentas huérfanas. */
      await admin.auth.admin.deleteUser(creado.user.id);
      return responder({ error: errorTienda.message }, 400);
    }

    return responder({ ok: true, usuarioId: creado.user.id });
  }

  /* ---- Cambiarle la contraseña a un cliente ---- */
  if (cuerpo.accion === "cambiar_clave") {
    const { usuarioId, password } = cuerpo;

    if (!usuarioId || !password) return responder({ error: "Faltan datos." }, 400);
    if (String(password).length < 8) {
      return responder({ error: "La contraseña tiene que tener al menos 8 caracteres." }, 400);
    }
    if (usuarioId === user.id) {
      return responder({ error: "Tu propia contraseña cambiala desde Supabase." }, 400);
    }

    const { error } = await admin.auth.admin.updateUserById(usuarioId, { password });
    if (error) return responder({ error: error.message }, 400);

    return responder({ ok: true });
  }

  return responder({ error: "No sabemos qué querés hacer." }, 400);
});

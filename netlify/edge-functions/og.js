/* ═══════════════════════════════════════════════════════════════════
   LA MINIATURA AL COMPARTIR EL LINK

   Cuando pegás un link en WhatsApp, WhatsApp entra a la página como un
   robot: no ejecuta nada, solo lee el HTML crudo y busca unas etiquetas
   que dicen el título, la descripción y la foto.

   Una página como la nuestra se arma recién cuando el navegador ejecuta
   el código, así que el robot vería una página vacía y la miniatura
   saldría gris.

   Esto se mete en el medio: cuando alguien pide /nombre-de-tienda, busca
   esa tienda, le pega las etiquetas al HTML y recién ahí lo entrega. El
   robot ve la miniatura correcta; la persona ve el catálogo de siempre.
   ═══════════════════════════════════════════════════════════════════ */

/* Direcciones del sistema: no son tiendas. */
const RESERVADAS = new Set([
  "entrar", "panel", "admin", "api", "app", "assets", "login",
  "salir", "static", "netlify", "www", "index", "ayuda"
]);

const escapar = (t) =>
  String(t ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

export default async (request, context) => {
  const url  = new URL(request.url);
  const slug = decodeURIComponent(url.pathname.slice(1)).trim();

  /* Ni la portada, ni las pantallas del sistema, ni archivos sueltos. */
  if (!slug || RESERVADAS.has(slug) || slug.includes("/") || slug.includes(".")) {
    return;
  }

  const respuesta = await context.next();
  const tipo = respuesta.headers.get("content-type") || "";
  if (!tipo.includes("text/html")) return respuesta;

  const base   = Netlify.env.get("VITE_SUPABASE_URL");
  const clave  = Netlify.env.get("VITE_SUPABASE_ANON_KEY");
  const sitio  = (Netlify.env.get("VITE_SITE_URL") || url.origin).replace(/\/+$/, "");
  if (!base || !clave) return respuesta;

  const cabeceras = { apikey: clave, Authorization: `Bearer ${clave}` };

  try {
    const r = await fetch(
      `${base}/rest/v1/tiendas?slug=eq.${encodeURIComponent(slug)}` +
      `&activa=is.true&select=id,nombre,frase,logo_url&limit=1`,
      { headers: cabeceras }
    );
    if (!r.ok) return respuesta;

    const [tienda] = await r.json();
    if (!tienda) return respuesta;

    /* Si no cargó logo, se usa la foto del primer producto. */
    let imagen = tienda.logo_url || "";
    if (!imagen) {
      const rf = await fetch(
        `${base}/rest/v1/productos?tienda_id=eq.${tienda.id}` +
        `&select=producto_fotos(url,orden)&order=orden.asc&limit=1`,
        { headers: cabeceras }
      );
      if (rf.ok) {
        const [primero] = await rf.json();
        const fotos = (primero?.producto_fotos || []).sort((a, b) => a.orden - b.orden);
        imagen = fotos[0]?.url || "";
      }
    }

    const descripcion = tienda.frase || `Mirá el catálogo de ${tienda.nombre}.`;
    const titulo = `${tienda.nombre} · Catálogo`;

    const etiquetas =
      `<title>${escapar(titulo)}</title>` +
      `<meta name="description" content="${escapar(descripcion)}">` +
      `<meta property="og:type" content="website">` +
      `<meta property="og:site_name" content="${escapar(tienda.nombre)}">` +
      `<meta property="og:title" content="${escapar(tienda.nombre)}">` +
      `<meta property="og:description" content="${escapar(descripcion)}">` +
      `<meta property="og:url" content="${escapar(`${sitio}/${slug}`)}">` +
      (imagen ? `<meta property="og:image" content="${escapar(imagen)}">` : "") +
      `<meta name="twitter:card" content="${imagen ? "summary_large_image" : "summary"}">` +
      (imagen ? `<meta name="twitter:image" content="${escapar(imagen)}">` : "") +
      `<meta name="twitter:title" content="${escapar(tienda.nombre)}">` +
      `<meta name="twitter:description" content="${escapar(descripcion)}">`;

    const html = (await respuesta.text())
      .replace(/<title>[\s\S]*?<\/title>/i, "")
      .replace(/<meta\s+property="og:[^>]*>/gi, "")
      .replace(/<meta\s+name="twitter:[^>]*>/gi, "")
      .replace("</head>", etiquetas + "</head>");

    return new Response(html, {
      status: respuesta.status,
      headers: respuesta.headers
    });
  } catch {
    /* Si algo falla, se entrega la página normal: mejor sin miniatura
       que sin catálogo. */
    return respuesta;
  }
};

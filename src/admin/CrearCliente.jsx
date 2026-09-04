import { useState } from "react";
import { supabase } from "../lib/supabase";
import { aSlug } from "../lib/formato";
import { linkCatalogoCorto } from "../config/sitio";

/* Una contraseña que el cliente pueda dictar por teléfono sin equivocarse:
   sin letras ni números que se confundan (l, I, 1, O, 0). */
function claveSugerida() {
  const letras = "abcdefghjkmnpqrstuvwxyz";
  const numeros = "23456789";
  const azar = (s) => s[Math.floor(Math.random() * s.length)];
  return (
    Array.from({ length: 5 }, () => azar(letras)).join("") +
    Array.from({ length: 4 }, () => azar(numeros)).join("")
  );
}

export default function CrearCliente({ onListo, onCancelar }) {
  const [email, setEmail]     = useState("");
  const [clave, setClave]     = useState(claveSugerida);
  const [nombre, setNombre]   = useState("");
  const [slug, setSlug]       = useState("");
  const [slugTocado, setSlugTocado] = useState(false);
  const [plan, setPlan]       = useState("autogestion");
  const [creando, setCreando] = useState(false);
  const [error, setError]     = useState("");
  const [hecho, setHecho]     = useState(null);

  /* La dirección se arma sola con el nombre, hasta que la toques a mano. */
  function cambiarNombre(v) {
    setNombre(v);
    if (!slugTocado) setSlug(aSlug(v));
  }

  async function crear(e) {
    e.preventDefault();
    setError("");

    if (!email.trim())  return setError("Falta el email del cliente.");
    if (clave.length < 8) return setError("La contraseña tiene que tener al menos 8 caracteres.");
    if (!nombre.trim()) return setError("Falta el nombre de la tienda.");
    if (!slug)          return setError("Falta la dirección del catálogo.");

    setCreando(true);
    const { data, error: err } = await supabase.functions.invoke("admin-clientes", {
      body: {
        accion: "crear",
        email: email.trim(),
        password: clave,
        nombreTienda: nombre.trim(),
        slug,
        plan
      }
    });

    /* La función devuelve el motivo real adentro del cuerpo. */
    const motivo = data?.error || (err ? "No pudimos crear la cuenta. Probá de nuevo." : "");
    if (motivo) {
      setError(motivo);
      setCreando(false);
      return;
    }

    setHecho({ email: email.trim(), clave, slug });
    setCreando(false);
  }

  if (hecho) {
    return (
      <div className="bloque">
        <h2 className="bloque-titulo">Cliente creado ✅</h2>
        <p className="bloque-nota">
          Pasale estos datos. Anotalos ahora: la contraseña no se puede volver a ver.
        </p>
        <div className="campos">
          <div className="campo">
            <span className="ayuda">Entra en</span>
            <span className="dato-monoespaciado">{linkCatalogoCorto("entrar")}</span>
          </div>
          <div className="campo">
            <span className="ayuda">Con este email</span>
            <span className="dato-monoespaciado">{hecho.email}</span>
          </div>
          <div className="campo">
            <span className="ayuda">Y esta contraseña</span>
            <span className="dato-monoespaciado">{hecho.clave}</span>
          </div>
          <div className="campo">
            <span className="ayuda">Su catálogo va a estar en</span>
            <span className="dato-monoespaciado">{linkCatalogoCorto(hecho.slug)}</span>
          </div>
          <button type="button" className="boton verde" onClick={onListo}>
            Listo, ya los anoté
          </button>
        </div>
      </div>
    );
  }

  return (
    <form className="bloque" onSubmit={crear}>
      <h2 className="bloque-titulo">Cliente nuevo</h2>
      <p className="bloque-nota">
        Se le crea la cuenta y la tienda de una sola vez. Después le pasás el
        email y la contraseña.
      </p>

      <div className="campos">
        <div className="campo">
          <label htmlFor="c-nombre">Nombre de la tienda</label>
          <input
            id="c-nombre" type="text" value={nombre}
            onChange={(e) => cambiarNombre(e.target.value)}
            placeholder="Bazar Aurora" required
          />
        </div>

        <div className="campo">
          <label htmlFor="c-slug">Dirección del catálogo</label>
          <input
            id="c-slug" type="text" value={slug}
            onChange={(e) => { setSlugTocado(true); setSlug(aSlug(e.target.value)); }}
            autoCapitalize="off" spellCheck="false" required
          />
          <span className="ayuda">
            Va a quedar en <strong>{linkCatalogoCorto(slug || "…")}</strong>. Esto
            después no se puede cambiar sin romperle los links, así que fijate bien.
          </span>
        </div>

        <div className="campo">
          <label htmlFor="c-email">Email del cliente</label>
          <input
            id="c-email" type="email" value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="cliente@ejemplo.com"
            autoCapitalize="off" spellCheck="false" required
          />
          <span className="ayuda">Con este email va a entrar a su panel.</span>
        </div>

        <div className="campo">
          <label htmlFor="c-clave">Contraseña</label>
          <div className="fila-botones">
            <input
              id="c-clave" type="text" value={clave}
              onChange={(e) => setClave(e.target.value)}
              style={{ flex: 1, minWidth: 160 }} required
            />
            <button
              type="button" className="boton suave chico"
              onClick={() => setClave(claveSugerida())}
            >
              Otra
            </button>
          </div>
          <span className="ayuda">
            Sin letras que se confundan, para que puedas dictarla por teléfono.
          </span>
        </div>

        <div className="campo">
          <label htmlFor="c-plan">Plan</label>
          <select id="c-plan" value={plan} onChange={(e) => setPlan(e.target.value)}>
            <option value="autogestion">Autogestión — se maneja solo</option>
            <option value="full">Full — le cargo yo los productos</option>
          </select>
        </div>

        {error && <div className="aviso error">{error}</div>}
      </div>

      <div className="barra-guardar">
        <button type="button" className="boton suave" onClick={onCancelar} disabled={creando}>
          Cancelar
        </button>
        <button type="submit" className="boton verde" disabled={creando}>
          {creando ? "Creando…" : "Crear cliente"}
        </button>
      </div>
    </form>
  );
}

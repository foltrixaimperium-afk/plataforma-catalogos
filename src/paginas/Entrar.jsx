import { useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase, enCastellano } from "../lib/supabase";
import { useSesion } from "../auth/Sesion";

export default function Entrar() {
  const { sesion, esAdmin, cargando } = useSesion();
  const [email, setEmail]         = useState("");
  const [clave, setClave]         = useState("");
  const [error, setError]         = useState("");
  const [entrando, setEntrando]   = useState(false);

  if (cargando) return <div className="cargando">Un segundo…</div>;
  if (sesion)   return <Navigate to={esAdmin ? "/admin" : "/panel"} replace />;

  async function enviar(e) {
    e.preventDefault();
    setError("");
    setEntrando(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: clave
    });

    if (error) {
      setError(enCastellano(error));
      setEntrando(false);
    }
    // Si sale bien, la sesión cambia sola y esta pantalla se va.
  }

  return (
    <div className="pantalla-centrada">
      <div className="caja-entrar">
        <h1 className="marca-entrar">Tu catálogo</h1>
        <p className="marca-entrar-nota">
          Entrá con el email y la contraseña que te pasamos.
        </p>

        <form className="bloque" onSubmit={enviar}>
          <div className="campos">
            <div className="campo">
              <label htmlFor="email">Tu email</label>
              <input
                id="email"
                type="email"
                autoComplete="username"
                inputMode="email"
                autoCapitalize="off"
                spellCheck="false"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nombre@ejemplo.com"
                required
              />
            </div>

            <div className="campo">
              <label htmlFor="clave">Tu contraseña</label>
              <input
                id="clave"
                type="password"
                autoComplete="current-password"
                value={clave}
                onChange={(e) => setClave(e.target.value)}
                required
              />
            </div>

            {error && <div className="aviso error">{error}</div>}

            <button className="boton ancho" type="submit" disabled={entrando}>
              {entrando ? "Entrando…" : "Entrar"}
            </button>

            <p className="ayuda" style={{ textAlign: "center", color: "var(--suave)", fontSize: 13 }}>
              ¿No te acordás la contraseña? Escribinos y te la cambiamos.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

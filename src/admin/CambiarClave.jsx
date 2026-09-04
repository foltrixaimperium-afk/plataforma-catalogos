import { useState } from "react";
import { supabase } from "../lib/supabase";

export default function CambiarClave({ cliente, onCerrar }) {
  const [clave, setClave]       = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError]       = useState("");
  const [listo, setListo]       = useState(false);

  async function guardar(e) {
    e.preventDefault();
    setError("");
    if (clave.length < 8) return setError("Tiene que tener al menos 8 caracteres.");

    setGuardando(true);
    const { data, error: err } = await supabase.functions.invoke("admin-clientes", {
      body: { accion: "cambiar_clave", usuarioId: cliente.id, password: clave }
    });

    const motivo = data?.error || (err ? "No pudimos cambiarla. Probá de nuevo." : "");
    if (motivo) {
      setError(motivo);
      setGuardando(false);
      return;
    }

    setListo(true);
    setGuardando(false);
  }

  return (
    <div className="velo" onClick={(e) => { if (e.target === e.currentTarget) onCerrar(); }}>
      <form className="recortador" onSubmit={guardar}>
        <h3>Contraseña de {cliente.nombre}</h3>

        {listo ? (
          <>
            <p className="nota">
              Cambiada. Pasale esta contraseña: <strong>{clave}</strong>
            </p>
            <button type="button" className="boton verde ancho" onClick={onCerrar}>
              Listo
            </button>
          </>
        ) : (
          <>
            <p className="nota">
              La anterior deja de servir en cuanto guardes. Anotá la nueva antes
              de cerrar.
            </p>
            <div className="campo">
              <label htmlFor="clave-nueva">Contraseña nueva</label>
              <input
                id="clave-nueva" type="text" value={clave}
                onChange={(e) => setClave(e.target.value)}
                autoCapitalize="off" spellCheck="false" autoFocus
              />
            </div>

            {error && <div className="aviso error" style={{ marginTop: 10 }}>{error}</div>}

            <div className="recorte-botones">
              <button type="button" className="boton suave" onClick={onCerrar} disabled={guardando}>
                Cancelar
              </button>
              <button type="submit" className="boton verde" disabled={guardando}>
                {guardando ? "Guardando…" : "Cambiar"}
              </button>
            </div>
          </>
        )}
      </form>
    </div>
  );
}

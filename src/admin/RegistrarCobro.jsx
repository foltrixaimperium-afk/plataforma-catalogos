import { useState } from "react";
import { supabase, enCastellano } from "../lib/supabase";
import { hoy, fechaLinda, sumarMeses, diasQueFaltan } from "../lib/cobros";

/* Anotar un cobro y correr el vencimiento, en una sola pantalla.
 *
 * Los botones de "+1 mes" cuentan desde el vencimiento anterior, que es lo
 * correcto: si pagó tarde, no le regalás los días. Salvo que ya haya vencido
 * hace rato, ahí cuentan desde hoy. */
export default function RegistrarCobro({ tienda, onListo, onCerrar }) {
  const yaVencio = diasQueFaltan(tienda.vence) !== null && diasQueFaltan(tienda.vence) < 0;
  const desde = !tienda.vence || yaVencio ? hoy() : tienda.vence;

  const [fecha, setFecha]     = useState(hoy());
  const [monto, setMonto]     = useState(tienda.cobro_monto || "");
  const [vence, setVence]     = useState(sumarMeses(desde, 1));
  const [nota, setNota]       = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError]     = useState("");

  async function guardar(e) {
    e.preventDefault();
    setError("");
    setGuardando(true);

    const { error: e1 } = await supabase.from("pagos").insert({
      tienda_id: tienda.id,
      fecha,
      monto: Number(monto) || 0,
      nota: nota.trim() || null
    });

    if (e1) {
      setError(enCastellano(e1));
      setGuardando(false);
      return;
    }

    const { error: e2 } = await supabase
      .from("tiendas")
      .update({ vence })
      .eq("id", tienda.id);

    if (e2) {
      setError("El pago quedó anotado, pero no se pudo correr el vencimiento. " + enCastellano(e2));
      setGuardando(false);
      return;
    }

    onListo();
  }

  return (
    <div className="velo" onClick={(e) => { if (e.target === e.currentTarget) onCerrar(); }}>
      <form className="recortador" onSubmit={guardar}>
        <h3>Cobré a {tienda.nombre}</h3>
        <p className="nota">
          Queda anotado en su historial y el vencimiento se corre solo.
        </p>

        <div className="campos dos">
          <div className="campo">
            <label htmlFor="cobro-fecha">Cobré el día</label>
            <input
              id="cobro-fecha" type="date" value={fecha} required
              onChange={(e) => setFecha(e.target.value)}
            />
          </div>
          <div className="campo">
            <label htmlFor="cobro-monto">Monto</label>
            <input
              id="cobro-monto" type="number" min="0" step="100" value={monto} required
              onChange={(e) => setMonto(e.target.value)}
            />
          </div>
        </div>

        <div className="campo" style={{ marginTop: 12 }}>
          <label htmlFor="cobro-vence">Le vence el</label>
          <input
            id="cobro-vence" type="date" value={vence} required
            onChange={(e) => setVence(e.target.value)}
          />
          <div className="fila-meses">
            {[1, 3, 6, 12].map((m) => (
              <button key={m} type="button" onClick={() => setVence(sumarMeses(desde, m))}>
                {m === 12 ? "+ 1 año" : `+ ${m} ${m === 1 ? "mes" : "meses"}`}
              </button>
            ))}
          </div>
          <span className="ayuda">
            {!tienda.vence || yaVencio
              ? "Como ya estaba vencido, los botones cuentan desde hoy."
              : `Los botones cuentan desde el vencimiento de ahora (${fechaLinda(tienda.vence)}).`}
          </span>
        </div>

        <div className="campo" style={{ marginTop: 12 }}>
          <label htmlFor="cobro-nota">Nota (si querés)</label>
          <input
            id="cobro-nota" type="text" value={nota} maxLength={120}
            placeholder="Transferencia, efectivo, pagó la mitad…"
            onChange={(e) => setNota(e.target.value)}
          />
        </div>

        {error && <div className="aviso error" style={{ marginTop: 10 }}>{error}</div>}

        <div className="recorte-botones">
          <button type="button" className="boton suave" onClick={onCerrar} disabled={guardando}>
            Cancelar
          </button>
          <button type="submit" className="boton verde" disabled={guardando}>
            {guardando ? "Guardando…" : "Guardar el cobro"}
          </button>
        </div>
      </form>
    </div>
  );
}

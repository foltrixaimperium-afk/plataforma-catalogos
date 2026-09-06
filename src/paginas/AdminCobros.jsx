import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase, enCastellano } from "../lib/supabase";
import { linkCatalogo } from "../config/sitio";
import { normalizarWhatsapp, plata } from "../lib/formato";
import { comoVa, estado, fechaLinda, porVencimiento } from "../lib/cobros";
import AvisoVencimientos from "../admin/AvisoVencimientos";
import RegistrarCobro from "../admin/RegistrarCobro";

const FILTROS = [
  { id: "todos",    texto: "Todos" },
  { id: "vencido",  texto: "Vencidos" },
  { id: "pronto",   texto: "Vencen pronto" },
  { id: "aldia",    texto: "Al día" },
  { id: "sinfecha", texto: "Sin fecha" }
];

export default function AdminCobros() {
  const [tiendas, setTiendas]   = useState([]);
  const [pagos, setPagos]       = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError]       = useState("");
  const [filtro, setFiltro]     = useState("todos");
  const [busqueda, setBusqueda] = useState("");
  const [abierta, setAbierta]   = useState(null);
  const [cobrando, setCobrando] = useState(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    const [{ data: ts, error: e1 }, { data: ps, error: e2 }] = await Promise.all([
      supabase.from("tiendas").select("*"),
      supabase.from("pagos").select("*").order("fecha", { ascending: false })
    ]);

    setError(e1 || e2 ? enCastellano(e1 || e2) : "");
    setTiendas(ts || []);
    setPagos(ps || []);
    setCargando(false);
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  /* Guarda un dato suelto de la tienda y lo muestra al toque.
     Si la base lo rechaza, se vuelve para atrás y se avisa. */
  async function cambiar(tienda, campos) {
    const antes = tiendas;
    setTiendas(tiendas.map((t) => (t.id === tienda.id ? { ...t, ...campos } : t)));

    const { error: err } = await supabase.from("tiendas").update(campos).eq("id", tienda.id);
    if (err) {
      setError(enCastellano(err));
      setTiendas(antes);
    }
  }

  async function borrarPago(pago) {
    if (!confirm(`¿Borrar el pago de ${fechaLinda(pago.fecha)} por ${plata(pago.monto)}?`)) return;

    const antes = pagos;
    setPagos(pagos.filter((p) => p.id !== pago.id));

    const { error: err } = await supabase.from("pagos").delete().eq("id", pago.id);
    if (err) {
      setError(enCastellano(err));
      setPagos(antes);
    }
  }

  const cuenta = {
    todos:    tiendas.length,
    vencido:  tiendas.filter((t) => estado(t.vence) === "vencido").length,
    pronto:   tiendas.filter((t) => estado(t.vence) === "pronto").length,
    aldia:    tiendas.filter((t) => estado(t.vence) === "aldia").length,
    sinfecha: tiendas.filter((t) => estado(t.vence) === "sinfecha").length
  };

  const q = busqueda.trim().toLowerCase();
  const visibles = [...tiendas].sort(porVencimiento).filter((t) => {
    if (filtro !== "todos" && estado(t.vence) !== filtro) return false;
    if (q && !((t.nombre || "") + " " + (t.cobro_notas || "")).toLowerCase().includes(q)) return false;
    return true;
  });

  return (
    <>
      <header className="cabecera">
        <div className="envoltorio cabecera-fila">
          <div className="titulo">Vencimientos</div>
          <Link className="boton boton-clarito chico" to="/admin">
            Mis clientes
          </Link>
        </div>
      </header>

      <div className="contenido">
        {cargando ? (
          <div className="bloque">
            <p className="bloque-nota" style={{ margin: 0 }}>Buscando…</p>
          </div>
        ) : (
          <AvisoVencimientos tiendas={tiendas} conLink={false} />
        )}

        {error && <div className="aviso error" style={{ marginBottom: 16 }}>{error}</div>}

        <div className="bloque" style={{ padding: 12 }}>
          <div className="fila-filtros">
            {FILTROS.map((f) => (
              <button
                key={f.id}
                type="button"
                className={"filtro" + (filtro === f.id ? " elegido" : "")}
                onClick={() => setFiltro(f.id)}
              >
                {f.texto} <b>{cuenta[f.id]}</b>
              </button>
            ))}
          </div>
          {tiendas.length > 5 && (
            <input
              type="search"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por nombre…"
              aria-label="Buscar cliente"
              style={{ marginTop: 10 }}
            />
          )}
        </div>

        {visibles.map((t) => {
          const suEstado  = estado(t.vence);
          const susPagos  = pagos.filter((p) => p.tienda_id === t.id);
          const total     = susPagos.reduce((s, p) => s + Number(p.monto || 0), 0);
          const tel       = normalizarWhatsapp(t.whatsapp);
          const mensaje   = encodeURIComponent(
            `Hola ${t.nombre}! Te escribo por el catálogo: se vence el ${fechaLinda(t.vence)}. ` +
            `¿Lo renovamos? ${linkCatalogo(t.slug)}`
          );

          return (
            <div className={"bloque ficha-cobro " + suEstado} key={t.id}>
              <div className="producto-cabecera">
                <div className="producto-nombre-vista">{t.nombre}</div>
                <span className={"pastilla " + suEstado}>{comoVa(t.vence)}</span>
              </div>

              <div className="campos tres">
                <div className="campo">
                  <label htmlFor={`vence-${t.id}`}>Le vence el</label>
                  <input
                    id={`vence-${t.id}`}
                    type="date"
                    value={t.vence || ""}
                    onChange={(e) => cambiar(t, { vence: e.target.value || null })}
                  />
                </div>

                <div className="campo">
                  <label htmlFor={`monto-${t.id}`}>Cuánto te paga</label>
                  <input
                    id={`monto-${t.id}`}
                    type="number" min="0" step="100"
                    value={t.cobro_monto || ""}
                    placeholder="0"
                    onChange={(e) => cambiar(t, { cobro_monto: Number(e.target.value) || 0 })}
                  />
                </div>

                <div className="campo">
                  <label htmlFor={`notas-${t.id}`}>Notas del cobro</label>
                  <input
                    id={`notas-${t.id}`}
                    type="text" maxLength={200}
                    defaultValue={t.cobro_notas || ""}
                    placeholder="Paga por transferencia…"
                    onBlur={(e) => {
                      const v = e.target.value.trim();
                      if (v !== (t.cobro_notas || "")) cambiar(t, { cobro_notas: v || null });
                    }}
                  />
                </div>
              </div>

              <div className="fila-botones" style={{ marginTop: 14 }}>
                <button type="button" className="boton verde chico" onClick={() => setCobrando(t)}>
                  Cobré
                </button>

                {tel && (
                  <a
                    className="boton suave chico"
                    href={`https://wa.me/${tel}?text=${mensaje}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Escribirle por WhatsApp
                  </a>
                )}

                <button
                  type="button"
                  className="boton suave chico"
                  onClick={() => setAbierta(abierta === t.id ? null : t.id)}
                >
                  {abierta === t.id ? "Ocultar los pagos" : `Pagos (${susPagos.length})`}
                </button>

                <Link className="boton suave chico" to={`/admin/tienda/${t.id}`}>
                  Entrar a su tienda
                </Link>
              </div>

              {abierta === t.id && (
                <div className="historial">
                  {susPagos.length === 0 ? (
                    <p className="bloque-nota" style={{ margin: 0 }}>
                      Todavía no le anotaste ningún cobro.
                    </p>
                  ) : (
                    <>
                      <ul className="lista-pagos">
                        {susPagos.map((p) => (
                          <li key={p.id}>
                            <span className="dato-monoespaciado">{fechaLinda(p.fecha)}</span>
                            <span className="pago-nota">{p.nota || ""}</span>
                            <span className="pago-monto">{plata(p.monto, t.moneda)}</span>
                            <button
                              type="button"
                              className="pago-borrar"
                              title="Borrar este pago"
                              onClick={() => borrarPago(p)}
                            >
                              ✕
                            </button>
                          </li>
                        ))}
                      </ul>
                      <div className="pago-total">
                        <span>Total cobrado</span>
                        <span>{plata(total, t.moneda)}</span>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {!cargando && visibles.length === 0 && (
          <div className="bloque">
            <p className="bloque-nota" style={{ margin: 0 }}>
              {tiendas.length
                ? "Nada para mostrar acá. Probá con otro filtro."
                : "Todavía no hay clientes. Creá el primero desde Mis clientes."}
            </p>
          </div>
        )}
      </div>

      {cobrando && (
        <RegistrarCobro
          tienda={cobrando}
          onCerrar={() => setCobrando(null)}
          onListo={() => { setCobrando(null); cargar(); }}
        />
      )}
    </>
  );
}

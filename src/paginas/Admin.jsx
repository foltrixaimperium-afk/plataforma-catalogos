import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase, enCastellano } from "../lib/supabase";
import { useSesion } from "../auth/Sesion";
import { linkCatalogo, linkCatalogoCorto } from "../config/sitio";
import { aSlug } from "../lib/formato";
import CrearCliente from "../admin/CrearCliente";
import CambiarClave from "../admin/CambiarClave";

export default function Admin() {
  const { sesion, salir } = useSesion();

  const [tiendas, setTiendas]   = useState([]);
  const [perfiles, setPerfiles] = useState({});
  const [cargando, setCargando] = useState(true);
  const [error, setError]       = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [creando, setCreando]   = useState(false);
  const [clavePara, setClavePara] = useState(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    const [{ data: ts, error: e1 }, { data: ps }] = await Promise.all([
      supabase.from("tiendas").select("*").order("creado_en", { ascending: false }),
      supabase.from("perfiles").select("id, email, rol")
    ]);

    if (e1) setError(enCastellano(e1));
    else setError("");

    setTiendas(ts || []);
    setPerfiles(Object.fromEntries((ps || []).map((p) => [p.id, p])));
    setCargando(false);
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  async function cambiar(tienda, campos) {
    const antes = tiendas;
    setTiendas(tiendas.map((t) => (t.id === tienda.id ? { ...t, ...campos } : t)));

    const { error } = await supabase.from("tiendas").update(campos).eq("id", tienda.id);
    if (error) {
      setError(enCastellano(error));
      setTiendas(antes);
    }
  }

  const filtradas = tiendas.filter((t) => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return true;
    const email = perfiles[t.dueno_id]?.email || "";
    return (
      t.nombre.toLowerCase().includes(q) ||
      t.slug.includes(aSlug(q)) ||
      email.toLowerCase().includes(q)
    );
  });

  return (
    <>
      <header className="cabecera">
        <div className="envoltorio cabecera-fila">
          <div className="titulo">Mis clientes</div>
          <button className="boton boton-clarito chico" type="button" onClick={salir}>
            Salir
          </button>
        </div>
      </header>

      <div className="contenido">
        {creando ? (
          <CrearCliente
            onListo={() => { setCreando(false); cargar(); }}
            onCancelar={() => setCreando(false)}
          />
        ) : (
          <div className="bloque">
            <h2 className="bloque-titulo">
              {cargando
                ? "Buscando…"
                : `${tiendas.length} ${tiendas.length === 1 ? "cliente" : "clientes"}`}
            </h2>
            <p className="bloque-nota">
              Entraste como administrador con {sesion?.user?.email}.
            </p>
            <button type="button" className="boton" onClick={() => setCreando(true)}>
              + Crear un cliente
            </button>
          </div>
        )}

        {error && <div className="aviso error" style={{ marginBottom: 16 }}>{error}</div>}

        {tiendas.length > 5 && (
          <div className="bloque" style={{ padding: 12 }}>
            <input
              type="search"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por nombre, dirección o email…"
              aria-label="Buscar cliente"
            />
          </div>
        )}

        {filtradas.map((t) => (
          <div className="bloque" key={t.id}>
            <div className="producto-cabecera">
              <div className="producto-nombre-vista">{t.nombre}</div>
              <span className={"pastilla " + (t.activa ? "verde" : "gris")}>
                {t.activa ? "Publicada" : "De baja"}
              </span>
            </div>

            <div className="campos" style={{ gap: 10 }}>
              <div className="campo">
                <span className="ayuda">Entra con</span>
                <span className="dato-monoespaciado">
                  {perfiles[t.dueno_id]?.email || "—"}
                </span>
              </div>

              <div className="campo">
                <span className="ayuda">Su catálogo</span>
                <a
                  className="dato-monoespaciado"
                  href={linkCatalogo(t.slug)}
                  target="_blank"
                  rel="noreferrer"
                >
                  {linkCatalogoCorto(t.slug)}
                </a>
              </div>

              <div className="campos dos">
                <div className="campo">
                  <label htmlFor={`plan-${t.id}`}>Plan</label>
                  <select
                    id={`plan-${t.id}`}
                    value={t.plan}
                    onChange={(e) => cambiar(t, { plan: e.target.value })}
                  >
                    <option value="autogestion">Autogestión — se maneja solo</option>
                    <option value="full">Full — le cargo yo</option>
                  </select>
                </div>

                <div className="campo">
                  <label htmlFor={`activa-${t.id}`}>Estado</label>
                  <select
                    id={`activa-${t.id}`}
                    value={t.activa ? "si" : "no"}
                    onChange={(e) => cambiar(t, { activa: e.target.value === "si" })}
                  >
                    <option value="si">Publicada</option>
                    <option value="no">De baja</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="fila-botones" style={{ marginTop: 14 }}>
              <Link className="boton chico" to={`/admin/tienda/${t.id}`}>
                Entrar a editar
              </Link>
              <button
                type="button"
                className="boton suave chico"
                onClick={() => setClavePara({ id: t.dueno_id, nombre: t.nombre })}
              >
                Cambiarle la contraseña
              </button>
            </div>
          </div>
        ))}

        {!cargando && tiendas.length === 0 && (
          <div className="bloque">
            <p className="bloque-nota" style={{ margin: 0 }}>
              Todavía no hay ningún cliente. Empezá con el botón de arriba.
            </p>
          </div>
        )}
      </div>

      {clavePara && (
        <CambiarClave
          cliente={clavePara}
          onCerrar={() => setClavePara(null)}
        />
      )}
    </>
  );
}

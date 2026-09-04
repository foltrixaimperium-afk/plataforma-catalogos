import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { traerProductos, traerCategorias } from "../lib/datos";
import { aclarar, normalizarWhatsapp, instagramUrl, plata } from "../lib/formato";
import Tarjeta from "./Tarjeta";
import Visor from "./Visor";
import "../estilos/catalogo.css";

/* Saca acentos y mayúsculas, para que buscar "pantalon" encuentre "Pantalón". */
const limpiar = (t) =>
  (t || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

export default function Catalogo() {
  const { slug } = useParams();

  const [estado, setEstado]         = useState("buscando");
  const [tienda, setTienda]         = useState(null);
  const [productos, setProductos]   = useState([]);
  const [categorias, setCategorias] = useState([]);

  const [categoria, setCategoria] = useState("todo");
  const [busqueda, setBusqueda]   = useState("");
  const [pedido, setPedido]         = useState({});
  const [cantidades, setCantidades] = useState({});
  const [ampliada, setAmpliada]     = useState(null);

  useEffect(() => {
    let vivo = true;
    (async () => {
      const { data: t } = await supabase
        .from("tiendas")
        .select("*")
        .eq("slug", slug)
        .eq("activa", true)
        .maybeSingle();

      if (!vivo) return;
      if (!t) return setEstado("no-existe");

      setTienda(t);
      try {
        const [ps, cs] = await Promise.all([traerProductos(t.id), traerCategorias(t.id)]);
        if (!vivo) return;
        setProductos(ps);
        setCategorias(cs);
      } catch {
        /* Si fallan los productos igual se muestra la tienda, vacía. */
      }
      setEstado("listo");
    })();
    return () => { vivo = false; };
  }, [slug]);

  /* El color de la tienda pinta también el fondo de la página. */
  useEffect(() => {
    if (!tienda) return;
    const antes = document.body.style.background;
    document.body.style.background = aclarar(tienda.color, 0.94);
    document.title = `${tienda.nombre} · Catálogo`;
    return () => { document.body.style.background = antes; };
  }, [tienda]);

  const numero = tienda ? normalizarWhatsapp(tienda.whatsapp) : "";
  const linkWhatsapp = (texto) =>
    `https://wa.me/${numero}?text=${encodeURIComponent(texto)}`;

  /* Solo se ofrecen las categorías que de verdad tienen algo adentro. */
  const categoriasConAlgo = useMemo(() => {
    const usadas = new Set(productos.map((p) => p.categoria_id).filter(Boolean));
    return categorias.filter((c) => usadas.has(c.id));
  }, [categorias, productos]);

  const visibles = useMemo(() => {
    const texto = limpiar(busqueda.trim());
    return productos.filter((p) => {
      if (categoria !== "todo" && p.categoria_id !== categoria) return false;
      if (!texto) return true;
      return limpiar(p.nombre).includes(texto) || limpiar(p.detalle).includes(texto);
    });
  }, [productos, categoria, busqueda]);

  /* ---- El pedido ----
     "pedido" guarda qué productos están adentro; "cantidades" guarda
     cuántos de cada uno. Separarlos deja elegir la cantidad antes de
     agregarlo, que es como funcionaba el catálogo original. */

  function alternar(p) {
    setPedido((antes) => {
      const copia = { ...antes };
      if (copia[p.id]) delete copia[p.id];
      else copia[p.id] = true;
      return copia;
    });
  }

  function cambiarCantidad(p, cantidad) {
    const n = Math.min(99, Math.max(1, cantidad));
    setCantidades((antes) => ({ ...antes, [p.id]: n }));
  }

  const cantidadDe = (id) => cantidades[id] ?? 1;

  const items = productos
    .filter((p) => pedido[p.id])
    .map((p) => ({ ...p, cantidad: cantidadDe(p.id) }));

  const unidades = items.reduce((s, i) => s + i.cantidad, 0);
  const total    = items.reduce((s, i) => s + i.precio * i.cantidad, 0);

  const textoPedido = () => {
    let t = `Hola ${tienda.nombre}, quiero pedir:\n`;
    for (const i of items) {
      const cuenta = i.cantidad > 1 ? ` x${i.cantidad}` : "";
      t += `• ${i.nombre}${cuenta} — ${plata(i.precio * i.cantidad, tienda.moneda)}\n`;
    }
    return t + `\nTotal: ${plata(total, tienda.moneda)}`;
  };

  /* ---- Pantallas ---- */

  if (estado === "buscando") return <div className="cargando">Un segundo…</div>;

  if (estado === "no-existe") {
    return (
      <div className="pantalla-centrada">
        <div className="caja-entrar">
          <h1 className="marca-entrar">No encontramos este catálogo</h1>
          <p className="marca-entrar-nota">
            Puede que el link esté mal escrito o que la tienda ya no esté publicada.
          </p>
        </div>
      </div>
    );
  }

  const ig = instagramUrl(tienda.instagram);

  return (
    <div
      className="catalogo"
      style={{
        "--vino": tienda.color,
        "--vino-claro": aclarar(tienda.color, 0.88),
        "--color-lema": aclarar(tienda.color, 0.78),
        "--fondo": aclarar(tienda.color, 0.94)
      }}
    >
      <header className="cabecera">
        <div className="envoltorio">
          <div className="marca-fila">
            {tienda.logo_url && <img className="logo" src={tienda.logo_url} alt="" />}
            <h1 className="marca">{tienda.nombre}</h1>
          </div>
          {tienda.frase && <p className="lema">{tienda.frase}</p>}
          {(tienda.envios || tienda.horario) && (
            <div className="datos">
              {tienda.envios && <span className="dato">{tienda.envios}</span>}
              {tienda.horario && <span className="dato">{tienda.horario}</span>}
            </div>
          )}
        </div>
      </header>

      {productos.length > 4 && (
        <div className="buscador">
          <input
            type="search"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar en el catálogo…"
            aria-label="Buscar en el catálogo"
          />
          {busqueda && (
            <button
              type="button" className="buscador-borrar"
              aria-label="Borrar la búsqueda" onClick={() => setBusqueda("")}
            >×</button>
          )}
        </div>
      )}

      {categoriasConAlgo.length > 0 && (
        <nav className="filtros" aria-label="Categorías">
          <button
            type="button" className="filtro"
            aria-pressed={categoria === "todo"} onClick={() => setCategoria("todo")}
          >Todo</button>
          {categoriasConAlgo.map((c) => (
            <button
              key={c.id} type="button" className="filtro"
              aria-pressed={categoria === c.id} onClick={() => setCategoria(c.id)}
            >{c.nombre}</button>
          ))}
        </nav>
      )}

      <main className="envoltorio">
        {visibles.length === 0 ? (
          <p className="sin-resultados">
            {productos.length === 0
              ? "Este catálogo todavía no tiene productos cargados."
              : "No encontramos nada con eso. Probá con otra palabra."}
          </p>
        ) : (
          <div className="rejilla">
            {visibles.map((p) => (
              <Tarjeta
                key={p.id}
                producto={p}
                tienda={tienda}
                puesto={!!pedido[p.id]}
                cantidad={cantidadDe(p.id)}
                onAlternar={alternar}
                onCambiarCantidad={cambiarCantidad}
                onAmpliar={(fotos, pos, titulo) => setAmpliada({ fotos, pos, titulo })}
                linkWhatsapp={linkWhatsapp}
              />
            ))}
          </div>
        )}
      </main>

      {(numero || ig) && (
        <div className="contacto">
          {numero && (
            <a
              className="contacto-boton contacto-wa" target="_blank" rel="noopener noreferrer"
              href={linkWhatsapp(`Hola ${tienda.nombre}, te escribo desde el catálogo.`)}
            >
              Escribir por WhatsApp
            </a>
          )}
          {ig && (
            <a className="contacto-boton contacto-ig" href={ig} target="_blank" rel="noopener noreferrer">
              Ver el Instagram
            </a>
          )}
        </div>
      )}

      <p className="pie">{tienda.nombre}</p>

      <div className={"barra" + (items.length ? " visible" : "")} role="region" aria-live="polite">
        <div className="barra-interior">
          <div className="resumen">
            <div className="resumen-linea">
              {unidades === 1 ? "1 artículo" : `${unidades} artículos`}
            </div>
            <div className="resumen-total">{plata(total, tienda.moneda)}</div>
            <button type="button" className="vaciar" onClick={() => setPedido({})}>
              Vaciar pedido
            </button>
          </div>
          <a
            className="enviar" target="_blank" rel="noopener noreferrer"
            href={items.length ? linkWhatsapp(textoPedido()) : "#"}
          >
            Enviar pedido
          </a>
        </div>
      </div>

      {ampliada && (
        <Visor
          fotos={ampliada.fotos}
          pos={ampliada.pos}
          titulo={ampliada.titulo}
          onCerrar={() => setAmpliada(null)}
          onMover={(salto) =>
            setAmpliada((a) => ({
              ...a,
              pos: (a.pos + salto + a.fotos.length) % a.fotos.length
            }))
          }
        />
      )}
    </div>
  );
}

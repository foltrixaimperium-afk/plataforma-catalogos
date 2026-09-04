import { useCallback, useEffect, useState } from "react";
import EditorProducto from "./EditorProducto";
import { traerProductos, traerCategorias, borrarProducto, guardarOrden } from "../lib/datos";
import { enCastellano } from "../lib/supabase";

export default function ListaProductos({ tienda }) {
  const [productos, setProductos]   = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [cargando, setCargando]     = useState(true);
  const [error, setError]           = useState("");
  const [editando, setEditando]     = useState(null); // producto, o "nuevo"

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const [ps, cs] = await Promise.all([
        traerProductos(tienda.id),
        traerCategorias(tienda.id)
      ]);
      setProductos(ps);
      setCategorias(cs);
      setError("");
    } catch (e) {
      setError(enCastellano(e));
    }
    setCargando(false);
  }, [tienda.id]);

  useEffect(() => { cargar(); }, [cargar]);

  const plata = (n) =>
    `${tienda.moneda || "$"} ${Number(n || 0).toLocaleString("es-AR")}`;

  async function mover(indice, salto) {
    const destino = indice + salto;
    if (destino < 0 || destino >= productos.length) return;

    const antes = productos;
    const copia = [...antes];
    [copia[indice], copia[destino]] = [copia[destino], copia[indice]];

    const nuevos = copia.map((p, i) => ({ ...p, orden: i }));
    const cambios = nuevos.filter(
      (p, i) => antes.find((a) => a.id === p.id).orden !== i
    );

    setProductos(nuevos); // se ve al toque, sin esperar a la base

    try {
      await guardarOrden(cambios);
    } catch (e) {
      setError(enCastellano(e));
      cargar();
    }
  }

  async function borrar(p) {
    if (!confirm(`¿Seguro que querés borrar "${p.nombre}"? No se puede deshacer.`)) return;
    try {
      await borrarProducto(p);
      setProductos(productos.filter((x) => x.id !== p.id));
    } catch (e) {
      setError(enCastellano(e));
    }
  }

  if (editando) {
    return (
      <EditorProducto
        tiendaId={tienda.id}
        producto={editando === "nuevo" ? null : editando}
        categorias={categorias}
        orden={productos.length}
        onCategoriaNueva={(c) => setCategorias([...categorias, c])}
        onCancelar={() => setEditando(null)}
        onGuardado={() => { setEditando(null); cargar(); }}
      />
    );
  }

  return (
    <div className="bloque">
      <h2 className="bloque-titulo">Mis productos</h2>
      <p className="bloque-nota">
        {cargando
          ? "Buscando…"
          : productos.length === 0
          ? "Todavía no cargaste ninguno. Empezá por el primero."
          : `Tenés ${productos.length} ${productos.length === 1 ? "producto" : "productos"}. Con las flechas los ordenás: el de arriba es el primero que ve la gente.`}
      </p>

      {error && <div className="aviso error" style={{ marginBottom: 12 }}>{error}</div>}

      {productos.map((p, i) => (
        <div className="fila-producto" key={p.id}>
          <div className="fila-miniatura">
            {p.fotos[0] ? <img src={p.fotos[0].url} alt="" /> : <span>Sin foto</span>}
          </div>

          <div className="fila-datos">
            <div className="fila-nombre">{p.nombre}</div>
            <div className="fila-precio">
              {plata(p.precio)}
              {p.disponible === false && (
                <span className="pastilla gris" style={{ marginLeft: 8 }}>Agotado</span>
              )}
            </div>
            <div className="fila-botones" style={{ marginTop: 8 }}>
              <button type="button" className="boton suave chico" onClick={() => setEditando(p)}>
                Editar
              </button>
              <button type="button" className="boton peligro chico" onClick={() => borrar(p)}>
                Borrar
              </button>
            </div>
          </div>

          <div className="fila-flechas">
            <button
              type="button" className="flecha" aria-label="Subir"
              disabled={i === 0} onClick={() => mover(i, -1)}
            >▲</button>
            <button
              type="button" className="flecha" aria-label="Bajar"
              disabled={i === productos.length - 1} onClick={() => mover(i, 1)}
            >▼</button>
          </div>
        </div>
      ))}

      <button
        type="button"
        className="boton ancho"
        style={{ marginTop: 6 }}
        onClick={() => setEditando("nuevo")}
      >
        + Agregar producto
      </button>
    </div>
  );
}

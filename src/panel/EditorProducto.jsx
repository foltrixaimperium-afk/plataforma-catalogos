import { useState } from "react";
import Fotos from "./Fotos";
import { guardarProducto, crearCategoria } from "../lib/datos";
import { enCastellano } from "../lib/supabase";

const NUEVA = "__nueva__";

export default function EditorProducto({
  tiendaId,
  producto,
  categorias,
  orden,
  onGuardado,
  onCancelar,
  onCategoriaNueva
}) {
  const esNuevo = !producto;

  const [nombre, setNombre]         = useState(producto?.nombre || "");
  const [precio, setPrecio]         = useState(producto ? String(producto.precio) : "");
  const [detalle, setDetalle]       = useState(producto?.detalle || "");
  const [categoria, setCategoria]   = useState(producto?.categoria_id || "");
  const [disponible, setDisponible] = useState(producto ? producto.disponible !== false : true);
  const [fotos, setFotos]           = useState(producto?.fotos || []);
  const [nombreCategoria, setNombreCategoria] = useState("");

  const [guardando, setGuardando] = useState(false);
  const [error, setError]         = useState("");

  const fotosDeAntes = producto?.fotos || [];

  async function guardar(e) {
    e.preventDefault();
    setError("");

    if (!nombre.trim()) return setError("Ponele un nombre al producto.");
    if (categoria === NUEVA && !nombreCategoria.trim())
      return setError("Escribí el nombre de la categoría nueva.");

    setGuardando(true);
    try {
      let categoriaId = categoria === NUEVA ? null : categoria || null;

      if (categoria === NUEVA) {
        const nueva = await crearCategoria(tiendaId, nombreCategoria, categorias.length);
        categoriaId = nueva.id;
        onCategoriaNueva(nueva);
      }

      await guardarProducto(
        tiendaId,
        {
          id: producto?.id,
          nombre,
          precio,
          detalle,
          categoria_id: categoriaId,
          disponible,
          orden: producto?.orden ?? orden
        },
        fotos,
        fotosDeAntes
      );

      onGuardado();
    } catch (err) {
      setError(enCastellano(err));
      setGuardando(false);
    }
  }

  return (
    <form className="bloque" onSubmit={guardar}>
      <h2 className="bloque-titulo">{esNuevo ? "Producto nuevo" : "Editar producto"}</h2>
      <p className="bloque-nota">
        Con el nombre y el precio ya alcanza. Lo demás es opcional.
      </p>

      <div className="campos">
        <Fotos fotos={fotos} onCambio={setFotos} />

        <div className="campo">
          <label htmlFor="nombre">Nombre</label>
          <input
            id="nombre"
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Vestido de lino"
            required
          />
        </div>

        <div className="campo">
          <label htmlFor="precio">Precio</label>
          <input
            id="precio"
            type="number"
            inputMode="numeric"
            min="0"
            step="1"
            value={precio}
            onChange={(e) => setPrecio(e.target.value)}
            placeholder="25000"
          />
          <span className="ayuda">Solo el número, sin el signo $ ni puntos.</span>
        </div>

        <div className="campo">
          <label htmlFor="categoria">Categoría</label>
          <select
            id="categoria"
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
          >
            <option value="">Sin categoría</option>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>{c.nombre}</option>
            ))}
            <option value={NUEVA}>+ Crear una categoría nueva…</option>
          </select>
          <span className="ayuda">
            Sirve para que la gente filtre. Por ejemplo: Vestidos, Carteras, Ofertas.
          </span>
        </div>

        {categoria === NUEVA && (
          <div className="campo">
            <label htmlFor="cat-nueva">Nombre de la categoría nueva</label>
            <input
              id="cat-nueva"
              type="text"
              value={nombreCategoria}
              onChange={(e) => setNombreCategoria(e.target.value)}
              placeholder="Vestidos"
            />
          </div>
        )}

        <div className="campo">
          <label htmlFor="detalle">Descripción</label>
          <textarea
            id="detalle"
            value={detalle}
            onChange={(e) => setDetalle(e.target.value)}
            placeholder="Talle único. Tela liviana, ideal para verano."
          />
        </div>

        <div className="campo">
          <label htmlFor="disponible">¿Está disponible?</label>
          <select
            id="disponible"
            value={disponible ? "si" : "no"}
            onChange={(e) => setDisponible(e.target.value === "si")}
          >
            <option value="si">Sí, se puede pedir</option>
            <option value="no">Agotado por ahora</option>
          </select>
          <span className="ayuda">
            Si está agotado, se sigue viendo en el catálogo pero con el cartel y sin
            botón de pedido.
          </span>
        </div>

        {error && <div className="aviso error">{error}</div>}
      </div>

      <div className="barra-guardar">
        <button type="button" className="boton suave" onClick={onCancelar} disabled={guardando}>
          Cancelar
        </button>
        <button type="submit" className="boton verde" disabled={guardando}>
          {guardando ? "Guardando…" : "Guardar"}
        </button>
      </div>
    </form>
  );
}

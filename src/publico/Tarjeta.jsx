import { useState } from "react";
import { plata } from "../lib/formato";

/* Cuando el producto no tiene foto, en vez de un hueco gris se dibuja
   una silueta con el color de la tienda. Sale de la plantilla original. */
function Silueta() {
  return (
    <svg viewBox="0 0 60 80" fill="none" stroke="var(--vino)"
         strokeWidth="1.6" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 30h36l-4 34H16z" />
      <path d="M22 30v-6a8 8 0 0 1 16 0v6" />
    </svg>
  );
}

export default function Tarjeta({
  producto: p, tienda, puesto, cantidad,
  onAlternar, onCambiarCantidad, onAmpliar, linkWhatsapp
}) {
  const [foto, setFoto] = useState(0);
  const fotos = p.fotos.map((f) => f.url);
  const agotado = p.disponible === false;

  function mostrar(i) {
    setFoto((i + fotos.length) % fotos.length);
  }

  const precio = plata(p.precio, tienda.moneda);

  return (
    <article className={"articulo" + (agotado ? " agotado" : "")}>
      <div className="lienzo">
        {fotos.length ? (
          <img
            src={fotos[foto]}
            alt={p.nombre}
            loading="lazy"
            onClick={() => onAmpliar(fotos, foto, p.nombre)}
          />
        ) : (
          <Silueta />
        )}

        {agotado && <span className="cartel-agotado">Agotado</span>}

        {fotos.length > 1 && (
          <>
            <button
              className="galeria-flecha atras" type="button"
              aria-label="Foto anterior" onClick={() => mostrar(foto - 1)}
            >‹</button>
            <button
              className="galeria-flecha adelante" type="button"
              aria-label="Foto siguiente" onClick={() => mostrar(foto + 1)}
            >›</button>
            <div className="galeria-puntos">
              {fotos.map((_, i) => (
                <button
                  key={i} className="punto" type="button"
                  aria-label={`Foto ${i + 1}`} aria-pressed={i === foto}
                  onClick={() => mostrar(i)}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <div className="cuerpo">
        <h2 className="nombre">{p.nombre}</h2>
        {p.detalle && <p className="detalle">{p.detalle}</p>}
        <p className="precio">{precio}</p>

        <div className="acciones">
          {agotado ? (
            <div className="sin-stock">Agotado por ahora</div>
          ) : (
            <>
              <div className="cantidad">
                <button
                  className="cantidad-boton menos" type="button" aria-label="Quitar uno"
                  onClick={() => onCambiarCantidad(p, cantidad - 1)}
                >−</button>
                <span className="cantidad-numero">{cantidad}</span>
                <button
                  className="cantidad-boton mas" type="button" aria-label="Sumar uno"
                  onClick={() => onCambiarCantidad(p, cantidad + 1)}
                >+</button>
              </div>

              <button
                className={"anadir" + (puesto ? " puesto" : "")}
                type="button"
                onClick={() => onAlternar(p)}
              >
                {puesto ? "Quitar del pedido" : "Añadir al pedido"}
              </button>
            </>
          )}

          {tienda.whatsapp && (
            <a
              className="preguntar" target="_blank" rel="noopener noreferrer"
              href={linkWhatsapp(
                `Hola ${tienda.nombre}, tengo una duda sobre "${p.nombre}" (${precio}).`
              )}
            >
              Preguntar por este
            </a>
          )}
        </div>
      </div>
    </article>
  );
}

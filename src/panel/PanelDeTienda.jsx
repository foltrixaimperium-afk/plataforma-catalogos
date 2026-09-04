import { useState } from "react";
import { linkCatalogo, linkCatalogoCorto } from "../config/sitio";
import ListaProductos from "./ListaProductos";
import MiTienda from "./MiTienda";

/* El panel de carga de una tienda.
   Lo usan las dos partes: el cliente con la suya, y el administrador
   con la de cualquiera. Son exactamente las mismas pantallas, así que
   lo que ve el cliente es lo que ves vos. */

export default function PanelDeTienda({ tienda, onRefrescar, encabezado }) {
  const [solapa, setSolapa]   = useState("productos");
  const [copiado, setCopiado] = useState(false);

  async function copiarLink() {
    try {
      await navigator.clipboard.writeText(linkCatalogo(tienda.slug));
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    } catch {
      prompt("Copiá tu link de acá:", linkCatalogo(tienda.slug));
    }
  }

  return (
    <>
      <header className="cabecera" style={{ background: tienda.color }}>
        <div className="envoltorio">
          {encabezado}

          <div className="pestanas">
            <button
              type="button" className="pestana"
              aria-pressed={solapa === "productos"}
              onClick={() => setSolapa("productos")}
            >
              Mis productos
            </button>
            <button
              type="button" className="pestana"
              aria-pressed={solapa === "tienda"}
              onClick={() => setSolapa("tienda")}
            >
              Mi tienda
            </button>
            <a
              className="pestana"
              href={linkCatalogo(tienda.slug)}
              target="_blank"
              rel="noreferrer"
            >
              Ver el catálogo ↗
            </a>
          </div>
        </div>
      </header>

      <div className="contenido">
        <div className="bloque">
          <h2 className="bloque-titulo">El link</h2>
          <p className="bloque-nota">
            Este es el link que se le pasa a los clientes. Sirve para ponerlo en
            Instagram o mandarlo por WhatsApp.
          </p>
          <div className="fila-botones" style={{ alignItems: "center" }}>
            <span className="dato-monoespaciado">{linkCatalogoCorto(tienda.slug)}</span>
            <button type="button" className="boton chico" onClick={copiarLink}>
              {copiado ? "¡Copiado!" : "Copiar el link"}
            </button>
          </div>
        </div>

        {solapa === "productos" ? (
          <ListaProductos tienda={tienda} />
        ) : (
          <MiTienda tienda={tienda} onGuardada={onRefrescar} />
        )}
      </div>
    </>
  );
}

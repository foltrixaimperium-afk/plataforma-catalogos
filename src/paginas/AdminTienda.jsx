import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { traerTienda } from "../lib/datos";
import { enCastellano } from "../lib/supabase";
import PanelDeTienda from "../panel/PanelDeTienda";

/* Vos entrando a editar la tienda de un cliente.
   Son las mismas pantallas que usa él, con un cartel arriba para que
   no te olvides de en qué tienda estás parado. */

export default function AdminTienda() {
  const { id } = useParams();
  const [tienda, setTienda]   = useState(null);
  const [error, setError]     = useState("");
  const [cargando, setCargando] = useState(true);

  const cargar = useCallback(async () => {
    try {
      setTienda(await traerTienda(id));
      setError("");
    } catch (e) {
      setError(enCastellano(e));
    }
    setCargando(false);
  }, [id]);

  useEffect(() => { cargar(); }, [cargar]);

  if (cargando) return <div className="cargando">Un segundo…</div>;

  if (error || !tienda) {
    return (
      <div className="contenido">
        <div className="bloque">
          <h2 className="bloque-titulo">No encontramos esa tienda</h2>
          <p className="bloque-nota">{error || "Puede que se haya borrado."}</p>
          <Link className="boton suave chico" to="/admin">Volver a la lista</Link>
        </div>
      </div>
    );
  }

  return (
    <PanelDeTienda
      tienda={tienda}
      onRefrescar={cargar}
      encabezado={
        <div className="cabecera-fila">
          <div>
            <div style={{ fontSize: 12.5, opacity: .85, letterSpacing: ".04em" }}>
              ESTÁS EDITANDO LA TIENDA DE UN CLIENTE
            </div>
            <div className="titulo">{tienda.nombre}</div>
          </div>
          <Link className="boton boton-clarito chico" to="/admin">
            ← Volver a mis clientes
          </Link>
        </div>
      }
    />
  );
}

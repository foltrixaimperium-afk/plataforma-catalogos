import { useSesion } from "../auth/Sesion";
import PanelDeTienda from "../panel/PanelDeTienda";

/* El panel del cliente: su propia tienda y nada más. */

export default function Panel() {
  const { sesion, tienda, salir, refrescar } = useSesion();

  if (!tienda) {
    return (
      <>
        <header className="cabecera">
          <div className="envoltorio cabecera-fila">
            <div className="titulo">Tu catálogo</div>
            <button className="boton boton-clarito chico" type="button" onClick={salir}>
              Salir
            </button>
          </div>
        </header>
        <div className="contenido">
          <div className="bloque">
            <h2 className="bloque-titulo">Todavía no tenés tienda</h2>
            <p className="bloque-nota" style={{ margin: 0 }}>
              Entraste con {sesion?.user?.email}, pero nadie te asignó una tienda
              todavía. Avisale al administrador.
            </p>
          </div>
        </div>
      </>
    );
  }

  return (
    <PanelDeTienda
      tienda={tienda}
      onRefrescar={refrescar}
      encabezado={
        <div className="cabecera-fila">
          <div className="titulo">{tienda.nombre}</div>
          <button className="boton boton-clarito chico" type="button" onClick={salir}>
            Salir
          </button>
        </div>
      }
    />
  );
}

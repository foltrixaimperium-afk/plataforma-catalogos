import { Navigate } from "react-router-dom";
import { useSesion } from "./Sesion";

/* Deja pasar solo a quien esté con la sesión iniciada.
   Con soloAdmin, además tiene que ser el administrador. */

export default function RutaProtegida({ children, soloAdmin = false }) {
  const { cargando, sesion, esAdmin } = useSesion();

  if (cargando) return <div className="cargando">Un segundo…</div>;
  if (!sesion)  return <Navigate to="/entrar" replace />;
  if (soloAdmin && !esAdmin) return <Navigate to="/panel" replace />;

  return children;
}

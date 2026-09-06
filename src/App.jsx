import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { faltaConfiguracion } from "./lib/supabase";
import { ProveedorSesion, useSesion } from "./auth/Sesion";
import RutaProtegida from "./auth/RutaProtegida";
import Entrar from "./paginas/Entrar";
import Panel from "./paginas/Panel";
import Admin from "./paginas/Admin";
import AdminCobros from "./paginas/AdminCobros";
import AdminTienda from "./paginas/AdminTienda";
import Catalogo from "./publico/Catalogo";

/* Al entrar a "/" se manda a cada uno a donde corresponde. */
function Inicio() {
  const { cargando, sesion, esAdmin } = useSesion();
  if (cargando) return <div className="cargando">Un segundo…</div>;
  if (!sesion) return <Navigate to="/entrar" replace />;
  return <Navigate to={esAdmin ? "/admin" : "/panel"} replace />;
}

function FaltaEnv() {
  return (
    <div className="pantalla-centrada">
      <div className="caja-entrar">
        <div className="bloque">
          <h2 className="bloque-titulo">Falta conectar la base de datos</h2>
          <p className="bloque-nota">
            Copiá el archivo <span className="dato-monoespaciado">.env.example</span> como{" "}
            <span className="dato-monoespaciado">.env</span> y pegá adentro los dos datos
            de Supabase. Después reiniciá <span className="dato-monoespaciado">npm run dev</span>.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  if (faltaConfiguracion) return <FaltaEnv />;

  return (
    <BrowserRouter>
      <ProveedorSesion>
        <Routes>
          <Route path="/"       element={<Inicio />} />
          <Route path="/entrar" element={<Entrar />} />

          <Route
            path="/panel"
            element={<RutaProtegida><Panel /></RutaProtegida>}
          />
          <Route
            path="/admin"
            element={<RutaProtegida soloAdmin><Admin /></RutaProtegida>}
          />
          <Route
            path="/admin/cobros"
            element={<RutaProtegida soloAdmin><AdminCobros /></RutaProtegida>}
          />
          <Route
            path="/admin/tienda/:id"
            element={<RutaProtegida soloAdmin><AdminTienda /></RutaProtegida>}
          />

          {/* Cualquier otra dirección se toma como el nombre de una tienda.
              Va última a propósito: las de arriba mandan. */}
          <Route path="/:slug" element={<Catalogo />} />
        </Routes>
      </ProveedorSesion>
    </BrowserRouter>
  );
}

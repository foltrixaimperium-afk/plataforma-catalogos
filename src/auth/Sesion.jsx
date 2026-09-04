import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { supabase, faltaConfiguracion } from "../lib/supabase";

/* Guarda quién está adentro: la sesión, su rol y, si es cliente, su tienda.
   Cualquier pantalla puede preguntarlo con useSesion(). */

const Contexto = createContext(null);

export function ProveedorSesion({ children }) {
  const [cargando, setCargando] = useState(true);
  const [sesion, setSesion]     = useState(null);
  const [perfil, setPerfil]     = useState(null);
  const [tienda, setTienda]     = useState(null);

  /* Trae el rol y la tienda del usuario que acaba de entrar. */
  const traerDatos = useCallback(async (usuarioId) => {
    if (!usuarioId) {
      setPerfil(null);
      setTienda(null);
      return;
    }

    let { data: p } = await supabase
      .from("perfiles")
      .select("id, rol, nombre")
      .eq("id", usuarioId)
      .maybeSingle();

    /* Si la cuenta se creó antes de instalar la base, no tiene perfil.
       Se le arma uno de cliente y sigue como si nada. */
    if (!p) {
      const { data: nuevo } = await supabase
        .from("perfiles")
        .insert({ id: usuarioId, rol: "cliente" })
        .select("id, rol, nombre")
        .maybeSingle();
      p = nuevo;
    }

    setPerfil(p || { id: usuarioId, rol: "cliente", nombre: "" });

    const { data: t } = await supabase
      .from("tiendas")
      .select("*")
      .eq("dueno_id", usuarioId)
      .maybeSingle();

    setTienda(t || null);
  }, []);

  useEffect(() => {
    if (faltaConfiguracion) {
      setCargando(false);
      return;
    }

    let vivo = true;

    supabase.auth.getSession().then(async ({ data }) => {
      if (!vivo) return;
      setSesion(data.session);
      await traerDatos(data.session?.user?.id);
      if (vivo) setCargando(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange(async (_evento, nueva) => {
      if (!vivo) return;
      setSesion(nueva);
      await traerDatos(nueva?.user?.id);
      if (vivo) setCargando(false);
    });

    return () => {
      vivo = false;
      sub.subscription.unsubscribe();
    };
  }, [traerDatos]);

  const salir = useCallback(async () => {
    await supabase.auth.signOut();
    setSesion(null);
    setPerfil(null);
    setTienda(null);
  }, []);

  const refrescar = useCallback(
    () => traerDatos(sesion?.user?.id),
    [traerDatos, sesion]
  );

  const valor = {
    cargando,
    sesion,
    perfil,
    tienda,
    esAdmin: perfil?.rol === "admin",
    salir,
    refrescar
  };

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useSesion() {
  const v = useContext(Contexto);
  if (!v) throw new Error("useSesion tiene que usarse adentro de ProveedorSesion");
  return v;
}

import { useRef, useState } from "react";
import { guardarTienda } from "../lib/datos";
import { subir, rutaLogo } from "../lib/almacen";
import { achicarArchivo } from "../lib/imagenes";
import { normalizarWhatsapp, contrasteConBlanco } from "../lib/formato";
import { enCastellano } from "../lib/supabase";

export default function MiTienda({ tienda, onGuardada }) {
  const [f, setF] = useState({
    nombre:    tienda.nombre || "",
    frase:     tienda.frase || "",
    whatsapp:  tienda.whatsapp || "",
    instagram: tienda.instagram || "",
    envios:    tienda.envios || "",
    horario:   tienda.horario || "",
    moneda:    tienda.moneda || "$",
    color:     tienda.color || "#1E7CAB"
  });
  const [logo, setLogo]           = useState(tienda.logo_url || "");
  const [logoBlob, setLogoBlob]   = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [error, setError]         = useState("");
  const [bien, setBien]           = useState("");
  const entradaLogo = useRef(null);

  const cambiar = (campo) => (e) => {
    setF({ ...f, [campo]: e.target.value });
    setBien("");
  };

  const numeroFinal = normalizarWhatsapp(f.whatsapp);
  const colorFlojo  = contrasteConBlanco(f.color) < 4.5;

  async function elegirLogo(e) {
    const archivo = e.target.files[0];
    e.target.value = "";
    if (!archivo) return;
    try {
      const { dataUrl, blob } = await achicarArchivo(archivo, 400);
      setLogo(dataUrl);
      setLogoBlob(blob);
      setBien("");
    } catch {
      setError("No pudimos leer esa imagen. Probá con otra.");
    }
  }

  async function guardar(e) {
    e.preventDefault();
    setError("");
    setBien("");

    if (!f.nombre.trim()) return setError("Tu tienda necesita un nombre.");

    setGuardando(true);
    try {
      let logo_url = tienda.logo_url;
      if (logoBlob) {
        logo_url = await subir(rutaLogo(tienda.id, logoBlob), logoBlob);
      }

      await guardarTienda(tienda.id, {
        nombre:    f.nombre.trim(),
        frase:     f.frase.trim() || null,
        whatsapp:  f.whatsapp.trim() || null,
        instagram: f.instagram.trim() || null,
        envios:    f.envios.trim() || null,
        horario:   f.horario.trim() || null,
        moneda:    f.moneda,
        color:     f.color,
        logo_url
      });

      setLogoBlob(null);
      setBien("Listo, se guardó.");
      onGuardada();
    } catch (err) {
      setError(enCastellano(err));
    }
    setGuardando(false);
  }

  return (
    <form className="bloque" onSubmit={guardar}>
      <h2 className="bloque-titulo">Mi tienda</h2>
      <p className="bloque-nota">
        Esto es lo que ve la gente cuando abre tu catálogo.
      </p>

      <div className="campos">
        <div className="campo">
          <label>Logo</label>
          <span className="ayuda">
            Opcional. Es la imagen que aparece arriba y la que se ve cuando
            compartís el link por WhatsApp.
          </span>
          <div className="fotos-tira">
            {logo && (
              <div className="foto-chip" style={{ aspectRatio: "1/1" }}>
                <img src={logo} alt="" style={{ objectFit: "contain", background: "#fff" }} />
                <button
                  type="button" className="foto-borrar" aria-label="Sacar el logo"
                  onClick={() => { setLogo(""); setLogoBlob(null); }}
                >×</button>
              </div>
            )}
            <button
              type="button" className="foto-vacia" style={{ aspectRatio: "1/1" }}
              onClick={() => entradaLogo.current.click()}
            >
              {logo ? "Cambiar" : "+ Subir logo"}
            </button>
          </div>
          <input ref={entradaLogo} type="file" accept="image/*" hidden onChange={elegirLogo} />
        </div>

        <div className="campo">
          <label htmlFor="t-nombre">Nombre de tu tienda</label>
          <input id="t-nombre" type="text" value={f.nombre} onChange={cambiar("nombre")} required />
        </div>

        <div className="campo">
          <label htmlFor="t-frase">En una frase, ¿qué vendés?</label>
          <input
            id="t-frase" type="text" value={f.frase} onChange={cambiar("frase")}
            placeholder="Maquillaje y accesorios"
          />
        </div>

        <div className="campo">
          <label htmlFor="t-wa">Tu WhatsApp</label>
          <input
            id="t-wa" type="text" inputMode="numeric" value={f.whatsapp}
            onChange={cambiar("whatsapp")} placeholder="2604806530"
          />
          <span className="ayuda">
            {numeroFinal
              ? `Los pedidos te van a llegar al ${numeroFinal}.`
              : "Con característica, sin el 0 ni el 15."}
          </span>
        </div>

        <div className="campo">
          <label htmlFor="t-ig">Tu Instagram</label>
          <input
            id="t-ig" type="text" value={f.instagram} onChange={cambiar("instagram")}
            placeholder="tu.usuario" autoCapitalize="off" spellCheck="false"
          />
          <span className="ayuda">Opcional. Solo el usuario, sin el arroba.</span>
        </div>

        <div className="campos dos">
          <div className="campo">
            <label htmlFor="t-envios">Envíos</label>
            <input
              id="t-envios" type="text" value={f.envios} onChange={cambiar("envios")}
              placeholder="Envíos a toda la provincia"
            />
          </div>
          <div className="campo">
            <label htmlFor="t-horario">Horario</label>
            <input
              id="t-horario" type="text" value={f.horario} onChange={cambiar("horario")}
              placeholder="Lunes a viernes de 9 a 18"
            />
          </div>
        </div>

        <div className="campos dos">
          <div className="campo">
            <label htmlFor="t-moneda">Moneda</label>
            <select id="t-moneda" value={f.moneda} onChange={cambiar("moneda")}>
              <option value="$">$ — pesos</option>
              <option value="US$">US$ — dólares</option>
              <option value="€">€ — euros</option>
            </select>
          </div>
          <div className="campo">
            <label htmlFor="t-color">Color principal</label>
            <input
              id="t-color" type="color" value={f.color} onChange={cambiar("color")}
              style={{
                height: 46, padding: 4, border: "1px solid var(--borde)",
                borderRadius: 10, background: "#fff", width: "100%"
              }}
            />
            <span className="ayuda">
              {colorFlojo
                ? "Ojo: con este color el texto blanco de arriba se lee poco. Probá uno más oscuro."
                : "El color de la cabecera y los detalles."}
            </span>
          </div>
        </div>

        {error && <div className="aviso error">{error}</div>}
        {bien && <div className="aviso bien">{bien}</div>}
      </div>

      <div className="barra-guardar">
        <button type="submit" className="boton verde" disabled={guardando}>
          {guardando ? "Guardando…" : "Guardar cambios"}
        </button>
      </div>
    </form>
  );
}

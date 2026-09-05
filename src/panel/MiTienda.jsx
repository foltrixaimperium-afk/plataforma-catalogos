import { useRef, useState } from "react";
import { guardarTienda } from "../lib/datos";
import { subir, rutaLogo, rutaLogoOriginal, rutaDesdeUrl } from "../lib/almacen";
import { achicarArchivo, recortar, MEDIDA_LOGO } from "../lib/imagenes";
import { normalizarWhatsapp, contrasteConBlanco } from "../lib/formato";
import { enCastellano } from "../lib/supabase";
import Recortador from "./Recortador";

/** Trae una imagen ya guardada para poder volver a encuadrarla. */
function urlADataUrl(url) {
  return fetch(url)
    .then((r) => r.blob())
    .then(
      (b) =>
        new Promise((ok, err) => {
          const lector = new FileReader();
          lector.onload = () => ok(lector.result);
          lector.onerror = err;
          lector.readAsDataURL(b);
        })
    );
}

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
  /* El logo se maneja igual que las fotos de producto: se guarda el
     original y cómo quedó encuadrado, para poder reacomodarlo después
     sin volver a subirlo. */
  const [logo, setLogo]                 = useState(tienda.logo_url || "");
  const [logoBlob, setLogoBlob]         = useState(null);
  const [logoOriginal, setLogoOriginal] = useState(null);   // dataURL para reencuadrar
  const [logoOriginalBlob, setLogoOriginalBlob] = useState(null);
  const [logoEncuadre, setLogoEncuadre] = useState(tienda.logo_encuadre || null);
  const [recortando, setRecortando]     = useState(null);
  const [trabajando, setTrabajando]     = useState("");

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

    setTrabajando("Preparando la imagen…");
    try {
      const original = await achicarArchivo(archivo);
      setLogoOriginal(original.dataUrl);
      setLogoOriginalBlob(original.blob);
      setBien("");
      /* Arranca con la imagen entera: en un logo, cortar suele ser peor. */
      setRecortando({ dataUrl: original.dataUrl, encuadre: null });
    } catch {
      setError("No pudimos leer esa imagen. Probá con otra.");
    }
    setTrabajando("");
  }

  /** Volver a encuadrar el logo que ya está guardado. */
  async function acomodarLogo() {
    if (logoOriginal) {
      setRecortando({ dataUrl: logoOriginal, encuadre: logoEncuadre });
      return;
    }
    if (!tienda.logo_url_original) {
      setError("Este logo es de antes y no se puede reacomodar. Subilo de nuevo.");
      return;
    }
    setTrabajando("Buscando la imagen…");
    try {
      const dataUrl = await urlADataUrl(tienda.logo_url_original);
      setLogoOriginal(dataUrl);
      setRecortando({ dataUrl, encuadre: logoEncuadre });
    } catch {
      setError("No pudimos traer la imagen. Revisá la conexión.");
    }
    setTrabajando("");
  }

  async function confirmarRecorte(encuadre) {
    const { dataUrl } = recortando;
    setRecortando(null);
    setTrabajando("Acomodando…");
    const { blob } = await recortar(dataUrl, encuadre, MEDIDA_LOGO);
    setLogo(URL.createObjectURL(blob));
    setLogoBlob(blob);
    setLogoEncuadre(encuadre);
    setTrabajando("");
  }

  function sacarLogo() {
    setLogo("");
    setLogoBlob(null);
    setLogoOriginal(null);
    setLogoOriginalBlob(null);
    setLogoEncuadre(null);
  }

  async function guardar(e) {
    e.preventDefault();
    setError("");
    setBien("");

    if (!f.nombre.trim()) return setError("Tu tienda necesita un nombre.");

    setGuardando(true);
    try {
      let logo_url          = logo ? tienda.logo_url : null;
      let logo_url_original = logo ? tienda.logo_url_original : null;

      if (logoBlob) {
        const ruta = rutaDesdeUrl(tienda.logo_url) || rutaLogo(tienda.id, logoBlob);
        logo_url = await subir(ruta, logoBlob);
      }
      if (logoOriginalBlob) {
        const ruta = rutaDesdeUrl(tienda.logo_url_original)
                  || rutaLogoOriginal(tienda.id, logoOriginalBlob);
        logo_url_original = await subir(ruta, logoOriginalBlob);
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
        logo_url,
        logo_url_original,
        logo_encuadre: logo ? logoEncuadre : null
      });

      setLogoBlob(null);
      setLogoOriginalBlob(null);
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
              <div className="foto-chip" style={{ aspectRatio: "1/1", width: 116 }}>
                <img src={logo} alt="" style={{ background: "#fff" }} />
                <button
                  type="button" className="foto-borrar" aria-label="Sacar el logo"
                  onClick={sacarLogo}
                >×</button>
                <div className="foto-acciones">
                  <button type="button" onClick={acomodarLogo}>Acomodar</button>
                </div>
              </div>
            )}
            <button
              type="button" className="foto-vacia" style={{ aspectRatio: "1/1", width: 116 }}
              onClick={() => entradaLogo.current.click()}
            >
              {logo ? "Cambiar" : "+ Subir logo"}
            </button>
          </div>

          {trabajando && <div className="aviso" style={{ marginTop: 10 }}>{trabajando}</div>}

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

      {recortando && (
        <Recortador
          dataUrl={recortando.dataUrl}
          encuadre={recortando.encuadre}
          medida={MEDIDA_LOGO}
          enteraPorDefecto
          titulo="Acomodá tu logo"
          nota="Movelo con el dedo y agrandalo con la barrita. Si es un logo con letras, conviene dejarlo entero con fondo blanco."
          onCancelar={() => setRecortando(null)}
          onListo={confirmarRecorte}
        />
      )}
    </form>
  );
}

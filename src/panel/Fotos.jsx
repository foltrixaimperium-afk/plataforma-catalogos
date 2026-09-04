import { useRef, useState } from "react";
import { achicarArchivo, recortar } from "../lib/imagenes";
import Recortador from "./Recortador";

/* La tira de fotos del producto.
   Todo pasa en el celular: se achican, se encuadran y recién se suben
   cuando el cliente toca Guardar. */

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

export default function Fotos({ fotos, onCambio }) {
  const entrada = useRef(null);
  const [trabajando, setTrabajando] = useState("");
  const [recortando, setRecortando] = useState(null); // { id, dataUrl, encuadre }

  async function alElegirArchivos(e) {
    const archivos = [...e.target.files];
    e.target.value = "";
    if (!archivos.length) return;

    const nuevas = [];
    for (let i = 0; i < archivos.length; i++) {
      setTrabajando(`Preparando la foto ${i + 1} de ${archivos.length}…`);
      try {
        const original = await achicarArchivo(archivos[i]);
        const { blob, encuadre } = await recortar(original.dataUrl, null);
        nuevas.push({
          id: crypto.randomUUID(),
          nueva: true,
          vista: URL.createObjectURL(blob),
          dataUrlOriginal: original.dataUrl,
          blobOriginal: original.blob,
          blobRecortada: blob,
          encuadre
        });
      } catch {
        setTrabajando("");
        alert("No pudimos leer una de las fotos. Probá con otra.");
        return;
      }
    }
    setTrabajando("");

    const todas = [...fotos, ...nuevas];
    onCambio(todas);

    /* Se abre la última para encuadrar, así se entiende que se puede. */
    const ultima = nuevas[nuevas.length - 1];
    setRecortando({ id: ultima.id, dataUrl: ultima.dataUrlOriginal, encuadre: ultima.encuadre });
  }

  async function abrirRecorte(foto) {
    if (foto.dataUrlOriginal) {
      setRecortando({ id: foto.id, dataUrl: foto.dataUrlOriginal, encuadre: foto.encuadre });
      return;
    }
    if (!foto.urlOriginal) {
      alert("Esta foto es de antes y no se puede volver a acomodar. Subila de nuevo.");
      return;
    }
    setTrabajando("Buscando la foto…");
    try {
      const dataUrl = await urlADataUrl(foto.urlOriginal);
      onCambio(fotos.map((f) => (f.id === foto.id ? { ...f, dataUrlOriginal: dataUrl } : f)));
      setRecortando({ id: foto.id, dataUrl, encuadre: foto.encuadre });
    } catch {
      alert("No pudimos traer la foto. Revisá la conexión.");
    }
    setTrabajando("");
  }

  async function confirmarRecorte(encuadre) {
    const { id, dataUrl } = recortando;
    setRecortando(null);
    setTrabajando("Guardando el encuadre…");
    const { blob } = await recortar(dataUrl, encuadre);
    onCambio(
      fotos.map((f) =>
        f.id === id
          ? { ...f, encuadre, blobRecortada: blob, vista: URL.createObjectURL(blob), recortada: true }
          : f
      )
    );
    setTrabajando("");
  }

  function borrarFoto(id) {
    onCambio(fotos.filter((f) => f.id !== id));
  }

  function mover(indice, salto) {
    const destino = indice + salto;
    if (destino < 0 || destino >= fotos.length) return;
    const copia = [...fotos];
    [copia[indice], copia[destino]] = [copia[destino], copia[indice]];
    onCambio(copia);
  }

  return (
    <div className="campo">
      <label>Fotos</label>
      <span className="ayuda">
        La primera es la que se ve en el catálogo. Podés poner varias y ordenarlas.
      </span>

      <div className="fotos-tira">
        {fotos.map((f, i) => (
          <div className="foto-chip" key={f.id}>
            <img src={f.vista || f.url} alt="" />
            <button
              type="button"
              className="foto-borrar"
              aria-label="Sacar esta foto"
              onClick={() => borrarFoto(f.id)}
            >
              ×
            </button>
            <div className="foto-acciones">
              <button type="button" disabled={i === 0} onClick={() => mover(i, -1)} aria-label="Mover antes">
                ‹
              </button>
              <button type="button" onClick={() => abrirRecorte(f)}>
                Acomodar
              </button>
              <button
                type="button"
                disabled={i === fotos.length - 1}
                onClick={() => mover(i, 1)}
                aria-label="Mover después"
              >
                ›
              </button>
            </div>
          </div>
        ))}

        <button type="button" className="foto-vacia" onClick={() => entrada.current.click()}>
          + Agregar
          <br />
          foto
        </button>
      </div>

      {trabajando && <div className="aviso" style={{ marginTop: 10 }}>{trabajando}</div>}

      <input
        ref={entrada}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={alElegirArchivos}
      />

      {recortando && (
        <Recortador
          dataUrl={recortando.dataUrl}
          encuadre={recortando.encuadre}
          onCancelar={() => setRecortando(null)}
          onListo={confirmarRecorte}
        />
      )}
    </div>
  );
}

import { useEffect, useRef, useState } from "react";
import {
  ANCHO_FINAL, ALTO_FINAL,
  cargarImagen, encuadreCentrado, dibujarEncuadre, acomodar, aplicarZoom
} from "../lib/imagenes";

/* La pantalla para acomodar la foto adentro del recuadro.
   Es la misma del generador original: se arrastra con el dedo,
   se agranda con la barrita, y se puede elegir entre llenar el
   recuadro o mostrar la foto entera con fondo blanco. */

export default function Recortador({ dataUrl, encuadre, onCancelar, onListo }) {
  const lienzoRef = useRef(null);
  const marcoRef  = useRef(null);
  const imgRef    = useRef(null);
  const encuadreRef = useRef(null);

  const [listaImagen, setListaImagen] = useState(false);
  const [entera, setEntera] = useState(!!encuadre?.entera);
  const [zoom, setZoom]     = useState(Math.round((encuadre?.zoom || 1) * 100));

  function pintar() {
    const img = imgRef.current;
    if (!img || !lienzoRef.current) return;
    acomodar(img, encuadreRef.current);
    dibujarEncuadre(lienzoRef.current.getContext("2d"), img, encuadreRef.current);
  }

  useEffect(() => {
    let vivo = true;
    (async () => {
      const img = await cargarImagen(dataUrl);
      if (!vivo) return;
      imgRef.current = img;
      encuadreRef.current = encuadre ? { ...encuadre } : encuadreCentrado(img, false);
      setEntera(!!encuadreRef.current.entera);
      setZoom(Math.round(encuadreRef.current.zoom * 100));
      setListaImagen(true);
      pintar();
    })();
    return () => { vivo = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataUrl]);

  /* Al cambiar de modo la foto se acomoda de nuevo, centrada y sin zoom. */
  function elegirModo(nuevoEntera) {
    const img = imgRef.current;
    if (!img || entera === nuevoEntera) return;
    encuadreRef.current = encuadreCentrado(img, nuevoEntera);
    setEntera(nuevoEntera);
    setZoom(100);
    pintar();
  }

  function cambiarZoom(valor) {
    const img = imgRef.current;
    if (!img) return;
    encuadreRef.current = aplicarZoom(img, encuadreRef.current, valor / 100);
    setZoom(valor);
    pintar();
  }

  /* Arrastrar con el dedo o con el mouse. */
  const arrastre = useRef({ activo: false, x: 0, y: 0 });

  function alBajar(e) {
    arrastre.current = { activo: true, x: e.clientX, y: e.clientY };
    marcoRef.current.setPointerCapture(e.pointerId);
  }
  function alMover(e) {
    if (!arrastre.current.activo || !imgRef.current) return;
    const caja = marcoRef.current.getBoundingClientRect();
    encuadreRef.current.x += (e.clientX - arrastre.current.x) * (ANCHO_FINAL / caja.width);
    encuadreRef.current.y += (e.clientY - arrastre.current.y) * (ALTO_FINAL  / caja.height);
    arrastre.current.x = e.clientX;
    arrastre.current.y = e.clientY;
    pintar();
  }
  function alSoltar() {
    arrastre.current.activo = false;
  }

  return (
    <div className="velo" onClick={(e) => { if (e.target === e.currentTarget) onCancelar(); }}>
      <div className="recortador">
        <h3>Acomodá la foto</h3>
        <p className="nota">
          Movela con el dedo y agrandala con la barrita, hasta que se vea como querés.
        </p>

        <div
          className="marco"
          ref={marcoRef}
          onPointerDown={alBajar}
          onPointerMove={alMover}
          onPointerUp={alSoltar}
          onPointerCancel={alSoltar}
          onPointerLeave={alSoltar}
        >
          <canvas ref={lienzoRef} width={ANCHO_FINAL} height={ALTO_FINAL} />
        </div>

        <div className="zoom">
          <label htmlFor="zoom">Tamaño</label>
          <input
            id="zoom"
            type="range"
            min="100"
            max="400"
            value={zoom}
            onChange={(e) => cambiarZoom(Number(e.target.value))}
          />
        </div>

        <div className="modos">
          <button
            type="button"
            className={"boton suave" + (entera ? "" : " elegido")}
            onClick={() => elegirModo(false)}
          >
            Llenar el recuadro
          </button>
          <button
            type="button"
            className={"boton suave" + (entera ? " elegido" : "")}
            onClick={() => elegirModo(true)}
          >
            Foto entera, con fondo blanco
          </button>
        </div>

        <div className="recorte-botones">
          <button type="button" className="boton suave" onClick={onCancelar}>
            Cancelar
          </button>
          <button
            type="button"
            className="boton verde"
            disabled={!listaImagen}
            onClick={() => onListo({ ...encuadreRef.current })}
          >
            Listo
          </button>
        </div>
      </div>
    </div>
  );
}

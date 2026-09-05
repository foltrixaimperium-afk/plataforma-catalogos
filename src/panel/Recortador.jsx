import { useEffect, useRef, useState } from "react";
import {
  MEDIDA_PRODUCTO,
  cargarImagen, encuadreCentrado, dibujarEncuadre, acomodar, aplicarZoom
} from "../lib/imagenes";

/* La pantalla para acomodar una imagen adentro del recuadro.
   Es la misma del generador original: se arrastra con el dedo,
   se agranda con la barrita, y se puede elegir entre llenar el
   recuadro o mostrar la imagen entera con fondo blanco.

   Sirve igual para las fotos de producto (verticales) y para el
   logo (cuadrado): la medida entra por parámetro. */

export default function Recortador({
  dataUrl,
  encuadre,
  medida = MEDIDA_PRODUCTO,
  enteraPorDefecto = false,
  titulo = "Acomodá la foto",
  nota = "Movela con el dedo y agrandala con la barrita, hasta que se vea como querés.",
  onCancelar,
  onListo
}) {
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
    acomodar(img, encuadreRef.current, medida);
    dibujarEncuadre(lienzoRef.current.getContext("2d"), img, encuadreRef.current, medida);
  }

  useEffect(() => {
    let vivo = true;
    (async () => {
      const img = await cargarImagen(dataUrl);
      if (!vivo) return;
      imgRef.current = img;
      encuadreRef.current = encuadre
        ? { ...encuadre }
        : encuadreCentrado(img, enteraPorDefecto, medida);
      setEntera(!!encuadreRef.current.entera);
      setZoom(Math.round(encuadreRef.current.zoom * 100));
      setListaImagen(true);
      pintar();
    })();
    return () => { vivo = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataUrl]);

  /* Al cambiar de modo la imagen se acomoda de nuevo, centrada y sin zoom. */
  function elegirModo(nuevoEntera) {
    const img = imgRef.current;
    if (!img || entera === nuevoEntera) return;
    encuadreRef.current = encuadreCentrado(img, nuevoEntera, medida);
    setEntera(nuevoEntera);
    setZoom(100);
    pintar();
  }

  function cambiarZoom(valor) {
    const img = imgRef.current;
    if (!img) return;
    encuadreRef.current = aplicarZoom(img, encuadreRef.current, valor / 100, medida);
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
    encuadreRef.current.x += (e.clientX - arrastre.current.x) * (medida.ancho / caja.width);
    encuadreRef.current.y += (e.clientY - arrastre.current.y) * (medida.alto  / caja.height);
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
        <h3>{titulo}</h3>
        <p className="nota">{nota}</p>

        <div
          className="marco"
          ref={marcoRef}
          style={{ aspectRatio: `${medida.ancho} / ${medida.alto}` }}
          onPointerDown={alBajar}
          onPointerMove={alMover}
          onPointerUp={alSoltar}
          onPointerCancel={alSoltar}
          onPointerLeave={alSoltar}
        >
          <canvas ref={lienzoRef} width={medida.ancho} height={medida.alto} />
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
            Entera, con fondo blanco
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

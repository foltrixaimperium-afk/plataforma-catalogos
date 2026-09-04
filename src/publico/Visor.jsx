import { useEffect } from "react";

/* La foto ampliada a pantalla completa, con flechas para pasar. */

export default function Visor({ fotos, pos, titulo, onCerrar, onMover }) {
  useEffect(() => {
    function tecla(e) {
      if (e.key === "Escape") onCerrar();
      if (e.key === "ArrowLeft") onMover(-1);
      if (e.key === "ArrowRight") onMover(1);
    }
    document.addEventListener("keydown", tecla);
    return () => document.removeEventListener("keydown", tecla);
  }, [onCerrar, onMover]);

  const hayVarias = fotos.length > 1;

  return (
    <div
      className="visor"
      role="dialog"
      aria-modal="true"
      aria-label="Foto ampliada"
      onClick={(e) => { if (e.target === e.currentTarget) onCerrar(); }}
    >
      <button className="visor-boton visor-cerrar" type="button" aria-label="Cerrar" onClick={onCerrar}>
        ×
      </button>

      {hayVarias && (
        <button
          className="visor-boton visor-flecha atras" type="button"
          aria-label="Foto anterior" onClick={() => onMover(-1)}
        >‹</button>
      )}

      <img src={fotos[pos]} alt={titulo} />

      {hayVarias && (
        <button
          className="visor-boton visor-flecha adelante" type="button"
          aria-label="Foto siguiente" onClick={() => onMover(1)}
        >›</button>
      )}

      <div className="visor-pie">
        {titulo}
        {hayVarias && (
          <span className="visor-contador">{pos + 1} / {fotos.length}</span>
        )}
      </div>
    </div>
  );
}

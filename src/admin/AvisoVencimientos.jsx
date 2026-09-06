import { Link } from "react-router-dom";
import { estado, fechaLinda, porVencimiento } from "../lib/cobros";

/* El cartel que te dice cómo venís, sin que tengas que buscar nada.
 * Aparece arriba de todo en "Mis clientes" y en "Vencimientos". */
export default function AvisoVencimientos({ tiendas, conLink = true }) {
  const vencidos = tiendas.filter((t) => estado(t.vence) === "vencido");
  const pronto   = tiendas.filter((t) => estado(t.vence) === "pronto");

  let tono = "bien";
  let titulo;
  let detalle = "";

  if (!tiendas.length) return null;

  if (vencidos.length) {
    tono = "error";
    titulo = vencidos.length === 1
      ? "Tenés 1 cobro atrasado."
      : `Tenés ${vencidos.length} cobros atrasados.`;
    detalle = pronto.length
      ? `Y a ${pronto.length} ${pronto.length === 1 ? "cliente le vence" : "clientes les vence"} esta semana.`
      : "Ninguno más vence esta semana.";
  } else if (pronto.length) {
    tono = "atencion";
    titulo = pronto.length === 1
      ? "A 1 cliente le vence esta semana."
      : `A ${pronto.length} clientes les vence esta semana.`;
    detalle = "No tenés nada atrasado.";
  } else {
    const proximo = [...tiendas].sort(porVencimiento).find((t) => t.vence);
    titulo = "Estás al día. No hay nada vencido.";
    detalle = proximo
      ? `El próximo es ${proximo.nombre}, el ${fechaLinda(proximo.vence)}.`
      : "Todavía no le pusiste fecha de vencimiento a ningún cliente.";
  }

  const enLaLista = [...vencidos, ...pronto].sort(porVencimiento);

  return (
    <div className={"aviso " + tono} style={{ marginBottom: 16, padding: "14px 16px" }}>
      <strong style={{ fontSize: 15, display: "block" }}>{titulo}</strong>
      {detalle && <span style={{ display: "block", marginTop: 2 }}>{detalle}</span>}

      {enLaLista.length > 0 && (
        <div className="tira-vencen">
          {enLaLista.slice(0, 12).map((t) => (
            <span className={"pastilla " + estado(t.vence)} key={t.id}>
              {t.nombre} · {fechaLinda(t.vence)}
            </span>
          ))}
        </div>
      )}

      {conLink && (
        <Link className="boton chico" to="/admin/cobros" style={{ marginTop: 12 }}>
          Ver vencimientos
        </Link>
      )}
    </div>
  );
}

# Etapa 7 — Vencimientos y cobros

Una pantalla nueva dentro del panel, en **tu-catalogo-web.netlify.app/admin/cobros**,
donde ves quién te debe, a quién le vence esta semana y cuánto te pagó cada uno.

Hay **un solo paso** que tenés que hacer vos: correr el archivo de la base de
datos. Sin eso, la pantalla nueva no anda.

---

## 1. Preparar la base de datos

> **Hacé esto primero.** Es un archivo que le agrega tres datos a cada cliente
> (hasta cuándo pagó, cuánto paga, notas) y una tabla nueva para los pagos.
> No toca nada de lo que ya existe.

1. Entrá a **supabase.com** y abrí tu proyecto.
2. En el menú de la izquierda, tocá **SQL Editor** (el ícono de la hoja con
   `>_`).
3. Tocá **+ New query** arriba a la derecha.
4. Abrí el archivo `supabase/etapa-7-cobros.sql` de esta carpeta con el Bloc de
   notas, seleccioná **todo** (Ctrl+E, Ctrl+A) y copialo (Ctrl+C).
5. Pegalo en el recuadro grande de Supabase (Ctrl+V).
6. Tocá **Run** abajo a la derecha (o Ctrl+Enter).
7. Tiene que decir **Success. No rows returned**. Eso está bien: quiere decir
   que hizo todo y no tenía nada que mostrar.

> Si el editor de Supabase se te ve raro o no te deja escribir, es el traductor
> automático del navegador. Tocá el ícono del traductor en la barra de
> direcciones y elegí **Mostrar siempre en su idioma original**.

## 2. Nada más

El código ya está subido. Netlify lo publica solo en un par de minutos.

---

## Cómo se usa

Entrá a **tu-catalogo-web.netlify.app/admin** como siempre.

### El aviso

Arriba de todo, apenas entrás, aparece un cartel:

- **Rojo** — tenés cobros atrasados, con los nombres al lado
- **Amarillo** — a alguien le vence esta semana
- **Verde** — está todo al día, y te dice cuál es el próximo

Los nombres del cartel son los que tenés que ir a buscar. Tocá
**Ver vencimientos** y estás en la pantalla completa.

### La pantalla de vencimientos

Cada cliente tiene su ficha, ordenadas por el que vence primero. La rayita de
la izquierda es el semáforo: roja vencido, amarilla esta semana, verde
tranquilo.

En cada ficha cargás:

| Dato | Para qué |
|---|---|
| **Le vence el** | La fecha. Es lo único imprescindible. |
| **Cuánto te paga** | Se usa como monto sugerido cuando cobrás. |
| **Notas del cobro** | "Paga por transferencia", "avisarle 3 días antes"… |

Se guardan solos, sin botón de guardar.

### Cuando te pagan

Tocá **Cobré**. Se abre una ventanita con la fecha de hoy y el monto que suele
pagar, ya puestos. Elegís **+1 mes**, **+3 meses** o **+1 año** y el
vencimiento se corre solo.

Los botones cuentan desde el vencimiento anterior, no desde hoy: si te pagó
tarde, no le regalás los días. Salvo que ya estuviera vencido, ahí cuentan
desde hoy — y la ventanita te lo aclara.

El pago queda anotado. Tocá **Pagos** en la ficha y ves el historial completo
con el total que te pagó ese cliente desde siempre.

### Escribirle

El botón **Escribirle por WhatsApp** abre el chat con el mensaje ya escrito,
recordándole el vencimiento y con el link de su catálogo. Vos lo leés y lo
mandás — nada se manda solo.

Usa el WhatsApp que ya tenías cargado en su tienda. Si el botón no aparece, es
que ese cliente no tiene número cargado.

---

## Dos cosas que conviene saber

**Los pagos son tuyos y de nadie más.** La base de datos no deja que ningún
cliente lea la tabla de pagos, ni aunque manipule el navegador.

**El cliente sí ve su fecha de vencimiento** si se pone a mirar, pero no la
puede cambiar. Es la fecha hasta la que pagó, así que no es ningún secreto.

---

## Lo que no hace

El aviso es **al entrar al panel**, no te llega solo al celular. Si más
adelante querés que te avise por WhatsApp o por mail sin que entres, se puede
armar, pero es otra etapa: hace falta algo que corra solo todos los días.

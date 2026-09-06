# Plataforma de catálogos

Un solo sitio, muchos catálogos. Cada cliente tiene el suyo en
`misitio.com/nombre-de-su-tienda`, lo edita solo desde el celular, y los
pedidos le llegan por WhatsApp.

**En vivo:** https://tu-catalogo-web.netlify.app

---

## La dirección del sitio se escribe en un solo lugar

En `netlify.toml`:

```toml
[build.environment]
  VITE_SITE_URL = "https://tu-sitio.netlify.app"
```

**Esa es la única línea del proyecto que menciona el dominio.** Cuando compres
el tuyo, la cambiás ahí y funciona todo: los links que se copian, las
miniaturas de WhatsApp, todo.

En tu computadora ni hace falta: si la variable no está, se usa `localhost`.

Quien lee esa línea es `src/config/sitio.js`, y nadie más.

---

## Cómo está armado

| Parte | Dónde |
|---|---|
| Pantallas del cliente y del admin | `src/` |
| Catálogo público | `src/publico/` |
| Vencimientos y cobros | `src/paginas/AdminCobros.jsx` |
| Base de datos y sus candados | `supabase/schema.sql` |
| Alta de cuentas (corre en Supabase) | `supabase/functions/admin-clientes/` |
| Miniatura de WhatsApp (corre en Netlify) | `netlify/edge-functions/og.js` |
| Diseño original del que salió todo | `referencia/` |

**Stack:** React + Vite, Supabase (cuentas, base de datos y fotos), Netlify.

---

## Las direcciones

| Dirección | Qué es |
|---|---|
| `/entrar` | Iniciar sesión |
| `/panel` | El panel del cliente |
| `/admin` | La lista de clientes |
| `/admin/cobros` | Vencimientos, cobros e historial de pagos |
| `/admin/tienda/:id` | Editar la tienda de un cliente |
| `/:slug` | El catálogo público |

`entrar`, `panel` y `admin` están reservadas: ningún cliente puede quedarse con
esos nombres. La base de datos lo hace cumplir.

---

## Para trabajar en tu computadora

```bash
npm install
npm run dev
```

Hace falta un archivo `.env` con dos datos de Supabase (mirá `.env.example`).
Ese archivo no se sube a GitHub.

---

## Los candados

Las reglas de quién puede ver y tocar qué **viven en la base de datos**, no en
la página. Aunque alguien manipule el navegador, la base lo rechaza igual.

- El público lee las tiendas publicadas, y nada más
- Cada cliente escribe solo en su tienda
- Nadie se hace administrador a sí mismo
- El cliente no cambia su dirección web, su plan, su vencimiento ni si está publicada
- Los pagos los ve solamente el administrador
- Las fotos de cada tienda van a su propia carpeta

---

## Lo que viene

- Aviso automático de vencimientos por WhatsApp o mail, sin entrar al panel
- Cobro de suscripciones — el campo `plan` ya está en la base desde el día uno
- Dominio propio para cada cliente
- Estadísticas de visitas

# Etapa 5 — Poner el sitio en internet

El código ya está en GitHub. Falta conectarlo con Netlify.

---

## 1. Crear la cuenta de Netlify

1. Entrá a **netlify.com** y tocá **Sign up**.
2. Elegí **Sign up with GitHub** — así queda todo conectado de una.
3. GitHub te va a pedir permiso. Aceptá.

## 2. Traer el proyecto

1. En Netlify, tocá **Add new site** → **Import an existing project**.
2. Elegí **GitHub**.
3. Te va a pedir autorizar el acceso a tus repositorios. Podés darle acceso
   solo a este: elegí **Only select repositories** y marcá
   **plataforma-catalogos**.
4. De la lista, elegí **plataforma-catalogos**.

## 3. La configuración ya viene puesta

Netlify va a mostrar una pantalla con la configuración. **No toques nada**:
el archivo `netlify.toml` del proyecto ya le dice todo lo que necesita
(qué comando correr y qué carpeta publicar).

Lo único que falta son los dos datos de Supabase.

## 4. Cargar los dos datos de Supabase

En esa misma pantalla buscá **Environment variables** (o *Add environment
variables*). Si no la encontrás, no importa: seguí sin cargarlos, el primer
intento va a fallar, y después los cargás en
**Site configuration → Environment variables**.

Agregá estos dos, **exactamente con estos nombres**:

| Nombre | Valor |
|---|---|
| `VITE_SUPABASE_URL` | Tu Project URL de Supabase |
| `VITE_SUPABASE_ANON_KEY` | Tu Publishable key (la que empieza con `sb_publishable_`) |

Son los mismos dos que tenés en el archivo `.env` de tu computadora. Abrilo
con el Bloc de notas y copialos de ahí.

> Van acá y no en GitHub a propósito: aunque son datos públicos, no conviene
> dejarlos escritos en el código.

## 5. Desplegar

Tocá **Deploy**. Tarda un par de minutos.

Cuando termine, Netlify te da una dirección inventada, tipo
`fluffy-marshmallow-a1b2c3.netlify.app`.

## 6. Ponerle un nombre decente

Esa dirección la van a ver tus clientes, así que conviene algo presentable.

1. **Site configuration** → **General** → **Site details**
2. Tocá **Change site name**
3. Poné algo corto y fácil de dictar. Por ejemplo `catalogosfacu`, y te queda
   `catalogosfacu.netlify.app`
4. Guardá

**Pasame ese nombre.** Yo actualizo la única línea del proyecto que tiene la
dirección, la subo, y Netlify vuelve a publicar solo.

---

## De ahí en adelante

Cada cambio que hagamos se publica solo: yo lo subo a GitHub y Netlify lo
detecta y actualiza el sitio en un par de minutos. No tenés que hacer nada.

Y cuando compres tu dominio propio, se cambia esa misma línea y listo.

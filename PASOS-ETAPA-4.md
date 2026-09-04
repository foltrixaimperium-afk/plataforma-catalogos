# Etapa 4 — Lo que tenés que hacer vos

Dos cosas. Diez minutos.

---

## 1. Guardar el email en el perfil (1 minuto)

En Supabase → **SQL Editor** → **New query**, pegá el contenido del archivo
`supabase/etapa-4.sql` y apretá **Run**.

Los emails viven en una tabla del sistema a la que tu panel no llega. Esto los
copia al perfil, así podés ver con qué email entra cada cliente.

Al final te muestra una tablita con los emails y los roles. Ahí tenés que verte
a vos como `admin`.

---

## 2. Instalar la función que crea las cuentas (10 minutos)

Crear usuarios necesita la clave secreta de Supabase, y todo lo que está en la
página lo puede leer cualquiera que abra el navegador. Por eso esta parte corre
del lado del servidor.

No hace falta instalar nada en tu computadora: se hace desde la web.

1. En Supabase, menú de la izquierda: **Edge Functions**.
2. Tocá **Deploy a new function** y elegí la opción del editor
   (dice *Via Editor* o *Create with editor*, según la versión).
3. En **Name** poné exactamente:

   ```
   admin-clientes
   ```

   Con guión, todo en minúsculas. Si le ponés otro nombre no va a funcionar.

4. Se abre un editor con un ejemplo. **Borrá todo** lo que hay adentro.
5. Abrí el archivo `supabase/functions/admin-clientes/index.ts` de esta carpeta,
   copiá **todo** y pegalo ahí.
6. Tocá **Deploy** (o **Deploy function**).
7. Esperá a que diga que quedó desplegada. Puede tardar un minuto.

> No tenés que copiar ninguna clave a ningún lado. Supabase le pasa la clave
> secreta a la función por su cuenta, y esa clave nunca sale de sus servidores.

---

## 3. Probar

En `localhost:5173/admin`:

1. Tocá **+ Crear un cliente**
2. Poné un nombre de tienda de prueba — fijate que la dirección se arme sola
   mientras escribís
3. Usá un email que no tengas registrado (te sirve cualquiera inventado, tipo
   `prueba@ejemplo.com`)
4. La contraseña ya viene sugerida, sin letras que se confundan
5. **Crear cliente**

Tiene que aparecer la pantalla verde con los datos para pasarle. Después, en la
lista, probá:

- **Entrar a editar** — entrás a su catálogo con las mismas pantallas que usa él
- **Cambiarle la contraseña**
- Cambiar el **plan** y el **estado** — se guardan solos, sin botón

Para comprobar que los candados funcionan de verdad: abrí una ventana de
incógnito, entrá con el cliente de prueba, y fijate que solo vea su tienda y
que no pueda llegar a `/admin`.

---

## Sobre dar de baja

Poner una tienda **De baja** la saca de internet: el link deja de mostrar el
catálogo. Los productos y las fotos quedan guardados, y volvés a publicarla
cuando quieras.

Borrar la cuenta para siempre no lo puse a propósito: es de esas cosas que no
tienen vuelta atrás y no conviene tenerlas a un clic. Si alguna vez necesitás
borrar una de verdad, se hace desde Supabase y te paso los pasos.

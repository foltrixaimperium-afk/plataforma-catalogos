# Etapa 1 — Lo que tenés que hacer vos

Son 15 minutos. Seguí los pasos en orden y no te saltees ninguno.

---

## 1. Crear la cuenta de Supabase

1. Entrá a **supabase.com** y tocá **Start your project**.
2. Entrá con tu cuenta de Google (o con email y contraseña, como prefieras).
3. Cuando te pida crear una organización, poné cualquier nombre (por ejemplo tu
   nombre) y elegí el plan **Free**.

## 2. Crear el proyecto

1. Tocá **New project**.
2. **Name**: `catalogos`
3. **Database Password**: tocá *Generate a password* y **guardala en algún lado**.
   No la vas a usar seguido, pero si la perdés es un lío recuperarla.
4. **Region**: elegí **South America (São Paulo)** — es la más cerca, el sitio
   va a andar más rápido.
5. Tocá **Create new project** y esperá dos minutos hasta que deje de decir
   *Setting up project*.

## 3. Armar las tablas

1. En el menú de la izquierda, tocá el ícono **SQL Editor** (dice `SQL`).
2. Tocá **New query**.
3. Abrí el archivo `supabase/schema.sql` de esta carpeta, copiá **todo** el
   contenido y pegalo en el recuadro grande.
4. Tocá **Run** (abajo a la derecha, o Ctrl+Enter).
5. Tiene que decir **Success. No rows returned**. Si dice error, mandame el
   texto del error tal cual.

> Esto crea las cinco tablas y todos los candados de seguridad. Se puede volver
> a correr las veces que quieras, no rompe nada.

## 4. Copiarme los dos datos

1. Menú de la izquierda, abajo del todo: **Project Settings** (el engranaje).
2. Tocá **API Keys** (o **API**, según la versión).
3. Vas a ver dos cosas que necesitás:
   - **Project URL** — algo como `https://abcdefgh.supabase.co`
   - **Publishable key** — arranca con `sb_publishable_`
     (en proyectos viejos se llamaba *anon public* y arrancaba con `eyJ...`;
     es lo mismo)

   > **No copies la Secret key** (`sb_secret_`). Esa se saltea todos los
   > candados y no va nunca en el código. La usamos recién en la etapa 4,
   > y guardada del lado de Supabase.
4. Abrí el archivo **`.env`** que está en esta carpeta (se abre con el Bloc de
   notas) y pegá cada dato después del `=`, así:

```
VITE_SUPABASE_URL=https://abcdefgh.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Sin comillas, sin espacios, sin barra al final. Guardá el archivo.

> Estos dos datos son públicos a propósito: cualquiera que abra tu sitio los
> puede ver. Lo que protege la base son los candados del paso 3, no el secreto
> de la clave. La clave que **sí** es secreta (`service_role`) no la vamos a
> usar todavía.

## 5. Cerrar la puerta del registro público

Nadie se tiene que poder crear una cuenta solo: las cuentas las creás vos.

1. Menú de la izquierda: **Authentication**.
2. **Sign In / Providers** → **Email**.
3. Apagá **Allow new users to sign up**.
4. Apagá también **Confirm email** (así las cuentas que creás vos funcionan al
   toque, sin que el cliente tenga que confirmar nada).
5. **Save**.

## 6. Crear tu usuario

1. Seguí en **Authentication** → **Users**.
2. Tocá **Add user** → **Create new user**.
3. Poné tu email y una contraseña que te acuerdes.
4. **Importante**: marcá **Auto Confirm User**.
5. **Create user**.

## 7. Convertirte en administrador

1. Volvé al **SQL Editor** → **New query**.
2. Copiá el contenido del archivo `supabase/hacerme-admin.sql`.
3. **Cambiá el email** de la tercera línea por el tuyo.
4. **Run**.
5. Abajo te va a mostrar una tablita con tu email y `admin` al lado. Si dice
   `cliente`, el email no coincide: fijate que esté igual, sin espacios.

## 8. Probar

En la terminal, parar el servidor (Ctrl+C) y volver a arrancarlo:

```bash
npm run dev
```

Abrí `http://localhost:5173`. Tenés que ver la pantalla de entrar.
Poné tu email y contraseña → tiene que aparecer **Panel de administración**
diciendo "Entraste como administrador" y "0 tiendas cargadas".

Si llegaste hasta acá, la etapa 1 está lista. Avisame y seguimos.

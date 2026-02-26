## Supabase para TaulApp

Esta guía te ayuda a crear el proyecto de Supabase que usará TaulApp para el inicio de sesión y las recetas de la comunidad.

### 1. Crear proyecto en Supabase

1. Entra en `https://supabase.com` y crea una cuenta si aún no la tienes.
2. Crea un **nuevo proyecto**:
   - Elige una contraseña para la base de datos.
   - Apunta la **URL del proyecto** y la **anon public key** (las usaremos como variables de entorno).

### 2. Variables de entorno en TaulApp

En el proyecto de Next.js crea un fichero `.env.local` (no se sube a git) en la raíz con:

```bash
NEXT_PUBLIC_SUPABASE_URL="https://TU-PROYECTO.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="TU_ANON_PUBLIC_KEY"
```

Reinicia `npm run dev` después de añadirlas.

### 3. Tablas de base de datos

Ve a **Supabase → SQL** y ejecuta el siguiente script (puedes pegarlo tal cual y darle a “Run”):

```sql
-- PERFIL DE USUARIA
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Cada usuaria ve su perfil"
  on public.profiles
  for select
  using (auth.uid() = id);

create policy "Cada usuaria crea su perfil"
  on public.profiles
  for insert
  with check (auth.uid() = id);

create policy "Cada usuaria actualiza su perfil"
  on public.profiles
  for update
  using (auth.uid() = id);

-- RECETAS DE LA COMUNIDAD
create table if not exists public.user_recipes (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  nationality text,
  time_minutes integer,
  tags text[] default '{}',
  ingredients jsonb default '[]'::jsonb,
  steps text[] default '{}',
  storage text,
  tips text,
  image_path text,
  image_paths text[] default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.user_recipes enable row level security;

create policy "Recetas visibles para todo el mundo"
  on public.user_recipes
  for select
  using (true);

create policy "Cada usuaria crea sus recetas"
  on public.user_recipes
  for insert
  with check (auth.uid() = author_id);

create policy "Cada usuaria actualiza sus recetas"
  on public.user_recipes
  for update
  using (auth.uid() = author_id);

create policy "Cada usuaria borra sus recetas"
  on public.user_recipes
  for delete
  using (auth.uid() = author_id);
```

**Si ves el error "Could not find the 'image_paths' column"** (o "image_paths ... in the schema cache"), es que la tabla se creó antes de tener soporte para varias fotos. En **Supabase → SQL Editor** ejecuta:

```sql
alter table public.user_recipes
  add column if not exists image_paths text[] default '{}';
```

Vuelve a guardar la receta después.

### 4. Bucket de imágenes (obligatorio para subir fotos)

Si al subir una receta ves **"bucket not found"**, crea el bucket. Si ves **"new row violates row-level security policy"**, crea el bucket y luego las políticas de Storage siguientes.

**Paso 1 – Crear el bucket**

1. En Supabase entra en **Storage** (menú izquierdo).
2. Pulsa **"New bucket"** (o "Create bucket").
3. Configura el bucket:
   - **Name:** `recipe-images` (exactamente ese nombre, con guión).
   - **Public bucket:** activado (para que las fotos se puedan ver sin login).
4. Guarda el bucket.

**Paso 2 – Políticas de Storage (RLS)**

Sin políticas, Storage deniega las subidas. En **SQL Editor** ejecuta:

```sql
-- Permitir a usuarias autenticadas subir archivos al bucket recipe-images
create policy "Usuarias autenticadas pueden subir fotos de recetas"
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'recipe-images');

-- Permitir a todo el mundo leer (ver) las fotos (bucket público)
create policy "Cualquiera puede ver las fotos de recetas"
  on storage.objects
  for select
  to public
  using (bucket_id = 'recipe-images');
```

Si ya tenías políticas con otro nombre para este bucket, puedes borrarlas en **Storage → recipe-images → Policies** y usar las de arriba.

Con esto, TaulApp ya tiene:

- Cliente configurado en `app/lib/supabaseClient.ts`.
- Variables de entorno definidas.
- Tablas `profiles` y `user_recipes` listas para usar en el código.


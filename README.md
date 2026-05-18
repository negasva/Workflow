# TattoFlow

Herramienta personal para gestionar flujos de conversación de ventas por WhatsApp de kits de tatuaje.

## Stack

- **Next.js 14** (App Router)
- **Supabase** (PostgreSQL + cliente JS)
- **Tailwind CSS**
- **React Flow** — editor de canvas interactivo
- **Vercel** — deployment

---

## Setup paso a paso

### 1. Crear proyecto en Supabase

1. Ve a [supabase.com](https://supabase.com) y crea una cuenta o inicia sesión.
2. Crea un nuevo proyecto (cualquier nombre, región más cercana a ti).
3. Espera a que el proyecto termine de iniciar (~1 min).

### 2. Ejecutar el schema SQL

1. En tu proyecto de Supabase, ve a **SQL Editor** (menú izquierdo).
2. Haz clic en **"New query"**.
3. Copia todo el contenido del archivo `supabase/schema.sql`.
4. Pégalo en el editor y presiona **"Run"** (o `Ctrl+Enter`).
5. Verás el mensaje "Success. No rows returned" — todo OK.

Esto creará las tablas `kits`, `nodos`, `conexiones` e insertará los datos del Kit Poseidón Clear más 4 kits vacíos.

### 3. Obtener credenciales de Supabase

1. En tu proyecto, ve a **Settings** → **API**.
2. Copia los valores:
   - **Project URL** → es tu `NEXT_PUBLIC_SUPABASE_URL`
   - **anon / public** key → es tu `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 4. Configurar variables de entorno locales

```bash
cp .env.local.example .env.local
```

Edita `.env.local` y pega tus credenciales:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 5. Instalar dependencias y correr localmente

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

---

## Deploy en Vercel

### Opción A — desde la CLI de Vercel

```bash
npm i -g vercel
vercel
```

### Opción B — desde vercel.com

1. Ve a [vercel.com](https://vercel.com) e importa tu repositorio de GitHub.
2. En la pantalla de configuración del proyecto, agrega las variables de entorno:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Haz clic en **Deploy**.

---

## Uso

### Modo Venta (💬)

- El flujo arranca desde el nodo de inicio del kit seleccionado.
- Haz clic en cualquier respuesta del cliente para navegar al siguiente paso.
- El botón **📋 Copiar** en los nodos "yo" copia el texto al portapapeles con un solo clic.
- **← Atrás** retrocede un paso. **↺ Inicio** vuelve al principio.

### Modo Editor (✏️)

- Canvas interactivo con todos los nodos del kit.
- **Arrastrar nodo** → guarda la posición automáticamente.
- **Arrastrar desde el borde de un nodo** → crea una conexión.
- **Clic en nodo** → abre el panel lateral para editar texto y tipo.
- **Clic en una flecha** → elimina esa conexión (pide confirmación).
- **Botón "+"** (esquina inferior derecha) → agrega un nodo nuevo.

### Tipos de nodo

| Tipo    | Color   | Significado                          |
|---------|---------|--------------------------------------|
| inicio  | Rosado  | Nodo raíz del flujo (mensaje inicial)|
| yo      | Azul    | Mis mensajes / respuestas            |
| cliente | Naranja | Posibles respuestas del cliente      |

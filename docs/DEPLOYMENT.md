# 🚀 Guía de Despliegue en Producción — Peso a Peso

Esta guía detalla los pasos para desplegar **Peso a Peso** en producción utilizando **Vercel** (Frontend SPA) y **Render** (Backend FastAPI), conectados a **Supabase** y **Google Gemini**.

---

## 📋 Arquitectura de Despliegue

```
┌───────────────────────────┐      HTTPS / REST      ┌───────────────────────────┐
│     Vercel (Frontend)     │ ─────────────────────> │     Render (Backend)      │
│  React 19 + Vite + TS     │                        │  FastAPI + Python 3.13    │
└───────────────────────────┘                        └───────────────────────────┘
              │                                                    │
              │ Supabase Auth (JWT)                                │ Service Role / Anon
              v                                                    v
┌────────────────────────────────────────────────────────────────────────────────┐
│                           Supabase (Cloud DB)                                  │
│                 PostgreSQL 15 + RLS + Triggers + Auth                         │
└────────────────────────────────────────────────────────────────────────────────┘
```

---

## 1. Despliegue del Backend en Render

### Paso A — Crear Web Service en Render
1. Ingresa a [dashboard.render.com](https://dashboard.render.com/) y haz clic en **New + > Web Service**.
2. Conecta tu repositorio de GitHub `edithmgp/peso-a-peso`.
3. Completa los campos básicos:
   - **Name:** `peso-a-peso-backend`
   - **Region:** Ohio (US East) o Frankfurt (según tu ubicación de Supabase)
   - **Root Directory:** `backend`
   - **Runtime:** `Python 3`
   - **Build Command:** `pip install --no-cache-dir -r requirements.txt`
   - **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Health Check Path:** `/healthz`

### Paso B — Configurar Variables de Entorno en Render
En la pestaña **Environment** del servicio, añade las siguientes variables:

| Variable | Valor | Descripción |
|---|---|---|
| `ENVIRONMENT` | `production` | Activa modo producción y validación estricta de JWT |
| `DEBUG` | `false` | Desactiva recarga en caliente |
| `BACKEND_HOST` | `0.0.0.0` | Bind interface |
| `CORS_ORIGINS` | `["https://tu-app.vercel.app","http://localhost:5173"]` | Orígenes frontend autorizados |
| `SUPABASE_URL` | `https://<tu-id>.supabase.co` | URL de tu proyecto Supabase |
| `SUPABASE_ANON_KEY` | `eyJhbGciOi...` | Clave anónima pública de Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGciOi...` | Clave de servicio privilegiada |
| `GEMINI_API_KEY` | `<tu-gemini-api-key>` | API Key de Google Gemini AI Studio |
| `GEMINI_MODEL` | `gemini-2.0-flash` | Modelo de lenguaje utilizado |

### Paso C — Verificar Despliegue
Una vez desplegado, Render te asignará una URL pública (ej. `https://peso-a-peso-backend.onrender.com`).
Verifica la salud abriendo en el navegador:
```
https://peso-a-peso-backend.onrender.com/health
```
Debe responder:
```json
{
  "status": "healthy",
  "app": "Peso a Peso",
  "version": "1.0.0",
  "environment": "production"
}
```

---

## 2. Despliegue del Frontend en Vercel

### Paso A — Importar Proyecto en Vercel
1. Ingresa a [vercel.com](https://vercel.com/) y haz clic en **Add New... > Project**.
2. Selecciona el repositorio `peso-a-peso`.
3. Configuración del proyecto:
   - **Framework Preset:** `Vite`
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`

### Paso B — Configurar Variables de Entorno en Vercel
En la sección **Environment Variables**:

| Variable | Valor |
|---|---|
| `VITE_API_URL` | `https://peso-a-peso-backend.onrender.com/api/v1` |
| `VITE_SUPABASE_URL` | `https://<tu-id>.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGciOi...` (anon key) |

### Paso C — Desplegar
Haz clic en **Deploy**. Vercel compilará la SPA y generará tu URL pública (ej. `https://peso-a-peso.vercel.app`).

---

## 3. Configuración de Supabase Auth en Producción

Para que el inicio de sesión y la confirmación de correos funcionen con el dominio de producción:

1. Ve a **Supabase Dashboard > Authentication > URL Configuration**.
2. **Site URL:**
   ```
   https://peso-a-peso.vercel.app
   ```
3. **Redirect URLs:** Agrega:
   ```
   https://peso-a-peso.vercel.app/**
   http://localhost:5173/**
   ```
4. Guarda los cambios.

---

## 4. Checklist de Verificación Final

- [ ] `GET /healthz` en Backend devuelve `200 OK` con status `"healthy"`.
- [ ] Frontend carga en Vercel sin pantalla en blanco y con assets gzipped optimizados.
- [ ] Recargar directamente rutas SPA (ej. `/dashboard`, `/expenses`, `/budget`, `/profile`) funciona gracias a `vercel.json`.
- [ ] Iniciar sesión desde el Frontend autentica contra Supabase y guarda la sesión.
- [ ] La captura inteligente por texto (Gemini) extrae el gasto y lo persiste con RLS.
- [ ] El dashboard calcula las métricas y el Disponible Diario en tiempo real.

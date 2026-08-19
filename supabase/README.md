# 🗄️ Guía de Configuración y Migraciones de Supabase — Peso a Peso

Esta carpeta contiene la definición del esquema relacional, políticas de seguridad (RLS) y datos iniciales para PostgreSQL en Supabase.

---

## 📁 Archivos de Migración

1. **`migrations/001_initial_schema.sql`**:
   - Define las 10 tablas relacionales: `profiles`, `categories`, `budgets`, `expenses`, `fixed_expenses`, `alerts`, `alert_feedback`, `behavior_profiles`, `financial_snapshots`, `agent_events`.
   - Claves foráneas con eliminación en cascada (`ON DELETE CASCADE`).
   - Restricciones `CHECK` para integridad financiera (monto > 0, fuentes de gasto válidas, severidad de alertas, etc.).
   - Índices de alto rendimiento (`idx_expenses_user_date`, `idx_budgets_user_month`, `idx_agent_events_request`, etc.).

2. **`migrations/002_rls_policies.sql`**:
   - Habilita **Row Level Security (RLS)** en todas las tablas que contienen datos de usuario.
   - Aplica políticas estrictas `auth.uid() = user_id` para SELECT, INSERT, UPDATE y DELETE.
   - Permite lectura de `categories` para usuarios autenticados.

3. **`migrations/003_seed_categories.sql`**:
   - Carga el catálogo maestro de 8 categorías del sistema (`food`, `utilities`, `transport`, `leisure`, `housing`, `health`, `education`, `other`).

4. **`seed/seed.sql`**:
   - Datos adicionales para pruebas y entornos de desarrollo.

---

## 🚀 Cómo Aplicar las Migraciones

### Opción 1: Desde el SQL Editor de Supabase (Recomendado para la entrega)
1. Inicia sesión en tu consola de [Supabase](https://supabase.com/dashboard) y abre tu proyecto.
2. Ve a la sección **SQL Editor** en la barra lateral izquierda.
3. Copia y ejecuta en orden:
   - Contenido de `migrations/001_initial_schema.sql` ➡️ Click en **Run**.
   - Contenido de `migrations/002_rls_policies.sql` ➡️ Click en **Run**.
   - Contenido de `migrations/003_seed_categories.sql` ➡️ Click en **Run**.

### Opción 2: Mediante Supabase CLI
```bash
# Iniciar sesión en CLI
supabase login

# Vincular proyecto
supabase link --project-ref your-project-ref

# Aplicar migraciones locales a la base remota
supabase db push
```

---

## 🔑 Variables de Entorno Requeridas

Una vez creado el proyecto en Supabase, copia las credenciales desde **Project Settings > API**:

### En `backend/.env`:
```env
SUPABASE_URL=https://<tu-id-proyecto>.supabase.co
SUPABASE_ANON_KEY=<tu-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<tu-service-role-key>
```

### En `frontend/.env`:
```env
VITE_SUPABASE_URL=https://<tu-id-proyecto>.supabase.co
VITE_SUPABASE_ANON_KEY=<tu-anon-key>
```

---

## 🧪 Verificación de Conexión

Ejecuta el script de diagnóstico desde la raíz del backend:
```bash
cd backend
python scripts/init_db.py
```

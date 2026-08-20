# 🪙 Peso a Peso

> **Asistente financiero inteligente para la economía doméstica basado en un sistema multi-agente con orquestación cíclica OODA.**

---

## 📖 Tabla de Contenidos
1. [El Problema](#1-el-problema)
2. [La Solución](#2-la-solución)
3. [Arquitectura del Sistema](#3-arquitectura-del-sistema)
4. [Stack Tecnológico](#4-stack-tecnológico)
5. [Sistema Multi-Agente](#5-sistema-multi-agente)
6. [Estructura del Proyecto](#6-estructura-del-proyecto)
7. [Requisitos Previos](#7-requisitos-previos)
8. [Instalación y Ejecución Local](#8-instalación-y-ejecución-local)
9. [Variables de Entorno](#9-variables-de-entorno)
10. [Base de Datos y Supabase](#10-base-de-datos-y-supabase)
11. [Testing y Calidad](#11-testing-y-calidad)
12. [Seguridad](#12-seguridad)
13. [Roadmap y Sprints](#13-roadmap-y-sprints)

---

## 1. El Problema

El descontrol financiero doméstico se produce habitualmente por:
- Aumentos imprevistos de tarifas y servicios.
- Acumulación invisible de gastos pequeños ("gastos hormiga").
- Falta de visibilidad y planificación de compras antes del fin de mes.
- Mezcla de gastos personales y laborales en freelancers y trabajadores remotos.

## 2. La Solución

**Peso a Peso** centraliza el registro de gastos, calcula determinísticamente la disponibilidad diaria de dinero libre, predice el consumo hacia el cierre del mes y emplea un equipo de agentes inteligentes especializados para orientar y alertar al usuario antes de que se produzcan desvíos presupuestarios.

---

## 3. Arquitectura del Sistema

El sistema implementa un **ciclo OODA** (*Observar, Orientar, Decidir, Actuar*) con memoria persistente y feedback continuo:

```text
┌─────────────────────────────────────────────────────────┐
│                        USUARIO                          │
│                   Navegador / Celular                   │
└───────────────────────────┬─────────────────────────────┘
                            │ HTTPS / REST
                            ▼
┌─────────────────────────────────────────────────────────┐
│                        FRONTEND                         │
│            React + TypeScript + Vite + Tailwind         │
│          Dashboard │ Laboratorio │ Carga de Gastos      │
└───────────────────────────┬─────────────────────────────┘
                            │ REST (/api/v1/...)
                            ▼
┌─────────────────────────────────────────────────────────┐
│                        BACKEND                          │
│                  Python + FastAPI API                   │
│              Orquestador Central de Agentes             │
└───────┬───────────────────┬─────────────────────┬───────┘
        │                   │                     │
        ▼                   ▼                     ▼
┌───────────────┐   ┌───────────────┐     ┌───────────────┐
│   AGENTES     │   │   IA / OCR    │     │    REGLAS     │
│  (5 Agentes)  │   │ Gemini Vision │     │ Deterministas │
└───────┬───────┘   └───────┬───────┘     └───────┬───────┘
        │                   │                     │
        └───────────────────┼─────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────┐
│                        SUPABASE                         │
│       PostgreSQL │ Row Level Security │ Storage │ Auth  │
│      Memoria Corto Plazo │ Histórica │ Perfil           │
└─────────────────────────────────────────────────────────┘
```

---

## 4. Stack Tecnológico

| Capa | Tecnología | Justificación |
| :--- | :--- | :--- |
| **Frontend** | **React 19 + TypeScript + Vite** | SPA moderna, modular, tipado estricto y alto rendimiento. |
| **UI & Gráficos** | **Tailwind CSS + Lucide Icons + Recharts** | Interfaz responsive, limpia y visualización financiera dinámica. |
| **Backend** | **Python 3.13 + FastAPI** | Framework asíncrono, OpenAPI nativo y tipado Pydantic. |
| **Base de Datos** | **Supabase (PostgreSQL 15+)** | Persistencia relacional, Row Level Security (RLS) y Auth integrado. |
| **Storage** | **Supabase Storage** | Almacenamiento seguro de imágenes de tickets y comprobantes. |
| **Inteligencia Artificial** | **Google Gemini 2.0 Flash / Vision** | Procesamiento de lenguaje natural, clasificación semántica y OCR de tickets. |
| **Orquestación** | **Python nativo** | Orquestador de agentes con contexto tipado (`AgentContext`). |

---

## 5. Sistema Multi-Agente

Los 5 agentes cooperan mediante un **contexto estructurado compartido** gestionado por el Orquestador Central:

1. 📥 **Agente de Captura e Ingesta:** Normaliza entradas (texto, ticket OCR, manual) y genera candidatos validados con score de confianza.
2. 📊 **Agente Analizador de Patrones:** Evalúa velocidad de consumo, desvíos estadísticos por categoría y detecta anomalías.
3. 🎯 **Agente Planificador y Proyector:** Responde *"¿Llegaré a fin de mes?"*, calculando el dinero disponible por día y proyección de ahorro/cierre.
4. 🛡️ **Agente Evaluador y Generador de Alertas:** Filtro crítico que determina la severidad de las alertas antes de notificarlas al usuario.
5. 🧠 **Meta-Agente de Aprendizaje Continuo:** Adapta tono, sensibilidad y frecuencia en función del feedback explícito (*"Me sirvió"* / *"No me sirvió"*).

---

## 6. Estructura del Proyecto

```text
peso-a-peso/
├── frontend/             # Aplicación React + TypeScript + Vite
│   ├── src/
│   │   ├── components/   # Componentes UI, charts, dashboard, expenses, alerts
│   │   ├── pages/        # Dashboard, Laboratory, AddExpense, Login
│   │   ├── layouts/      # AppLayout principal
│   │   ├── services/     # Clientes de API REST
│   │   ├── types/        # Contratos de TypeScript
│   │   └── hooks/        # Custom React Hooks
├── backend/              # API FastAPI en Python
│   ├── app/
│   │   ├── api/routes/   # Endpoints REST (/expenses, /budget, /dashboard, /alerts, /capture)
│   │   ├── agents/       # Lógica especializada de los 5 agentes
│   │   ├── orchestrator/ # Orquestador OODA y AgentContext
│   │   ├── models/       # Modelos de base de datos
│   │   ├── schemas/      # Modelos Pydantic v2
│   │   ├── services/     # Servicios de negocio, IA y almacenamiento
│   │   └── core/         # Configuración, seguridad y conexión DB
├── supabase/             # Migraciones SQL, políticas RLS y seed data
│   ├── migrations/
│   └── seed/
├── docs/                 # Documentación técnica, diagramas de arquitectura y UML
└── docker-compose.yml    # Orquestación de contenedores locales
```

---

## 7. Requisitos Previos

- **Node.js** >= 20.x
- **Python** >= 3.11
- **Git**
- Cuenta de **Supabase** (o instancia local)
- API Key de **Google Gemini**

---

## 8. Instalación y Ejecución Local

### 1. Clonar el repositorio
```bash
git clone https://github.com/edithmgp/peso-a-peso.git
cd peso-a-peso
```

### 2. Configurar el Backend
```bash
cd backend
python -m venv .venv

# En Windows:
.venv\Scripts\activate
# En Linux/macOS:
source .venv/bin/activate

pip install -r requirements.txt
cp .env.example .env
# Completar las credenciales en .env

uvicorn app.main:app --reload --port 8000
```
API docs disponible en: [http://localhost:8000/docs](http://localhost:8000/docs)

### 3. Configurar el Frontend
```bash
cd ../frontend
npm install
cp .env.example .env
# Completar las variables en .env

npm run dev
```
Aplicación disponible en: [http://localhost:5173](http://localhost:5173)

---

## 9. Variables de Entorno

Copiar `.env.example` en la raíz, backend y frontend:

```env
# Backend & AI
ENVIRONMENT=development
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
GEMINI_API_KEY=your-gemini-api-key

# Frontend
VITE_API_URL=http://localhost:8000/api/v1
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

---

## 10. Base de Datos y Supabase

Las migraciones se encuentran en `supabase/migrations/`:
1. `001_initial_schema.sql`: Definición de tablas relacionales con UUIDs.
2. `002_rls_policies.sql`: Políticas de Row Level Security (`auth.uid() = user_id`).
3. `003_seed_categories.sql`: Categorías iniciales tipadas (`food`, `utilities`, `transport`, etc.).

---

## 11. Testing y Calidad

Ejecución de tests automáticos:
```bash
# Tests de Backend (Pytest)
cd backend
pytest

# Verificación de tipos Frontend
cd ../frontend
npm run build
```

---

## 12. Seguridad

- **Row Level Security (RLS)** estricto en todas las tablas de usuario en Supabase.
- **Validación de candidatos OCR con confirmación humana obligatoria** antes de persistir cualquier gasto.
- **Aislamiento de Secretos**: `SUPABASE_SERVICE_ROLE_KEY` y `GEMINI_API_KEY` se ejecutan exclusivamente en el Backend.

---

## 13. Roadmap de Sprints (100% Completado)

- [x] **Sprint 0:** Inicialización del Repositorio, Frontend, Backend, Supabase Migrations & Documentación.
- [x] **Sprint 1:** Configuración de Supabase, Auth & Migraciones en la nube.
- [x] **Sprint 2:** CRUD de Gastos, Presupuestos y Gastos Fijos.
- [x] **Sprint 3:** Dashboard y Métricas de Disponible Diario.
- [x] **Sprint 4:** Implementación del Orquestador y los 5 Agentes (Ciclo OODA).
- [x] **Sprint 5:** Meta-Agente, Aprendizaje Continuo y Memoria de Sensibilidad.
- [x] **Sprint 6:** Ingesta Inteligente con Gemini 2.0 Flash y Gemini Vision (OCR).
- [x] **Sprint 7:** Seguridad, RLS, Validación, Limpieza y 80 Tests de Integración.
- [x] **Sprint 8:** Despliegue en Producción (Vercel + Render + Supabase).
- [x] **Sprint 9:** Entrega Final, Documentación Consolidada y Reporte Técnico de Arquitectura.

---

## 14. Documentación y Enlaces Clave

- 📊 **[Reporte Técnico de Arquitectura](docs/ARCHITECTURE_REPORT.md)**: Especificación detallada del Ciclo OODA, modelado matemático de Disponible Diario, arquitectura de los 5 agentes, esquemas de BD y métricas de calidad.
- 🚀 **[Guía de Despliegue en Producción](docs/DEPLOYMENT.md)**: Instrucciones paso a paso para desplegar Backend en Render, Frontend en Vercel y configurar Supabase Auth.
- 📑 **[Contratos y Especificación API](docs/API_CONTRACTS.md)**: Esquemas OpenAPI, modelos Pydantic y endpoints de la API v1.
- 🗄️ **[Esquema y Migraciones de Base de Datos](supabase/README.md)**: DDL de las 10 tablas, triggers y políticas RLS.


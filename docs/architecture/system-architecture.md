# Arquitectura del Sistema — Peso a Peso

## 1. Visión General
**Peso a Peso** es un sistema agéntico inteligente de gestión financiera doméstica basado en el ciclo OODA (*Observar, Orientar, Decidir, Actuar*).

## 2. Capas de la Arquitectura

```text
┌─────────────────────────────────────────────────────────┐
│                        PRESENTACIÓN                     │
│                  React + TypeScript + Vite              │
│        Dashboard │ Laboratorio │ Carga de Gastos        │
└───────────────────────────┬─────────────────────────────┘
                            │ HTTPS / JSON REST
                            ▼
┌─────────────────────────────────────────────────────────┐
│                     API & NEGOCIO                       │
│                  Python + FastAPI                       │
│                 Orquestador Central                     │
└───────┬───────────────────┬─────────────────────┬───────┘
        │                   │                     │
        ▼                   ▼                     ▼
┌───────────────┐   ┌───────────────┐     ┌───────────────┐
│   AGENTES     │   │   IA / OCR    │     │    REGLAS     │
│   (5 Roles)   │   │ Gemini Vision │     │ Deterministas │
└───────┬───────┘   └───────┬───────┘     └───────┬───────┘
        │                   │                     │
        └───────────────────┼─────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────┐
│                     PERSISTENCIA                        │
│                       Supabase                          │
│          PostgreSQL │ RLS │ Auth │ Storage              │
└─────────────────────────────────────────────────────────┘
```

## 3. Principios Clave
- **Cálculos Deterministas:** Los saldos, disponibles diarios y desvíos se calculan en código Python / SQL, nunca por inferencia libre del LLM.
- **Validación con Confirmación Humana:** Todo gasto detectado por OCR entra como `candidate` con `confirmed = false` y requiere aprobación explícita del usuario.
- **Contexto Centralizado:** Los agentes no se comunican entre sí en forma ad-hoc, sino a través de un `AgentContext` estructurado administrado por el Orquestador.

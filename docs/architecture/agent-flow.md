# Flujo de Agentes y Ciclo OODA — Peso a Peso

## 1. Agentes Especializados

1. **CaptureAgent (Ingesta y Normalización):** Extrae monto, comercio, fecha, categoría y confianza a partir de texto, ticket u orígenes manuales.
2. **AnalyzerAgent (Análisis de Patrones):** Computa promedios históricos, velocidad de consumo, desvíos estándar por categoría y detecta anomalías.
3. **PlannerAgent (Planificación y Proyección):** Calcula días restantes, presupuesto libre, disponibilidad diaria y proyección de cierre de mes.
4. **EvaluatorAgent (Evaluación y Filtro de Alertas):** Evalúa el desvío y la gravedad determinando si corresponde generar alertas (`info`, `warning`, `critical`).
5. **MetaAgent (Aprendizaje Continuo):** Actualiza el perfil de comportamiento (`behavior_profiles`) a partir del feedback explícito del usuario (`useful` / `not_useful`).

## 2. Diagrama de Ejecución del Orquestador

```text
Usuario
   │ (Ingresa gasto)
   ▼
POST /api/v1/expenses
   │
   ▼
[ Orquestador Central ]
   │
   ├──► 1. CaptureAgent (Valida o normaliza)
   │
   ├──► 2. AnalyzerAgent (Calcula métricas y desvíos)
   │
   ├──► 3. PlannerAgent (Proyecta saldo y disponible)
   │
   ├──► 4. EvaluatorAgent (Determina si emite alerta)
   │
   ├──► Persiste en PostgreSQL & Registra en agent_events
   │
   ▼
Respuesta al Usuario

Usuario
   │ (Envía feedback de alerta)
   ▼
POST /api/v1/alerts/{id}/feedback
   │
   ▼
[ MetaAgent ]
   │
   ▼
Actualiza scoring en behavior_profiles
```

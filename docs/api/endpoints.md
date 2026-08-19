# Catálogo de Endpoints REST — Peso a Peso (v1.3)

Todos los endpoints tienen como prefijo base `/api/v1`.

## 1. Gastos (`/expenses`)
- `POST /api/v1/expenses`: Registra un nuevo gasto y ejecuta el ciclo de agentes.
- `GET /api/v1/expenses`: Obtiene el listado de gastos filtrado por fechas o categoría.
- `GET /api/v1/expenses/{id}`: Obtiene el detalle de un gasto del usuario.
- `PUT /api/v1/expenses/{id}`: Actualiza campos editables de un gasto.
- `DELETE /api/v1/expenses/{id}`: Elimina un gasto del usuario.

## 2. Presupuesto (`/budget`)
- `GET /api/v1/budget/current`: Retorna el presupuesto activo del mes en curso.
- `POST /api/v1/budget`: Establece o crea el presupuesto para un mes específico.
- `PUT /api/v1/budget/{id}`: Modifica un presupuesto existente.

## 3. Dashboard (`/dashboard`)
- `GET /api/v1/dashboard`: Retorna el disponible de hoy, métricas de presupuesto, proyección mensual y alertas no leídas.

## 4. Análisis (`/analysis`)
- `GET /api/v1/analysis/current`: Métricas de análisis financiero y patrones del mes actual.
- `GET /api/v1/analysis/history`: Datos históricos consolidados.

## 5. Alertas & Feedback (`/alerts`)
- `GET /api/v1/alerts`: Lista alertas generadas para el usuario.
- `POST /api/v1/alerts/{id}/feedback`: Envía feedback explícito (`useful` / `not_useful`) disparando el Meta-Agente.

## 6. Captura OCR (`/capture`)
- `POST /api/v1/capture/receipt`: Sube una imagen de comprobante y retorna un `ReceiptCandidate` con `confidence`.
- `POST /api/v1/capture/confirm`: Confirma o cancela la creación del gasto a partir del candidato.

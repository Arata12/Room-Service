# Room Service App — TODO

> Este archivo es la fuente de verdad para todo el trabajo pendiente.
> Se actualiza conforme se completan tareas o se añaden nuevas.
> El orquestador debe consultarlo antes de cada sesión de trabajo.

---

## Reglas operativas

- Solo una tarea `in_progress` a la vez
- Toda tarea nueva entra primero aquí antes de ejecutarse
- Si aparece algo durante revisión o pruebas, se añade aquí
- Tareas completadas se marcan pero no se borran (historial)
- Extras pospuestos se marcan como `pendiente` con nota

---

## Formato de cada tarea

```
[PRIORITY] [STATUS] descripcion
  - Archivo(s): ...
  - Impacto: ...
  - Notas: ...
```

Prioridades: `CRITICA` > `ALTA` > `MEDIA` > `BAJA`
Estados: `pendiente` | `in_progress` | `completada` | `pospuesta`

---

## Infraestructura

- [completada] **Crear .gitignore en raíz**
  - Archivos: `.gitignore`
  - Impacto: Impedir que node_modules, builds, .env y archivos temporales se suban a GitHub
  - Notas: Debe ignorar `client/node_modules/`, `server/node_modules/`, `client/dist/`, `server/dist/`, `*.log`, `.env`, `.env.local`

- [completada] **Sacar node_modules del tracking de git**
  - Archivos: `client/node_modules/`, `server/node_modules/`
  - Impacto: Reducir tamaño del repo, impedir sube archivos de módulos a GitHub
  - Notas: `git rm --cached -r client/node_modules server/node_modules` (no borrar archivos locales)

---

## Funcionalidad — CRITICA (rompen el flujo)

- [completada] **Flujo checkout -> success desalineado en modo demo**
  - Archivos: `server/routes/checkout.js:112`, `client/src/pages/SuccessPage.jsx`, `client/src/components/GuestForm.jsx:63`
  - Impacto: El backend devuelve `order_id` en la URL, pero SuccessPage busca `session_id`. En modo demo, la navegación funciona por state pero si el usuario recarga la página, no recupera la orden.
  - Notas: "Necesita unify endpoint" — resuelto con nueva lógica de 3 capas: state → order_id → session_id

- [completada] **SuccessPage no recupera orden al recargar (modo demo)**
  - Archivos: `client/src/pages/SuccessPage.jsx`
  - Impacto: Si el usuario recarga `/success?demo=1&order_id=X`, ve pantalla de éxito sin datos de la orden
  - Notas: `location.state` se perdía en recarga — ahora hay fallback a `/api/orders/:id`

- [pendiente] **Admin: cliente no envía token JWT pero middleware exige auth**
  - Archivos: `client/src/App.jsx:17`, `client/src/pages/AdminPage.jsx:37`, `server/middleware/auth.js:8`
  - Impacto: En modo producción (TEST_MODE=false), todas las peticiones admin regresan 401 porque el cliente no incluye `Authorization: Bearer <token>`
  - Notas: Por ahora el middleware tiene bypass en TEST_MODE. Cuando se active auth real, el cliente necesita login + guardado de token + envío en headers

---

## Funcionalidad — ALTA (causan errores o experiencia degradada)

- [completada] **webhook.js: json_agg sin FILTER puede devolver items nulos**
  - Archivos: `server/routes/webhook.js:37`
  - Impacto: Si una orden no tiene items, `json_agg` sin `FILTER (WHERE oi.id IS NOT NULL)` puede devolver arrays con objetos nulos en lugar de `[]`
  - Notas: Añadido `COALESCE(..., '[]'::json) FILTER (WHERE oi.id IS NOT NULL)` — mismo patrón que otros endpoints

- [completada] **DB: sin validación de variables de entorno**
  - Archivos: `server/db/index.js`
  - Impacto: Si `DB_HOST`, `DB_NAME`, etc. son `undefined`, pg intenta conectar con valores vacíos y falla con error críptico
  - Notas: Añadida validación de las 5 vars requeridas con `process.exit(1)` si faltan

- [completada] **Printer: siempre usa nombre en inglés**
  - Archivos: `server/printer/print.js:65`
  - Impacto: Los tickets impresos siempre muestran `item_name_en`, sin considerar el idioma del pedido
  - Notas: Añadida selección `item_name_es` para MXN, `item_name_en` para USD

---

## Funcionalidad — MEDIA (incompletos pero funcionales)

- [pendiente] **Admin: historial de estados no implementado (muestra fallback)**
  - Archivos: `client/src/pages/AdminPage.jsx:279`
  - Impacto: Modal de detalle de orden muestra `t('admin.details.historyFallback')` fijo en lugar de historial real de cambios de estado
  - Notas: Requiere tabla de `order_status_history` o campo en `orders`

- [pendiente] **Admin: UI sin paginación real**
  - Archivos: `client/src/pages/AdminPage.jsx`, `server/routes/admin.js`
  - Impacto: Si hay muchas órdenes, la tabla crece sin límite y el servidor devuelve `total` que el cliente ignora
  - Notas: El endpoint soporta `limit`/`offset` pero AdminPage no tiene controles de paginación

- [pendiente] **Admin: polling sin backoff**
  - Archivos: `client/src/pages/AdminPage.jsx:47`
  - Impacto: `setInterval(fetchOrders, 10000)` consulta cada 10 segundos sin importar carga ni si hay múltiples admins
  - Notas: Considerar exponential backoff o polling con stale-till-revalidate

---

## Funcionalidad — BAJA (detalles de UX)

- [pendiente] **CartContext: formatPrice siempre usa "$" para ambas monedas**
  - Archivos: `client/src/CartContext.jsx:59`
  - Impacto: MXN muestra "$" igual que USD, debería mostrar "MX$" para evitar ambigüedad
  - Notas: `const symbol = currency === 'MXN' ? 'MX$' : '$'` siempre retorna '$'

- [pendiente] **Rate limits: checkout vulnerable a abuse**
  - Archivos: `server/index.js:21-22`
  - Impacto: Rate limit global de 100/15min + checkout de 10/15min permite más requests de las necesarias
  - Notas: Considerar reducir global o añadir limit por IP más estricto en checkout

---

## Extras (pospuestos — NO son bloqueantes para pruebas)

- [pendiente] **Auth admin: login real con JWT**
  - Archivos: `client/src/App.jsx:11-30`, `server/middleware/auth.js`, `server/routes/admin.js`
  - Impacto: Hoy el admin funciona por bypass de TEST_MODE; en producción necesita login con contraseña y emisión de JWT
  - Notas: Requiere endpoint POST /api/admin/login, hash de password, y guardado de token en localStorage con envío en headers

- [pendiente] **Tabla order_status_history**
  - Archivos: `server/db/migrate.js`, `server/routes/admin.js`
  - Impacto: Guardar timestamp y usuario que hizo cada cambio de estado
  - Notas: Crear tabla, trigger o log en app, y mostrarla en modal de AdminPage

- [completada] **Impresora bilingüe**
  - Archivos: `server/printer/print.js`
  - Impacto: Tickets en español para huéspedes que no leen inglés
  - Notas: Usar `item_name_es` cuando `order.currency` indique contexto MX

- [pendiente] **Notificaciones push/webhook al personal**
  - Archivos: `server/routes/webhook.js`
  - Impacto: El staff no sabe cuándo llega un pedido nuevo sin hacer polling constante
  - Notas: Webhook a sistema interno, push notification o Telegram/Slack

- [pendiente] **Tests automatizados**
  - Archivos: `client/`, `server/`
  - Impacto: Sin tests no hay forma confiable de validar cambios
  - Notas: Vitest + React Testing Library (client), Jest + Supertest (server)

- [pendiente] **Docker multi-stage build para producción**
  - Archivos: `docker-compose.yml`, `Dockerfile`
  - Impacto: Hoy solo hay dev setup
  - Notas: Multi-stage build con nginx/apache para servir React en producción

---

## Completadas (historial)

- 2026-03-24 — Creado TODO.md inicial y .gitignore
- 2026-03-24 — Sacado node_modules del tracking de git (5355 archivos eliminados del repo, ~996K líneas)
- 2026-03-24 — SuccessPage: order recovery en demo mode (state + order_id fallback + session_id)
- 2026-03-24 — SuccessPage: `order.total` → `order.total_usd` (bug encontrado durante fix)
- 2026-03-24 — webhook.js: json_agg con COALESCE + FILTER
- 2026-03-24 — db/index.js: validación de env vars con exit claro
- 2026-03-24 — printer: selección bilingüe item_name_en/es según currency

---

## Notas para el orquestador

1. **Antes de cada sesión**: leer este archivo, identificar siguiente tarea `pendiente` con prioridad más alta
2. **Durante trabajo**: mantener estado `[in_progress]` actualizado; no dejar tareas colgadas
3. **Al encontrar algo nuevo**: añadir aquí antes de actuar, no perder contexto
4. **Al completar**: marcar `completada` con fecha, no borrar — el historial tiene valor
5. **Extras**: se añaden aquí pero no bloquean las pruebas del flujo principal

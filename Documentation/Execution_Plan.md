# Plan de Ejecución — Nexa MVP

Plan de trabajo para construir el MVP. Traduce el `Plan_Sprints_Nexa` (tareas NEXA-xxx)
a **steps ejecutables**, donde **cada step = un commit**.

- Fuente de alcance: `V1 - Nexa MVP/PRD_Nexa_MVP.docx`, `Spec_Tecnica_Nexa_MVP.docx`.
- Fuente de UI: `Documentation/Mocks/` + `UI_Mocks_Map.md` + `Mocks/nexa_design_system/DESIGN.md`.
- Reglas de arquitectura y estilo: `CLAUDE.md` (raíz).

> Los documentos y mocks son referencia, **no** la fuente de verdad final. Ajustamos as we
> go. Cuando una decisión no esté clara, se marca `[POR DEFINIR]` en vez de inventar.

---

## Convenciones de trabajo

- **Un commit por step.** Conventional Commits, en inglés (`feat:`, `fix:`, `chore:`,
  `docs:`, `refactor:`, `test:`, `ci:`).
- **Todo el código en inglés** (variables, comentarios, commits). Copy de UI en es-MX.
  Documentación en español permitida.
- **Ramas:** trabajo en ramas por tarea (`nexa-00x-slug`) y merge a `main` vía PR, salvo
  cambios triviales. (Convención inicial; ajustable.)
- **Definition of Done por step:** compila (`typecheck`), pasa lint y, si aplica, tests.
- Cada tarea NEXA-xxx se subdivide en steps aquí; los steps se afinan al empezar la tarea.

---

## Sprint 1 (sem 1–2) — Base del proyecto

### NEXA-001 · Init monorepo — ✅ EN CURSO
- [x] **S1.** Scaffold del monorepo: `pnpm-workspace.yaml`, `package.json` raíz,
  `turbo.json`, `.gitignore`, `.nvmrc`, `.npmrc`, dirs `apps/` y `packages/`.
  → `chore: scaffold monorepo with pnpm workspaces and turborepo`
- [x] **S2.** Actualizar `CLAUDE.md` y `README.md` (estructura + `apps/landing`, Turborepo,
  regla de idioma en inglés, regla de design system/librería de componentes).
  → (incluido en el commit de scaffold)
- [x] **S3.** Importar documentación de producto/diseño al repo (`Documentation/`) y añadir
  `Execution_Plan.md` + `UI_Mocks_Map.md`.
  → `docs: add product docs, design system, execution plan, and UI mock map`

### NEXA-002 · Package de config compartida
- [ ] **S1.** `packages/config` con `tsconfig.base.json` (strict, paths) → `chore(config): add base tsconfig`
- [ ] **S2.** ESLint compartido (flat config) → `chore(config): add shared eslint config`
- [ ] **S3.** Prettier compartido → `chore(config): add shared prettier config`

### NEXA-003 · Package de tipos/contratos
- [ ] **S1.** `packages/types` init + build (tsup/tsc) → `chore(types): init shared types package`
- [ ] **S2.** DTOs de dominio (Restaurant, Queue, WaitlistEntry, User, StaffUser,
  Notification, ServiceReview) + enums de estado → `feat(types): add domain DTOs and enums`
- [ ] **S3.** Payloads de eventos WebSocket (`entry_added`, `entry_updated`, `entry_removed`)
  y contratos REST → `feat(types): add websocket event and API contracts`

### NEXA-004 · Esqueleto backend Express
- [ ] **S1.** `apps/api` init (Node + Express + TS), healthcheck, arranque local → `feat(api): bootstrap express server with healthcheck`
- [ ] **S2.** Estructura de carpetas `src/contexts/` y bootstrap de middlewares/errores → `feat(api): add app structure and error handling`
- [ ] **S3.** Config y env tipada (dotenv + validación) → `feat(api): add typed env config`

### NEXA-005 · Prisma + PostgreSQL
- [ ] **S1.** Prisma init + conexión a Postgres local + docker-compose para DB → `feat(api): set up prisma and local postgres`
- [ ] **S2.** Schema inicial (todas las entidades de la Spec) → `feat(api): add initial prisma schema`
- [ ] **S3.** Primera migración + seed mínimo → `feat(api): add first migration and seed`

### NEXA-006 · Estructura DDD por bounded context
- [ ] **S1.** Capas `domain/application/infrastructure/interfaces` para `waitlist` → `feat(api): scaffold waitlist context layers`
- [ ] **S2.** Ídem `restaurant` → `feat(api): scaffold restaurant context layers`
- [ ] **S3.** Ídem `notifications` → `feat(api): scaffold notifications context layers`
- [ ] **S4.** Ídem `identity` → `feat(api): scaffold identity context layers`

### NEXA-007 · Context Restaurant: configuración
- [ ] **S1.** Dominio: entidad Restaurant + Queue + value objects (ETA base, expiración) → `feat(api): add restaurant domain model`
- [ ] **S2.** Repos (interfaces + Prisma) → `feat(api): add restaurant repositories`
- [ ] **S3.** Casos de uso: create/edit restaurant, manage queues → `feat(api): add restaurant config use cases`
- [ ] **S4.** Controladores HTTP + tests de dominio → `feat(api): expose restaurant config endpoints`

### NEXA-008 · Context Waitlist: dominio núcleo (Large)
- [ ] **S1.** Entidad WaitlistEntry + máquina de estados (waiting→notified→seated→no_show/cancelled) → `feat(api): add waitlist entry domain and state machine`
- [ ] **S2.** Posición en cola + cálculo de ETA sintético → `feat(api): add position and synthetic ETA`
- [ ] **S3.** Casos de uso: Join / Notify / Seat / MarkNoShow / Cancel → `feat(api): add waitlist use cases`
- [ ] **S4.** Repos Prisma + controladores + tests → `feat(api): expose waitlist endpoints`

### NEXA-009 · Context Identity: auth base (Large)
- [ ] **S1.** Integrar BetterAuth (setup) → `feat(api): integrate betterauth`
- [ ] **S2.** Modo guest (gamertag) → `feat(api): add guest identity mode`
- [ ] **S3.** Registro con correo + staff users (hostess/admin) → `feat(api): add registered and staff users`

### NEXA-010 · Capa de WebSockets en Express (Large)
- [ ] **S1.** Integrar WS en el proceso Express + modelo de rooms → `feat(api): add websocket server with rooms`
- [ ] **S2.** Emitir `entry_added/updated/removed` desde la capa de aplicación → `feat(api): emit waitlist domain events over websocket`
- [ ] **S3.** Auth/subscripción por restaurante/cola + tests → `feat(api): secure websocket subscriptions`

### NEXA-011 · Scaffold de apps Next.js (landing + client + reception + admin)
- [ ] **S1.** `apps/landing` (Next.js + TS + Tailwind, consume `packages/*`) → `feat(landing): scaffold next.js app`
- [ ] **S2.** `apps/client` → `feat(client): scaffold next.js app`
- [ ] **S3.** `apps/reception` → `feat(reception): scaffold next.js app`
- [ ] **S4.** `apps/admin` → `feat(admin): scaffold next.js app`

### NEXA-012 · Package de UI compartida (design system)
- [ ] **S1.** `packages/ui` init + tokens desde `DESIGN.md` (Tailwind preset/CSS vars) → `feat(ui): init design system tokens`
- [ ] **S2.** Tipografía (Quicksand + Be Vietnam Pro) + primitivas (Button pill, Card, Input) → `feat(ui): add base components`
- [ ] **S3.** Componentes de dominio derivados de mocks (Chip/Badge de estado, Stepper, WaitCard, StatusTimeline, BottomSheet) → `feat(ui): add domain components from mocks`

---

## Sprint 2 (sem 3–4) — Producto vertical + publicación

Tareas NEXA-013 … NEXA-026 (se subdividen en steps al iniciar cada una):

- **NEXA-013** client: flujo de alta (join) · **NEXA-014** client: estado en espera ·
  **NEXA-015** client: catálogo · **NEXA-016** client: evaluación post-servicio.
- **NEXA-017** reception: cola en vivo · **NEXA-018** reception: alta manual + acciones.
- **NEXA-019** admin: dashboard · **NEXA-020** admin: UI de configuración.
- **NEXA-021** notifications: web push · **NEXA-023** expiración & no-show.
- **NEXA-022** landing page (implementa los 6 mocks de landing).
- **NEXA-024** CI · **NEXA-025** aprovisionar servidor · **NEXA-026** CD (deja el producto publicado). En CD se resuelve la **separación de despliegue** de `landing` respecto al resto.

## Sprint 3 (sem 5–6) — Strapi, ETA dinámico, pagos, estabilización

Tareas NEXA-027 … NEXA-037: Strapi en `apps/cms` + integración, formularios configurables
end-to-end, catálogo desde Strapi, ETA dinámico, SMS/WhatsApp (Twilio), integraciones
externas, revisión de arquitectura, buffer de bugfixes, E2E de flujos críticos.

## Cierre y cliente (sem 7–12)

NEXA-038 … NEXA-046: hardening, docs/privacidad (LFPDPPP), monitoreo/backups, material de
venta, prospección, onboarding del primer restaurante y testing controlado en operación real.

---

## Estado actual

- **Hecho:** repo en GitHub, scaffold del monorepo (NEXA-001), documentación importada y
  reglas de `CLAUDE.md` actualizadas.
- **Siguiente:** NEXA-002 (config compartida) → NEXA-003 (types) → backend y scaffolds.
- **Decisiones abiertas (`[POR DEFINIR]`):** proveedor SMS/WhatsApp, hosting, estrategia de
  web push, versión exacta de pnpm a fijar en CI, estrategia de expiración (cron vs. lectura).

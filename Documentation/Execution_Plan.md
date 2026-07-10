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
- **Ramas:** `dev` (default) es la base de las tareas; cada tarea sale de `dev` en una
  rama `nexa-00x-slug` y regresa por PR. Promoción `dev → qa → prod` (cada una un entorno).
  Ver `Documentation/Branching.md`.
- **Definition of Done por step:** compila (`typecheck`), pasa lint y, si aplica, tests.
- Cada tarea NEXA-xxx se subdivide en steps aquí; los steps se afinan al empezar la tarea.

---

## Sprint 1 (sem 1–2) — Base del proyecto

Reorganizado en **fases** y **tracks paralelos** (🔵 backend / 🟠 frontend) alrededor de
una **rebanada vertical** (walking skeleton), en lugar de completar capas horizontalmente.
Respeta las dependencias del CSV pero prioriza tener algo demoable pronto y desbloquear
ambos tracks desde el día 1.

```
Fase 0  Fundaciones ──────────────► 002 config → 003 types
                                          │
Fase 1  Tracks en paralelo ───────►  🔵 004 → 005 → 006     🟠 012 → 011
                                          └────────┬─────────────┘
Fase 2  Rebanada vertical ────────►  008(join) + 010(entry_added) + client join + reception board
                                          │
Fase 3  Engordar ─────────────────►  007 restaurant · 008 resto · 010 resto · 009 identity
```

### Fase 0 — Fundaciones (bloqueantes; primero y rápido)

#### NEXA-001 · Init monorepo — ✅ HECHO

- [x] **S1.** Scaffold del monorepo (pnpm-workspace, package.json raíz, turbo.json,
      .gitignore, .nvmrc, .npmrc, `apps/` y `packages/`).
- [x] **S2.** `CLAUDE.md` + `README.md` (estructura, `apps/landing`, Turborepo, regla de
      idioma inglés, regla de design system / librería de componentes).
- [x] **S3.** Importar documentación + `Execution_Plan.md` + `UI_Mocks_Map.md`.

#### NEXA-002 · Package de config compartida — ✅ HECHO

- [x] **S1.** `packages/config` (`@nexa/config`) con `tsconfig.base.json` (strict).
      → `chore(config): add base tsconfig`
- [x] **S2.** ESLint compartido (flat config, typescript-eslint + prettier compat).
      → `chore(config): add shared eslint config`
- [x] **S3.** Prettier compartido. → `chore(config): add shared prettier config`

#### NEXA-003 · Package de tipos/contratos — ✅ HECHO

- [x] **S1.** `packages/types` (`@nexa/types`) init como internal package (exporta source,
      sin build). → `chore(types): init shared types package`
- [x] **S2.** DTOs de dominio (Restaurant, Queue, WaitlistEntry, User, StaffUser,
      Notification, ServiceReview) + enums de estado. → `feat(types): add domain DTOs and enums`
- [x] **S3.** Payloads de eventos WebSocket (`entry_added/updated/removed`) + contratos
      REST. → `feat(types): add websocket event and API contracts`

### Fase 1 — Arrancan los dos tracks en paralelo

#### 🔵 Backend (Omar)

**NEXA-004 · Esqueleto backend Express** — ✅ HECHO

- [x] **S1.** `apps/api` init (Node + Express + TS), healthcheck, arranque local (tsx). → `feat(api): bootstrap express server with healthcheck`
- [x] **S2.** Estructura `src/contexts/`, middlewares y manejo de errores. → `feat(api): add app structure and error handling`
- [x] **S3.** Env tipada (dotenv + validación). → `feat(api): add typed env config`

**NEXA-005 · Prisma + PostgreSQL** — ✅ HECHO

- [x] **S1.** Prisma init + Postgres local (docker-compose, host 5433). → `feat(api): set up prisma and local postgres`
- [x] **S2.** Schema inicial (entidades de la Spec). → `feat(api): add initial prisma schema`
- [x] **S3.** Primera migración + **seed de 1 restaurante + colas** (para la rebanada vertical). → `feat(api): add first migration and seed`

**NEXA-006 · Estructura DDD por bounded context** — ✅ HECHO

- [x] **S1.** Capas de `waitlist`. → `feat(api): scaffold waitlist context layers`
- [x] **S2.** Capas de `restaurant`. → `feat(api): scaffold restaurant context layers`
- [x] **S3.** Capas de `notifications`. → `feat(api): scaffold notifications context layers`
- [x] **S4.** Capas de `identity`. → `feat(api): scaffold identity context layers`

#### 🟠 Frontend (tú)

**NEXA-012 · Package de UI compartida (design system)** — ✅ HECHO

- [x] **S1.** `packages/ui` init + tokens desde `DESIGN.md` (Tailwind preset). → `feat(ui): init design system tokens`
- [x] **S2.** Primitivas (Button pill, Card, Input) + helper `cn`. → `feat(ui): add base components`
- [x] **S3.** Componentes de dominio desde mocks (StatusBadge, Stepper, WaitCard, StatusTimeline, BottomSheet). → `feat(ui): add domain components from mocks`

**NEXA-011 · Scaffold de apps Next.js** — ✅ HECHO

- [x] **S1.** `apps/landing` (Next.js 15 + TS + Tailwind + `@nexa/ui`, build + smoke verificados). → `feat(landing): scaffold next.js app`
- [x] **S2.** `apps/client` (mobile-first, join starter). → `feat(client): scaffold next.js app`
- [x] **S3.** `apps/reception` (board starter). → `feat(reception): scaffold next.js app`
- [x] **S4.** `apps/admin` (dashboard starter). → `feat(admin): scaffold next.js app`

### Fase 2 — Rebanada vertical (walking skeleton demoable) — ✅ HECHO

Flujo objetivo: _el comensal se une a la fila → aparece en el board de recepción en
tiempo real._ Arranca con **guest-only** (stub de identity). Verificado end-to-end.

- [x] **NEXA-008 (parcial).** Waitlist core: `WaitlistEntry` + `JoinWaitlist` + endpoints REST. → `feat(api): add waitlist join and entry domain`
- [x] **NEXA-010 (parcial).** WebSockets: socket.io con rooms + emitir `entry_added`. → `feat(api): add websocket server and emit entry_added`
- [x] **client.** Pantalla de alta → POST al API + confirmación (lugar/ETA). → `feat(client): add join waitlist screen`
- [x] **reception.** Board suscrito al WS que refleja altas en vivo. → `feat(reception): add live queue board`

### Fase 3 — Engordar

- [x] **NEXA-007** ✅ Restaurant config: repos + `RestaurantConfig` (update config, add/rename queues) + endpoints, y UI `/configuracion` en admin. → `feat(api): add restaurant config use cases` · `feat(admin): add restaurant config UI`
- [x] **NEXA-008 (resto)** ✅ Acciones waitlist: `Notify` / `Seat` / `MarkNoShow` / `Cancel` con guardas de estado + endpoints + botones en el board. → `feat(api): add waitlist status transitions` · `feat(reception): wire queue actions and live updates`
- [x] **NEXA-010 (resto)** ✅ WS: emisión de `entry_updated` / `entry_removed` y board reactivo. _(Falta: auth de subscripción por restaurante/cola → va con NEXA-009.)_
- [x] **NEXA-009** ✅ Identity completo (BetterAuth email/password + bearer): user con `role`
      (diner/hostess/admin), acciones de recepción + config + subscripción WS protegidas por
      staff, login en admin/reception, y modo comensal registrado en client (`/cuenta`).
      Seed de staff admin `owner@demo.nexa`. → `feat(api): integrate betterauth` · `feat(api): protect staff actions and seed admin` · `feat(identity): add staff login and route guards` · `feat(client): add registered-diner mode`

---

## Sprint 2 (sem 3–4) — Producto vertical + publicación

Tareas NEXA-013 … NEXA-026 (se subdividen en steps al iniciar cada una):

- [x] **NEXA-013** ✅ client: flujo de alta (join) _(Fase 2)_ · [x] **NEXA-014** ✅ client:
      estado en espera en vivo (posición/ETA/mesa lista) · [x] **NEXA-015** ✅ client: catálogo (/explorar + join por código) ·
      [x] **NEXA-016** ✅ client: evaluación post-servicio (rating + comentario en estado sentado).
- [x] **NEXA-017** ✅ reception: cola en vivo multi-cola (tabs) · [x] **NEXA-018** ✅ reception: alta manual (walk-in).
- **NEXA-019** admin: dashboard · [x] **NEXA-020** ✅ admin: UI de configuración _(NEXA-007)_.
- **NEXA-021** notifications: web push · [x] **NEXA-023** ✅ expiración & no-show (barrido periódico notified→no_show).
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
- **Hecho:** Fase 0 completa — NEXA-002 (config: tsconfig/eslint/prettier) y NEXA-003
  (types: DTOs, enums, eventos WS y contratos REST).
- **Hecho:** Fases 0, 1, 2 y **3** completas → **Sprint 1 cerrado** (alcance extendido).
  Operación básica end-to-end con auth: comensal (guest o registrado) se une, la hostess
  avisa/sienta/no-show en vivo, el dueño configura, todo protegido por login de staff.
- **Credenciales dev:** staff admin `owner@demo.nexa` / `ownerpass123` (seed).
- **Siguiente:** **Sprint 2** — completar pantallas contra los mocks (client: espera en vivo,
  catálogo, evaluación; reception: alta manual, detalle; admin: dashboard real), web push,
  expiración/no-show, la **landing**, y CI/CD para publicar.
- **Decisiones abiertas (`[POR DEFINIR]`):** proveedor SMS/WhatsApp, hosting, estrategia de
  web push, versión exacta de pnpm a fijar en CI, estrategia de expiración (cron vs. lectura).

```

```

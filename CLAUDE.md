# CLAUDE.md — Nexa

> Guía para Claude (y cualquier asistente de IA) al trabajar en este repositorio.
> Léela completa antes de proponer o escribir código.

## Qué es Nexa

Nexa es una plataforma que conecta clientes y negocios. El primer producto es una
**solución de listas de espera para restaurantes**: el comensal se anota digitalmente
(QR, código o catálogo), recibe notificaciones sobre su turno, y el restaurante
gestiona la fila en tiempo real con un panel de métricas.

Aunque arrancamos con restaurantes, el sistema se diseña de forma **genérica** para
poder aplicarse a otros negocios con filas de espera (clínicas, barberías, retail).

**Estado:** MVP en construcción. Escala inicial pequeña y controlada. La prioridad es
una experiencia de usuario excelente y tiempo real fluido.

## Principios de arquitectura (respetar siempre)

1. **Un solo backend compartido.** Las apps de frontend operativas (`client`,
   `reception`, `admin`) consumen el mismo backend. No dupliques lógica de negocio en
   los frontends. (`landing` es marketing mayormente estático y casi no lo consume.)
2. **Domain-Driven Design en el backend.** La lógica de negocio vive en el dominio,
   organizada por bounded contexts. No metas reglas de negocio en controladores ni en
   componentes de UI.
3. **Monorepo con pnpm workspaces.** Código compartido en `packages/`, cosas
   ejecutables en `apps/`.
4. **TypeScript de punta a punta.** Sin `any` salvo justificación explícita.
5. **Tiempo real de primera clase.** La cola se actualiza vía WebSockets; la UI nunca
   debe depender de recargar la página para reflejar cambios.
6. **Todo el estado y el contenido viven en el backend DDD.** Strapi está aplazado
   y `apps/cms` no existe todavía (ver «Strapi: aplazado»).
7. **Simplicidad primero.** Estamos en MVP. No introduzcas microservicios, colas de
   mensajes, ni complejidad de infraestructura sin una razón concreta.

## Stack

- **Monorepo:** pnpm workspaces + Turborepo (orquestación de tareas y caché)
- **Frontends:** Next.js (React, TypeScript) — 3 apps
- **Backend:** Node.js + Express (TypeScript), con WebSockets integrados en el
  mismo proceso
- **ORM / datos:** Prisma sobre PostgreSQL
- **CMS:** ninguno por ahora — Strapi aplazado (ver «Strapi: aplazado»)
- **Auth:** BetterAuth (modo guest y registrado)
- **Notificaciones:** web push (gratis) + SMS/WhatsApp vía Twilio (de pago)

## Estructura del monorepo

```
nexa/
├── apps/
│   ├── landing/         # Sitio de marketing (público, SEO/conversión) — Next.js
│   ├── client/          # Webapp cliente (móvil) — Next.js
│   ├── reception/       # Webapp hostess (tablet/desktop) — Next.js
│   ├── admin/           # Panel dueño (desktop) — Next.js
│   └── api/             # Backend Node/Express + WebSockets (DDD)
│                       # (no hay apps/cms: Strapi está aplazado)
├── packages/
│   ├── types/           # Tipos y contratos compartidos (DTOs, eventos WS)
│   ├── config/          # Config compartida (tsconfig, eslint, prettier)
│   └── ui/              # Design system + componentes compartidos (ver Mocks/)
├── package.json
├── pnpm-workspace.yaml
├── turbo.json
├── CLAUDE.md
└── README.md
```

> `landing` vive en el monorepo como un workspace más. La separación de su despliegue
> respecto al resto de las apps es un asunto de CI/CD (postbuild), no de la estructura.

### Reglas de dependencia entre workspaces

- Las apps de frontend (`landing`, `client`, `reception`, `admin`) **pueden** importar
  de `packages/*`. **No** importan directamente del código interno de `apps/api`; se
  comunican con el backend por HTTP/WebSocket usando los contratos de `packages/types`.
- `apps/api` **puede** importar de `packages/types` y `packages/config`. **No** importa
  de las apps de frontend ni de `packages/ui`.
- `packages/*` no dependen de ninguna `app`.
- Los contratos de API y los payloads de eventos WebSocket viven en `packages/types`
  para que backend y frontends compartan una única fuente de verdad.

## Backend: Domain-Driven Design

`apps/api` se organiza en **bounded contexts**. Los del MVP:

- **`waitlist`** — el núcleo. Colas, entradas de la fila (WaitlistEntry), estados
  (waiting → notified → seated → no_show / cancelled), posición y cálculo de ETA.
- **`restaurant`** — restaurantes, su configuración, definición de colas (VIP,
  visitante), parámetros (ETA base sintético, tiempo de expiración).
- **`notifications`** — envío por web push, SMS y WhatsApp; enrutado según el plan
  del restaurante. Integración con Twilio.
- **`identity`** — autenticación y usuarios. BetterAuth. Modo guest (con nombre tipo
  gamertag) y registrado con correo. Staff (hostess/admin).
- **`surveys`** — formularios configurables, genéricos por diseño. Un `Survey` tiene
  un `purpose` (`intake` al anotarse, `feedback` post-visita), preguntas tipadas y una
  definición **versionada**: cambiar lo que una pregunta significa sube la versión, para
  que las respuestas viejas se sigan leyendo con la definición bajo la que se dieron.
- **`memberships`** — programa de lealtad por restaurante: niveles, puntos y premios.
  El saldo se **deriva de un ledger append-only**, nunca se guarda como contador
  mutable, de modo que cada punto es auditable y disputable.

### Capas dentro de cada bounded context

Cada context sigue la misma estructura de capas:

```
apps/api/src/contexts/<context>/
├── domain/           # Entidades, value objects, eventos de dominio, interfaces de repo.
│                     # Lógica de negocio pura. SIN dependencias de framework ni de Prisma.
├── application/      # Casos de uso / servicios de aplicación. Orquestan el dominio.
│                     # Definen puertos (interfaces) que la infraestructura implementa.
├── infrastructure/   # Implementaciones concretas: repos con Prisma, clientes Twilio,
│                     # y, el día que se incorpore, adaptadores a Strapi.
└── interfaces/       # Entrada/salida: controladores HTTP (Express), handlers de
                      # WebSocket, mapeo DTO ↔ dominio.
```

**Regla de dependencias (hacia adentro):** `interfaces` → `application` → `domain`.
La `infrastructure` implementa interfaces definidas en `domain`/`application`.
El `domain` no conoce a nadie hacia afuera: no importa Express, ni Prisma, ni Twilio.

### Convenciones de backend

- Un caso de uso por acción de negocio (ej. `JoinWaitlist`, `NotifyDiner`,
  `SeatDiner`, `MarkNoShow`).
- Los repositorios se definen como interfaces en el dominio y se implementan con
  Prisma en infraestructura.
- Los eventos de dominio relevantes (ej. `DinerJoined`, `TableReady`) disparan
  emisiones por WebSocket y/o notificaciones, orquestados desde la capa de aplicación.
- Nada de SQL crudo salvo casos justificados; usar Prisma.

## Tiempo real (WebSockets)

- Vive **dentro del mismo proceso de Express** (no es un servicio aparte).
- Modelo de "rooms": cada restaurante/cola tiene su canal. La recepción se suscribe a
  las colas de su restaurante; el cliente se suscribe a su propia entrada.
- Eventos principales: `entry_added`, `entry_updated` (cambio de estado/posición),
  `entry_removed`. Los payloads viven en `packages/types`.
- La UI de recepción y la del cliente reflejan cambios sin recargar.

## Frontend: design system y librería de componentes

La identidad visual está definida en `Documentation/Mocks/nexa_design_system/DESIGN.md`
(paleta cálida coral `#F2755C` + teal `#4FB0A5`, tipografías Quicksand + Be Vietnam Pro,
radios grandes, botones pill, sombras suaves). Los mocks de cada pantalla están en
`Documentation/Mocks/` (HTML + PNG generados con Google Stitch). El mapeo pantalla → app
está en `Documentation/UI_Mocks_Map.md`.

Reglas al construir UI:

1. **`packages/ui` es la fuente única del design system.** Los tokens (colores,
   tipografía, spacing, radios, sombras) y los componentes base (Button pill, Card,
   Input, Chip/Badge, BottomSheet, Stepper, StatusTimeline, etc.) viven ahí y se
   reutilizan en `landing`, `client`, `reception` y `admin`. No redefinas estilos por app.
2. **Encapsula a partir de los mocks.** Al implementar una pantalla, identifica los
   patrones repetidos y extráelos como componentes reutilizables en `packages/ui` en vez
   de copiarlos por app. Si un patrón lo usa una sola app, puede vivir en esa app hasta
   que se repita (regla de tres).
3. **Componentes presentacionales.** `packages/ui` no conoce el backend ni el dominio: el
   fetching, WebSocket y estado viven en las apps. Los componentes reciben datos por props.
4. **Copy en español (es-MX), API en inglés.** Nombres de componentes, props y
   comentarios en inglés; el texto visible por defecto puede ir en español o exponerse
   como prop para que cada app pase su copy.
5. **Shared libraries.** Además de `ui`, extrae a `packages/*` cualquier lógica que
   compartan 2+ apps (utilidades de formato, cliente de API/WS tipado sobre
   `packages/types`). Crea un package nuevo solo cuando el patrón se repite; no
   sobre-abstraigas en el MVP.

## Strapi: aplazado (leer antes de asumir que existe)

**Hoy no hay `apps/cms` y nada consume Strapi.** Todo — estado operativo y
contenido configurable por igual — vive en el backend DDD (`apps/api`). Si algo en
la documentación describe un CMS en funcionamiento, esa parte está desactualizada;
manda el código.

Lo que en el plan original iba a Strapi está implementado como bounded contexts:

| Responsabilidad                   | Dónde vive hoy                           |
| --------------------------------- | ---------------------------------------- |
| Formularios de alta configurables | contexto `surveys` (`purpose: intake`)   |
| Encuesta post-visita              | contexto `surveys` (`purpose: feedback`) |
| Catálogo de restaurantes, textos  | contexto `restaurant` (`apps/api`)       |

**Por qué.** Las encuestas no son sólo contenido: sus respuestas se validan contra
una definición versionada y alimentan métricas. Esa regla vive en el dominio, no en
un CMS. Montar Strapi para el MVP habría partido la fuente de verdad en dos sin
resolver ningún problema que tuviéramos.

**Cuándo incorporarlo.** Cuando aparezca contenido genuinamente editorial —
landings por restaurante, textos con flujo de aprobación, media library — es decir,
cuando alguien que no es desarrollador necesite publicar sin desplegar.

**Cómo, llegado el caso.** Los frontends hablan con el backend a través de
`packages/api-client`, y cada contexto define sus puertos en `domain`/`application`.
Migrar significa escribir un adaptador a Strapi en `infrastructure` y dejar el resto
intacto: es un cambio de implementación, no de arquitectura. Ese desacople es la
razón de que aplazarlo sea barato.

Regla que se mantiene pase lo que pase: **toda operación sobre la cola pasa por el
backend.**

## Modelo de datos (referencia)

Entidades principales (gestionadas por Prisma en el backend): `Restaurant`, `Queue`,
`WaitlistEntry`, `User`, `StaffUser`, `Notification`, `ServiceReview`.
El detalle de campos está en la Especificación Técnica del proyecto. Los datos de cada
restaurante se separan lógicamente por `restaurantId` (no hay multi-tenancy física
compleja en el MVP).

## Reglas de negocio clave (no romper)

- **Alta flexible:** el comensal entra por QR, código o catálogo; en modo guest
  (nombre tipo gamertag o propio) o registrado. El formulario es configurable desde
  el panel del dueño (contexto `surveys`, `purpose: intake`).
- **Múltiples colas** por restaurante desde el MVP (ej. General, VIP, Visitante).
- **ETA:** arranca con un estimado **sintético** (valor base por restaurante) y se
  ajusta de forma **dinámica** con datos reales de rotación. La hostess puede fijar un
  valor manual.
- **Expiración/no-show:** tiempo parametrizable por restaurante; al avisar (`notified`)
  se marca el tiempo y, si no se presenta en X minutos, pasa a `no_show`.
- **Notificaciones:** web push gratis; SMS/WhatsApp solo en plan de pago.

## Convenciones generales

- **Idioma del código (obligatorio):** TODO el código en inglés — nombres de variables,
  funciones, tipos, archivos, comentarios y **mensajes de commit**. Esto aplica aunque
  los prompts o la conversación estén en español. Los únicos textos en español son:
  (a) el copy visible para el usuario en la UI (es-MX) y (b) la documentación del
  proyecto (archivos `.md`, docs de negocio), que puede escribirse en español.
- **Commits:** Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`,
  `test:`, `ci:`, etc.), **siempre en inglés**. Un commit por step: cada tarea de sprint
  se subdivide en steps y cada step es un commit (ver `Documentation/Execution_Plan.md`).
- **Ramas:** `dev` (default, base de todas las tareas) → `qa` → `prod`, cada una mapeada
  a un entorno vía CD. El trabajo de cada tarea sale de `dev` en una rama `nexa-00x-slug`
  y regresa a `dev` por PR; nunca se commitea directo a `qa`/`prod` (solo por promoción).
  Detalle en `Documentation/Branching.md`.
- **Formato:** Prettier + ESLint compartidos desde `packages/config`.
- **Tests (OBLIGATORIO):** las pruebas **unitarias con Vitest son obligatorias**. Todo
  caso de uso / lógica de dominio del backend y toda utilidad/componente con lógica del
  frontend deben tener tests. Cada `feat` que agregue lógica incluye sus tests en el mismo
  PR; el dominio y los casos de uso (que dependen de puertos, no de infraestructura) se
  testean de forma aislada con repos/publishers de prueba (sin DB). Script: `pnpm test`
  (via Turbo). **E2E de backend** (Vitest + Postgres real): `pnpm --filter @nexa/api test:e2e`.
  **E2E de frontend** (Playwright, multi-app en tiempo real): `pnpm test:e2e:web` (requiere
  Postgres en :5433). Los E2E corren aparte del CI rápido de PR.
- **Variables de entorno:** nunca commitear secretos. Usar `.env` local y documentar
  las variables necesarias en el README.

## Qué hacer / qué evitar al asistir en este repo

**Hazlo:**

- Respeta las capas DDD y la dirección de dependencias.
- Coloca tipos y contratos compartidos en `packages/types`.
- Mantén el dominio libre de framework.
- Pregunta o marca `[POR DEFINIR]` cuando falte una decisión, en vez de inventar.

**Evítalo:**

- Meter reglas de negocio en controladores Express o componentes React.
- Duplicar lógica entre las tres apps (extráela a `packages/`).
- Acceder a la base de datos desde los frontends (siempre vía backend).
- Introducir dependencias pesadas o infraestructura nueva sin justificarlo.
- Dar por hecho que Strapi existe: hoy no hay `apps/cms`. Antes de "integrarlo",
  lee «Strapi: aplazado».

## Comandos (referencia; ajustar al implementar)

```bash
pnpm install                 # instalar todo el monorepo
pnpm dev                     # levantar apps en desarrollo (ajustar según scripts)
pnpm --filter client dev     # levantar solo la webapp cliente
pnpm --filter api dev        # levantar solo el backend
pnpm lint                    # lint en todo el monorepo
pnpm test                    # tests
```

> Nota: los scripts exactos se definen a medida que se implementa cada workspace.
> Si un comando aquí no coincide con el `package.json`, el `package.json` manda.

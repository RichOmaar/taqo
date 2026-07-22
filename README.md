# Nexa

> Conectamos clientes y negocios.

Nexa es una plataforma de listas de espera para restaurantes. El comensal se anota
digitalmente (escaneando un QR, con un código o desde el catálogo), recibe
notificaciones sobre su turno, y el restaurante gestiona la fila en tiempo real con un
panel de métricas.

Diseñada de forma genérica para, más adelante, extenderse a otros negocios con filas de
espera (clínicas, barberías, retail) y a más servicios (reservas, CRM, menú, pagos).

**Estado:** MVP en construcción.

---

## Arquitectura

Monorepo con **pnpm workspaces** + **Turborepo**. Un sitio de marketing y tres frontends
operativos (Next.js) sobre un **backend compartido** (Node + Express con WebSockets
integrados), organizado con **Domain-Driven Design**, datos en **PostgreSQL** vía
**Prisma**. Sin CMS por ahora: Strapi está aplazado (ver «Strapi: aplazado»).

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
│   ├── api-client/      # Cliente HTTP/WS tipado + sesión compartida
│   ├── config/          # Config compartida (tsconfig, eslint, prettier)
│   └── ui/              # Design system + componentes compartidos
├── package.json
├── pnpm-workspace.yaml
├── turbo.json
├── CLAUDE.md
└── README.md
```

### Componentes

| Workspace             | Qué es                                                                               | Tecnología     |
| --------------------- | ------------------------------------------------------------------------------------ | -------------- |
| `apps/landing`        | Sitio de marketing público. Propuesta de valor, precios, captación. SEO/rendimiento. | Next.js        |
| `apps/client`         | App del comensal. Alta en la fila, posición, ETA, notificaciones. Móvil.             | Next.js        |
| `apps/reception`      | App de la hostess. Gestión de la cola en tiempo real. Tablet/desktop.                | Next.js        |
| `apps/admin`          | Panel del dueño. Configuración y métricas. Desktop.                                  | Next.js        |
| `apps/api`            | Backend compartido. Lógica de negocio (DDD), API REST y WebSockets.                  | Node + Express |
| `packages/types`      | Contratos compartidos: DTOs de API y payloads de eventos WebSocket.                  | TypeScript     |
| `packages/api-client` | Cliente tipado de la API y el WebSocket, más la sesión compartida.                   | TypeScript     |
| `packages/config`     | Configuración compartida de tooling.                                                 | TypeScript     |
| `packages/ui`         | Componentes de interfaz reutilizados por las apps.                                   | React          |

### Backend (DDD)

`apps/api` se divide en bounded contexts: **waitlist** (colas y entradas),
**restaurant** (restaurantes, configuración y métricas), **notifications** (web push /
SMS / WhatsApp), **identity** (auth y usuarios), **surveys** (formularios
configurables, versionados) y **memberships** (lealtad: niveles, puntos, premios).
Cada context sigue capas `domain` → `application` → `infrastructure` → `interfaces`,
con el dominio libre de dependencias de framework.

### Strapi: aplazado

**No existe `apps/cms` y nada consume Strapi.** Todo — estado operativo y contenido
configurable — vive en el backend DDD. Los formularios de alta y la encuesta
post-visita, que el plan original ponía en el CMS, son el contexto **surveys**: sus
respuestas se validan contra una definición versionada y alimentan métricas, así que
son dominio, no contenido.

Se incorporará cuando aparezca contenido genuinamente editorial (landings por
restaurante, textos con aprobación, media library). Como los frontends hablan con el
backend vía `packages/api-client` y cada contexto define sus puertos, migrar será
escribir un adaptador en `infrastructure` — un cambio de implementación, no de
arquitectura.

Toda operación sobre la cola pasa por el backend.

---

## Stack

- **Monorepo:** pnpm workspaces + Turborepo
- **Frontend:** Next.js (React, TypeScript)
- **Backend:** Node.js + Express (TypeScript) + WebSockets
- **Base de datos:** PostgreSQL
- **ORM:** Prisma
- **CMS:** ninguno por ahora (Strapi aplazado)
- **Auth:** BetterAuth
- **Notificaciones:** Web push + Twilio (SMS/WhatsApp)

---

## Empezar

### Requisitos

- Node.js (versión LTS recomendada) — [POR DEFINIR: fijar versión]
- pnpm — [POR DEFINIR: fijar versión]
- PostgreSQL en local (o vía Docker) — [POR DEFINIR]

### Instalación

```bash
# Clonar el repo
git clone [POR DEFINIR: url del repo]
cd nexa

# Instalar dependencias de todo el monorepo
pnpm install

# Configurar variables de entorno (ver sección Variables de entorno)
cp .env.example .env
# editar .env con tus valores

# Preparar la base de datos (Prisma)
pnpm --filter api prisma migrate dev   # [ajustar según scripts reales]
```

### Desarrollo

```bash
# Levantar todo (ajustar según los scripts que se definan)
pnpm dev

# O levantar workspaces individuales
pnpm --filter client dev       # webapp cliente
pnpm --filter reception dev    # webapp hostess
pnpm --filter admin dev        # panel admin
pnpm --filter api dev          # backend
```

> Los scripts exactos se irán definiendo a medida que se implemente cada workspace.
> El `package.json` de cada uno es la fuente de verdad de sus comandos.

---

## Variables de entorno

Documentar aquí las variables necesarias (no commitear el `.env` real). Valores de
ejemplo en `.env.example`:

```
# Base de datos
DATABASE_URL=postgresql://user:password@localhost:5432/nexa

# Backend
API_PORT=[POR DEFINIR]

# Auth (BetterAuth)
BETTER_AUTH_SECRET=<secreto aleatorio de 32+ caracteres>
BETTER_AUTH_URL=http://localhost:4000
# Orígenes que pueden autenticarse, separados por coma. Por defecto los puertos
# locales de client/reception/admin; los E2E y cada entorno desplegado corren en
# otros puertos y deben declarar los suyos.
TRUSTED_ORIGINS=http://localhost:3002,http://localhost:3003,http://localhost:3004

# Twilio (SMS / WhatsApp)
[POR DEFINIR]
```

---

## Scripts útiles

```bash
pnpm install     # instalar todo el monorepo
pnpm dev         # desarrollo
pnpm build       # build de producción
pnpm lint        # lint
pnpm test        # tests
```

---

## Documentación del proyecto

Documentos de producto y negocio (fuera del repo o en `/docs`, según se decida):

- PRD — definición de producto y alcance del MVP
- Especificación Técnica — arquitectura y modelo de datos detallados
- Roadmap, Lean Canvas, modelo de precios y demás material de negocio

Para asistentes de IA que trabajen en el código, ver **`CLAUDE.md`** en la raíz: contiene
las reglas de arquitectura, las convenciones DDD y qué hacer / evitar.

---

## Roadmap (resumen)

1. **Fase 1 (actual):** MVP de listas de espera.
2. **Fase 2:** reservaciones y CRM de comensales.
3. **Fase 3:** menú digital, pagos e integración con POS.
4. **Fase 4:** expansión a otros verticales y app móvil nativa.

---

## Pruebas

| Workspace        | Unitarios (Vitest) | E2E                         |
| ---------------- | ------------------ | --------------------------- |
| `apps/api`       | ✅                 | ✅ Vitest + Postgres real   |
| `packages/types` | ✅                 | —                           |
| `packages/ui`    | ✅ (Testing Lib)   | —                           |
| `apps/client`    | ✅                 | ✅ Playwright (multi-app)   |
| `apps/reception` | —                  | ✅ Playwright (tiempo real) |
| `apps/admin`     | ✅                 | —                           |

- `pnpm test` — unitarios en todo el monorepo (obligatorios, ver `CLAUDE.md`).
- `pnpm --filter @nexa/api test:e2e` — E2E de backend (crea una DB aislada `nexa_e2e`).
- `pnpm test:e2e:web` — E2E de frontend con Playwright (recepción ↔ comensal en vivo).
  Requiere Postgres en `:5433` (`docker compose up -d postgres`).

---

## Ramas y entornos

Tres ramas de larga vida mapeadas a entornos: **`dev`** (default, base de tareas) →
**`qa`** → **`prod`**. El trabajo de cada tarea sale de `dev` en una rama `nexa-00x-slug`
y vuelve por PR. Detalle en [`Documentation/Branching.md`](Documentation/Branching.md).

---

## Licencia

[POR DEFINIR]

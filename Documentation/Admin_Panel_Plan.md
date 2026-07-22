# Plan — Panel de Administración (Dueño)

Plan de trabajo para completar `apps/admin`. Sigue las convenciones de
`Execution_Plan.md`: **cada step = un commit**, Conventional Commits en inglés.

- Fuente de UI: `Documentation/Mocks/*_due_o/` (4 mocks) + `UI_Mocks_Map.md` + `DESIGN.md`.
- Reglas de arquitectura: `CLAUDE.md` (raíz).
- Rama: `admin-panel` (sale de `dev`, regresa por PR).

> Los mocks son referencia visual, **no** la fuente de verdad. Donde falte una decisión se
> marca `[POR DEFINIR]` en vez de inventar.

---

## 1. Hallazgo que condiciona todo el plan

**Los mocks prometen datos que el backend no tiene.** El dashboard actual muestra
`410 min` de espera promedio con `0` personas hoy porque
`prisma-metrics-repository.ts:36-41` promedia **todas** las entradas sentadas desde el
inicio de los tiempos, sin acotar por fecha. La firma completa del repo es
`compute(restaurantId)` — sin rango, sin buckets, sin desglose por cola.

Estado de cada elemento del mock `panel_de_m_tricas_nexa_due_o`:

| Elemento del mock                          | ¿Respaldado hoy?                                        |
| ------------------------------------------ | ------------------------------------------------------- |
| 4 tarjetas KPI                             | Parcial — los valores existen, los deltas "vs ayer" no  |
| Gráfica "Volumen de fila por hora"         | ❌ No existe serie temporal                              |
| Heatmap "Horas pico"                       | ❌ No existe agregación día × hora                       |
| "Reseñas recientes"                        | ❌ `ServiceReview` se escribe pero **no tiene endpoint de lectura** |
| Uso del plan ("450/500 notificaciones")    | ❌ El modelo `Notification` está muerto (0 escrituras)   |

**Conclusión:** el trabajo de gráficas no empieza por d3, empieza por el backend de
métricas. d3 se usa acotado a submódulos (`d3-scale`, `d3-shape`, `d3-array`), no el
bundle completo.

---

## 2. Decisiones tomadas

| Tema                  | Decisión                                                                 |
| --------------------- | ------------------------------------------------------------------------ |
| **Mesas**             | **Diferido.** Sin modelo, sin migración, sin endpoints. No entra en este bloque. |
| **Reseñas**           | **En alcance.** Módulo de lectura + detalle.                              |
| **Encuestas**         | **En alcance.** Builder de encuesta post-visita.                           |
| **Backend métricas**  | **En alcance.** Rango de fechas + series temporales + deltas.              |
| **Gestión de staff**  | **Diferido.** El contexto `identity` sigue siendo un cascarón.             |
| **Motor de builder**  | **Contexto `surveys` propio en el backend DDD** — ver §6.                   |
| **Strapi**            | **Se pospone, no se descarta.** Todo en DDD ahora; se incorpora cuando haya razón — ver §6.1. |
| **Design tokens**     | `packages/ui/src/tokens.ts` es canónico. Se **extiende**, no se reescribe — ver §4.3. |
| **Membresías**        | **En alcance.** Contexto `memberships` propio: niveles, visitas, recompensas — ver §7. |
| **Multi-sede**        | **Un dueño = un restaurante.** Sin selector; el modelo queda compatible con cadenas.    |
| **Scope de staff**    | **Se arregla en Fase A** (NEXA-064), no se difiere — ver §11.                            |
| **Día de métricas**   | **Zona horaria del restaurante, medianoche de calendario.** Sin corte de jornada.        |
| **Orden de trabajo**  | Fundaciones → Panel → métricas reales → membresías → encuestas → resto (§9).            |

---

## 3. Arquitectura de información (definitiva)

Los 4 mocks de admin **no coinciden entre sí**: tres sidebars distintos, tres headers de
marca distintos, dos tratamientos de estado activo. `panel_de_metricas` no tiene "Mesas";
`personalizacion` no tiene "Plan"; `gestion_de_plan` pone "Plan" debajo de "Ayuda". Esta es
la IA canónica que implementamos:

```
Panel            KPIs, gráficas, reseñas recientes
Lista de espera  cola en vivo + historial/búsqueda/export
Reseñas          detalle de ratings + comentarios
Encuestas        builder (alta + post-visita) + resultados
Membresías       programa, niveles, recompensas + analítica
Configuración    datos del restaurante, colas, ETA, expiración, QR
Plan             suscripción + consumo
─────────────
Ayuda · Salir
```

`Encuestas` y `Membresías` no están en los mocks — son módulos nuevos (§6 y §7). Se agregan
a la navegación con el mismo tratamiento visual que el resto.

"Mesas" **no** aparece en la navegación hasta que exista backend (evita links muertos como
en los mocks). Marca única: `Nexa` + nombre del restaurante como subtítulo.

---

## 4. Fundaciones (boilerplate)

### 4.1 `packages/api-client` (nuevo)

Hoy `apps/admin/src/lib/api.ts` es fetch a mano y está duplicado en reception/client.
`CLAUDE.md` ya anticipa este package ("cliente de API/WS tipado sobre `packages/types`").

Contiene:

- Cliente HTTP tipado sobre los contratos de `packages/types`.
- Wrapper de socket.io con las rooms de `websocket.ts`.
- **Store de sesión** (Zustand): usuario, rol y **restaurante activo**.

> El síntoma concreto que resuelve: `apps/admin/src/app/page.tsx:13` tiene
> `const CODE = 'DEMO'` hardcodeado. No hay noción de restaurante activo en ninguna app.

### 4.2 `packages/ui` (extender)

Hoy exporta 9 componentes, ninguno con forma de panel de administración. Se agregan:

- **Shell:** `AppShell`, `Sidebar`, `TopBar`, `NavItem`.
- **Datos:** `StatCard`, `DataTable`, `EmptyState`, `Toggle`, `Slider`, `RangePicker`.
- **Gráficas** (`packages/ui/src/charts/`): `GroupedBarChart`, `Heatmap`,
  `RatingDistribution`, `ProgressMeter`, `Sparkline`.

Las gráficas viven en `packages/ui` (no en un package aparte) hasta que una segunda app las
necesite — **regla de tres**. Se mantienen presentacionales: reciben datos por props y
devuelven SVG; no conocen el backend, respetando la regla de `CLAUDE.md`.

> ⚠️ **Coordinar con la rama `landing-page`.** Esa rama agrega `Header`, `Footer`, `Badge`,
> modifica `Card` y toca `packages/ui/package.json` — exactamente los archivos de esta
> fase. **Integrar `landing-page` a `dev` antes** de empezar NEXA-048, o el merge duele.

### 4.3 Design tokens: extender, no reescribir

`packages/ui/src/tokens.ts` **ya resolvió** la contradicción de `DESIGN.md` (la prosa dice
`primary #F2755C`, los tokens del frontmatter dicen `#a43c27`): se quedó con la **prosa**, y
esa paleta semántica curada ya la consumen las apps en producción.

**`tokens.ts` es canónico. Se extiende de forma aditiva; no se reescribe.**

Los mocks de admin usan nombres de rol Material 3 (`primary-container`,
`surface-container-high`, `on-surface-variant`) que **no existen** en nuestro preset. No se
importa el set M3 completo — se **mapean** sobre los tokens actuales:

| Nombre en el mock (M3)                    | Token de `packages/ui` |
| ----------------------------------------- | ---------------------- |
| `primary-container` `#f2755c`             | `primary`              |
| `primary` `#a43c27`                       | `primaryDark`          |
| `secondary-container` / `secondary-fixed` | `secondary`            |
| `secondary` `#006a62`                     | `secondaryDark`        |
| `surface` / `surface-container-lowest`    | `surface`              |
| `background` / body `#FBF7F2`             | `background`           |
| `on-surface` `#1e1b19`                    | `foreground`           |
| `on-surface-variant` / `outline`          | `muted`                |
| `surface-variant` `#e9e1dd`               | `border`               |
| `error` `#ba1a1a`                         | `error`                |

Lo único que se **agrega** (porque hoy no existe y el panel lo necesita):

- Serie de color para gráficas (`chart.series[]`) — coral/teal como en el mock.
- Escala de elevación más allá de `soft` (hover y estado activo).
- Radios `2xl` (20px) y `3xl` (32px), que los mocks usan como valores arbitrarios
  (`rounded-[20px]`) por no existir en la escala.

---

## 5. Backend nuevo

### 5.1 Métricas (NEXA-050)

Reemplaza el repo actual, que además carga en memoria todas las entradas sentadas y
promedia en JS. La agregación se hace en la base.

```
GET /restaurants/:code/metrics?from=&to=
    → escalares del rango + delta vs. periodo anterior
GET /restaurants/:code/metrics/timeseries?from=&to=&bucket=hour|day
    → buckets para la gráfica de volumen
GET /restaurants/:code/metrics/peak-hours?from=&to=
    → agregación día-de-semana × hora para el heatmap
```

Requisitos:

- Todos los escalares acotados por rango (hoy solo `peopleToday` lo está).
- Delta contra el periodo inmediato anterior (alimenta el "-2 min vs ayer" del mock).
- **Estados de baja confianza:** con `n` pequeño se devuelve el conteo de muestra para que
  la UI muestre "datos insuficientes" en vez de un número seguro y equivocado.

### 5.2 Reseñas (NEXA-051)

`ServiceReview` ya se escribe (`POST /entries/:id/review`) y solo se lee como `_avg` dentro
de métricas.

```
GET /restaurants/:code/reviews?from=&to=&rating=&cursor=&limit=
    → lista paginada con displayName de la entrada
GET /restaurants/:code/reviews/summary?from=&to=
    → distribución de ratings (1–5) + promedio
```

### 5.3 Encuestas (NEXA-052)

Nuevo bounded context. Ver §6 para el diseño completo.

```
GET    /surveys/:id                      → definición (pública si active)
GET    /restaurants/:code/surveys        → encuestas del restaurante
POST   /restaurants/:code/surveys        → crear                        [staff]
PUT    /surveys/:id/definition           → editar preguntas             [staff]
POST   /surveys/:id/publish · /close     → ciclo de vida                [staff]
POST   /surveys/:id/responses            → enviar respuesta (valida)
GET    /surveys/:id/stats                → módulo de métricas           [staff]
```

---

## 6. Contexto `surveys` (nuevo bounded context)

### 6.1 Qué pasa con Strapi

**Hoy Strapi no se usa para nada.** `apps/cms` no existe; el repo solo tiene `admin`, `api`,
`client`, `landing` y `reception`. Todas las menciones a Strapi son documentación o
comentarios `TODO`. Estaba planeado (NEXA-027–030) para tres responsabilidades:

| Responsabilidad planeada          | Realidad                                                          |
| --------------------------------- | ----------------------------------------------------------------- |
| Definiciones de formularios       | Pasa al contexto `surveys` de este plan                            |
| Catálogo de restaurantes          | Ya lo sirve el backend (`GET /restaurants`); `/explorar` ✅ NEXA-015 |
| Textos y páginas editables        | `apps/landing` es Next.js estático con copy en el código           |

Hoy ninguna de las tres justifica levantar un CMS. **Strapi se pospone, no se descarta:**
construimos todo en DDD y lo incorporamos cuando un módulo concreto lo pida.

**Por qué posponerlo no cuesta caro.** La regla de `CLAUDE.md` — "los repositorios se
definen como interfaces en el dominio y se implementan en infraestructura" — es justamente
lo que hace barata la migración:

```
domain/survey-repository.ts            ← el puerto (interface). No cambia nunca.
infrastructure/prisma-survey-repo.ts   ← implementación de hoy
infrastructure/strapi-survey-repo.ts   ← implementación futura, si hace falta
```

Migrar a Strapi = escribir un adaptador nuevo y cambiar el binding en el composition root.
**No cambian** el dominio, los casos de uso, los contratos HTTP, `packages/types` ni la UI
de admin. La única condición es la que `CLAUDE.md` ya exige: que tipos de Prisma no se
filtren al dominio. Si eso se respeta, la puerta queda abierta gratis.

> **Matiz para cuando llegue el momento.** El adaptador es limpio para *leer* definiciones.
> Pero conviene separar dos cosas que suenan iguales:
>
> - **El builder de encuestas es producto** — una superficie que usa el dueño del
>   restaurante. Eso se queda en el backend aunque exista Strapi.
> - **El contenido editorial es CMS** — catálogo, imágenes, copy de marketing, que edita el
>   equipo de Nexa. Ahí es donde Strapi se gana su lugar.
>
> Es decir: probablemente Strapi acabe entrando por el catálogo y los textos (NEXA-030), no
> por los formularios.

**Implica actualizar** `CLAUDE.md` (§ frontera Strapi ↔ backend), `README.md`,
`Execution_Plan.md` (NEXA-027–030) y `UI_Mocks_Map.md` para reflejar que la frontera sigue
siendo válida como destino, pero que su implementación se aplaza. Va como step aparte.

### 6.2 Diseño del contexto

Inspiración: **SurveyJS** para el modelo de preguntas y el builder; **LimeSurvey** para el
ciclo de vida de la encuesta y el módulo de estadísticas.

**Genérico por diseño.** El contexto no conoce restaurantes ni waitlist. Una encuesta puede
ser tan chica como una sola pregunta de rating o un solo textarea, y debe poder reutilizarse
en otros verticales de Nexa (clínicas, barberías) — coherente con el objetivo de genericidad
de `CLAUDE.md`.

```
apps/api/src/contexts/surveys/
├── domain/
│   ├── survey.ts              # Aggregate root: definición + ciclo de vida
│   ├── question.ts            # Entidad: tipo, etiqueta, ayuda, obligatorio, orden, config
│   ├── question-type.ts       # VO: union de tipos soportados
│   ├── survey-response.ts     # Aggregate: respuestas de un sujeto
│   ├── answer.ts              # VO: valor tipado por tipo de pregunta
│   └── *-repository.ts        # Interfaces
├── application/
│   ├── create-survey.ts · update-survey-definition.ts
│   ├── publish-survey.ts · close-survey.ts
│   ├── submit-response.ts     # Valida contra la definición
│   └── get-survey-stats.ts    # Módulo de métricas
├── infrastructure/            # Repos Prisma
└── interfaces/                # Routers HTTP
```

**Agregados:**

- **`Survey`** — `id`, `ownerRef` (opcional; sin FK dura a `Restaurant`), `purpose`,
  `title`, `status` (`draft | active | closed`), `version`, `questions[]`.
- **`SurveyResponse`** — `id`, `surveyId`, `surveyVersion`, `subjectRef`, `answers[]`,
  `submittedAt`.

`version` importa: si el dueño edita la encuesta, las respuestas viejas siguen siendo
interpretables contra la versión con la que se contestaron. Es la trampa clásica de este
tipo de módulo.

**`purpose`** distingue los dos destinos sin duplicar el motor:

| `purpose`  | Dónde se usa                       | Reemplaza                 |
| ---------- | ---------------------------------- | ------------------------- |
| `intake`   | Alta del comensal (`apps/client`)  | `WaitlistEntry.formData`  |
| `feedback` | Evaluación post-visita             | `ServiceReview` (ver 6.4) |

### 6.3 Tipos de pregunta (base SurveyJS)

`short_text` · `long_text` · `number` · `phone` · `email` · `single_choice` ·
`multi_choice` · `rating` (escala configurable) · `nps` · `boolean` · `date`.

Cada tipo lleva su `config` (rango de rating, opciones, min/max) y sus reglas de validación
**en el dominio**, no en el controlador ni en el componente React. `submit-response` valida
la respuesta contra la definición antes de persistir.

### 6.4 Ruta incremental — no romper lo que funciona

`ServiceReview` ya está en producción: `POST /entries/:id/review` lo escribe,
`prisma-metrics-repository.ts` lo promedia, y el módulo de reseñas (NEXA-051/056) lo lee.
**No se toca.**

1. El contexto `surveys` se construye **al lado**, sin migrar nada.
2. Al enviar una encuesta de `purpose: feedback`, se crea un `SurveyResponse` **y** se
   proyecta rating + comentario a `ServiceReview` para compatibilidad. Métricas y reseñas
   siguen funcionando sin cambios.
3. La migración total de `ServiceReview` queda para después, cuando el motor esté probado.

Así el par fijo rating + feedback **complementa** a la encuesta configurable en vez de
competir con ella, y no hay un "big bang" de schema.

### 6.5 Dirección de dependencias

`surveys` **no importa** de `waitlist` ni de `restaurant`. La vinculación ("esta encuesta es
la de post-visita del restaurante X") se guarda como referencia opaca (`ownerRef`), y son
`waitlist`/`restaurant` los que referencian encuestas por id. Si esta dirección se invierte,
el contexto deja de ser reutilizable y se convierte en parte de waitlist.

---

## 7. Contexto `memberships` (nuevo bounded context)

Programa de lealtad configurable por el dueño: niveles, visitas, puntos y recompensas.
Es una **feature de venta**, así que la base tiene que ser sólida desde el primer commit.

### 7.1 Decisión que no se puede tomar mal: ledger, no saldo

El error clásico de un módulo de lealtad es guardar `points: Int` en el miembro y sumarle o
restarle. Produce estado que no se puede auditar, corregir ni disputar — y cuando un cliente
reclama "yo tenía 300 puntos", no hay forma de saber quién tiene razón.

**El saldo es una proyección, nunca un campo mutable.** Todo movimiento es una entrada
inmutable en un ledger:

```
LedgerEntry: id · membershipId · kind · amount · sourceRef · occurredAt · note
             kind: accrual | redemption | expiry | adjustment
```

- `sourceRef` apunta al hecho que lo originó (p. ej. el `WaitlistEntry` sentado) y es
  **único por origen** → idempotencia. Reprocesar un evento no acredita dos veces.
- Correcciones manuales entran como `adjustment` con nota y autor. Nunca se edita ni se
  borra una entrada.
- El saldo y el nivel actual se derivan; se pueden cachear, pero el ledger manda.

### 7.2 Modelo de dominio

```
apps/api/src/contexts/memberships/
├── domain/
│   ├── membership-program.ts   # Aggregate: reglas de acumulación + esquema de niveles
│   ├── tier.ts                 # Entidad: nombre, umbral, beneficios, orden
│   ├── membership.ts           # Aggregate: inscripción de un comensal
│   ├── ledger-entry.ts         # VO inmutable (§7.1)
│   ├── reward.ts               # Entidad: catálogo de recompensas
│   ├── redemption.ts           # Aggregate: canje con ciclo de vida
│   ├── tier-policy.ts          # Evaluación de nivel (umbral, periodo, degradación)
│   └── *-repository.ts
├── application/
│   ├── create-program.ts · update-program.ts · publish-program.ts
│   ├── enroll-member.ts
│   ├── record-visit.ts         # Implementa el puerto de waitlist (§7.4)
│   ├── redeem-reward.ts        # Valida saldo, límites y vigencia
│   └── get-program-stats.ts    # Módulo de métricas
├── infrastructure/
└── interfaces/
```

**Acumulación** — `accrualMode: visits | points | both`. Visitas se acreditan cuando una
entrada llega a `seated`; los puntos admiten regla por monto o monto fijo por visita.

**Niveles (`Tier`)** — nombre, umbral, beneficios y orden. La política de nivel necesita
tres cosas explícitas desde el diseño, porque es donde estos módulos se pudren:

| Parámetro    | Opciones                                                     |
| ------------ | ------------------------------------------------------------ |
| Métrica      | visitas acumuladas · puntos acumulados                       |
| Periodo      | de por vida · ventana móvil (p. ej. últimos 12 meses)        |
| Degradación  | nunca baja · baja al salir de la ventana                     |

**Recompensas** — costo (puntos o nivel requerido), tipo, límite por miembro y por periodo,
vigencia. El canje genera un `Redemption` con código y ciclo
`issued → redeemed | expired`, para que la hostess lo valide en el local.

### 7.3 Restricción de identidad (importante)

Nexa permite modo **guest** (gamertag, sin cuenta) y `WaitlistEntry.userId` es **nullable**.
Una membresía necesita identidad durable: **no se puede ser miembro siendo guest.**

Esto no es solo una limitación, es palanca de producto: la membresía es la razón por la que
un comensal se registra. El flujo natural es *comensal sentado → "¿acumulas visitas?" →
crear cuenta → visita acreditada*.

> `[POR DEFINIR]` ¿Se permite acreditar retroactivamente la visita en la que el comensal se
> registró? Recomendado: sí, acotado a esa sesión — es el momento de mayor conversión.

### 7.4 Integración con `waitlist` (dirección de dependencias)

`waitlist` **no importa** `memberships`. Se sigue el patrón que ya existe en
`application/ports.ts`, donde `DinerNotifier` está declarado como puerto de salida e
implementado por otro contexto:

```ts
// contexts/waitlist/application/ports.ts  — se agrega
/** Outbound port for crediting loyalty visits (implemented by the memberships context). */
export interface VisitRecorder {
  dinerSeated(entry: WaitlistEntry): void;
}
```

`memberships` lo implementa y `composition.ts` los une. Si el módulo se apaga, waitlist
sigue funcionando con un no-op.

**Beneficios que tocan la cola** (p. ej. acceso a cola VIP por nivel) se resuelven
**orquestando** ambos contextos en la capa de aplicación al momento del alta — nunca
haciendo que `waitlist` consulte `memberships` desde su dominio.

### 7.5 Alcance del programa

MVP: **un programa por restaurante**. Igual que en `surveys`, el dueño se guarda como
`ownerRef` opaco y no como FK dura a `Restaurant`, de modo que un programa **Nexa-wide**
("una tarjeta, todos los restaurantes") sea aditivo después y no una migración.

> `[POR DEFINIR]` La membresía global es un diferenciador comercial fuerte, pero abre
> preguntas de quién patrocina las recompensas. Se diseña compatible, se decide después.

### 7.6 Superficies en las tres apps

Este bloque no es solo admin — conviene saberlo antes de estimar:

| App         | Qué necesita                                                          |
| ----------- | --------------------------------------------------------------------- |
| `admin`     | Constructor de programa, niveles, recompensas + analítica              |
| `client`    | Tarjeta de miembro, saldo, nivel, catálogo de recompensas, mis canjes  |
| `reception` | Ver nivel del comensal en la cola y **validar un canje** en el local   |

### 7.7 Módulo de métricas

Es una feature de venta: tiene que demostrar retorno. Miembros totales y activos,
distribución por nivel, visitas por miembro vs. no miembro, tasa de canje, recompensas más
canjeadas y retención por cohorte de inscripción.

---

## 8. Tareas y steps

> **Modo de trabajo (XP).** Cada step deja el repo verde y desplegable: compila, pasa lint y
> tests. Los cambios de `packages/*` se integran a `dev` en cuanto están verdes, sin esperar
> a que la fase termine. Nunca se queda una fase a medias en la rama.

### Fase A — Fundaciones (desbloquea todo)

**NEXA-047 · `packages/api-client`**

- [ ] **S1.** Init del package + cliente HTTP tipado sobre `@nexa/types`. → `feat(api-client): init typed http client`
- [ ] **S2.** Store de sesión (Zustand): usuario, rol, restaurante activo. → `feat(api-client): add session store`
- [ ] **S3.** Wrapper de socket.io con rooms tipadas. → `feat(api-client): add typed websocket client`
- [ ] **S4.** Migrar `apps/admin` a usarlo; eliminar el `CODE = 'DEMO'` hardcodeado. → `refactor(admin): use shared api client`

**NEXA-048 · `packages/ui` — shell y datos** _(requiere `landing-page` integrado)_

- [ ] **S1.** `AppShell`, `Sidebar`, `TopBar`, `NavItem`. → `feat(ui): add app shell components`
- [ ] **S2.** `StatCard`, `EmptyState`, `DataTable`. → `feat(ui): add data display components`
- [ ] **S3.** `Toggle`, `Slider`, `RangePicker`. → `feat(ui): add form control components`

**NEXA-064 · api: acotar staff a su restaurante** _(hueco de seguridad, §11)_

- [ ] **S1.** Relación `StaffUser → Restaurant` en el schema + migración + seed. → `feat(api): scope staff users to a restaurant`
- [ ] **S2.** `requireStaff` valida restaurante además de rol (con tests). → `fix(api): enforce restaurant scope on staff routes`
- [ ] **S3.** Misma validación en la suscripción WebSocket. → `fix(api): enforce restaurant scope on socket subscribe`

**NEXA-053 · admin: shell y navegación**

- [ ] **S1.** Layout con `AppShell` + rutas de la IA de §3. → `feat(admin): add navigation shell`
- [ ] **S2.** Guard de sesión; el restaurante se resuelve del staff autenticado. → `feat(admin): add session guard and restaurant context`

### Fase B — Victorias rápidas (respaldadas por datos existentes)

**NEXA-051 · api: lectura de reseñas**

- [ ] **S1.** Repo + caso de uso `ListReviews` (dominio + aplicación, con tests). → `feat(api): add list reviews use case`
- [ ] **S2.** Caso de uso `GetReviewSummary` (distribución de ratings). → `feat(api): add review summary use case`
- [ ] **S3.** Endpoints + contratos en `packages/types`. → `feat(api): expose review read endpoints`

**NEXA-056 · admin: página de Reseñas**

- [ ] **S1.** Lista con filtro por rating y rango de fechas. → `feat(admin): add reviews list page`
- [ ] **S2.** Resumen: promedio + distribución (`RatingDistribution`). → `feat(admin): add review summary panel`

**NEXA-055 · admin: Lista de espera**

- [ ] **S1.** Vista en vivo (reusa `GET .../entries` + WS existentes). → `feat(admin): add live waitlist view`
- [ ] **S2.** Historial con búsqueda y filtros. _(requiere endpoint de historial)_ → `feat(api): add waitlist history endpoint` · `feat(admin): add waitlist history`
- [ ] **S3.** Export CSV. → `feat(admin): add waitlist csv export`

### Fase C — Panel (el buque insignia)

**NEXA-050 · api: métricas con rango y series**

- [ ] **S1.** Refactor del repo de métricas a agregación en base + rango de fechas. → `refactor(api): scope metrics by date range`
- [ ] **S2.** Deltas vs. periodo anterior + tamaño de muestra. → `feat(api): add metric deltas and sample size`
- [ ] **S3.** Serie temporal por hora/día. → `feat(api): add metrics timeseries endpoint`
- [ ] **S4.** Agregación de horas pico (día × hora). → `feat(api): add peak hours aggregation`

**NEXA-049 · `packages/ui` — gráficas con d3**

- [ ] **S1.** Setup de d3 (`d3-scale`, `d3-shape`, `d3-array`) + escalas y ejes base. → `feat(ui): add chart primitives with d3`
- [ ] **S2.** `GroupedBarChart` (volumen por hora, 2 series). → `feat(ui): add grouped bar chart`
- [ ] **S3.** `Heatmap` (horas pico) con escala secuencial monótona. → `feat(ui): add heatmap chart`
- [ ] **S4.** `RatingDistribution` + `ProgressMeter`. → `feat(ui): add rating and meter charts`

**NEXA-054 · admin: Panel**

- [ ] **S1.** Fila de KPIs con deltas y estados de baja confianza. → `feat(admin): add dashboard kpi row`
- [ ] **S2.** Gráfica de volumen por hora + selector de rango. → `feat(admin): add queue volume chart`
- [ ] **S3.** Heatmap de horas pico. → `feat(admin): add peak hours heatmap`
- [ ] **S4.** Bloque de reseñas recientes con enlace a /reseñas. → `feat(admin): add recent reviews panel`

### Fase D — Encuestas

**NEXA-052 · api: contexto `surveys`**

- [ ] **S1.** Contratos en `packages/types`: `Survey`, `Question`, `QuestionType`, `Answer`. → `feat(types): add survey contracts`
- [ ] **S2.** Dominio: agregados `Survey` / `SurveyResponse`, tipos de pregunta y validación (con tests). → `feat(api): add surveys domain`
- [ ] **S3.** Casos de uso de definición: crear, editar, publicar, cerrar (con tests). → `feat(api): add survey definition use cases`
- [ ] **S4.** `SubmitResponse` con validación contra la definición versionada (con tests). → `feat(api): add survey response submission`
- [ ] **S5.** Módulo de estadísticas: agregación por tipo de pregunta (con tests). → `feat(api): add survey stats module`
- [ ] **S6.** Schema Prisma + migración + repos. → `feat(api): add survey persistence`
- [ ] **S7.** Routers HTTP + guardas de staff. → `feat(api): expose survey endpoints`
- [ ] **S8.** Proyección `feedback` → `ServiceReview` (compatibilidad, §6.4). → `feat(api): project survey feedback to service review`

**NEXA-057 · admin: builder de encuestas**

- [ ] **S1.** Layout de 3 columnas: paleta / vista previa / propiedades. → `feat(admin): add survey builder layout`
- [ ] **S2.** Drag & drop real (reordenar, agregar, eliminar). → `feat(admin): add survey builder drag and drop`
- [ ] **S3.** Panel de propiedades por tipo de pregunta. → `feat(admin): add question properties panel`
- [ ] **S4.** Ciclo de vida: borrador → publicar → cerrar. → `feat(admin): add survey lifecycle controls`
- [ ] **S5.** Vista de resultados por pregunta (módulo de métricas). → `feat(admin): add survey results view`
- [ ] **S6.** Renderer de encuesta en `apps/client` (`intake` y `feedback`). → `feat(client): render configurable surveys`

**NEXA-060 · docs: aplazar Strapi** _(ver §6.1)_

- [ ] **S1.** Redactar la frontera como diferida en `CLAUDE.md`, `README.md`,
      `Execution_Plan.md` y `UI_Mocks_Map.md`: destino válido, implementación pospuesta. → `docs: defer strapi integration`

### Fase E — Completar

**NEXA-058 · admin: Configuración al nivel del mock**

- [ ] **S1.** Subida de logotipo. → `feat(admin): add restaurant logo upload`
- [ ] **S2.** Bloque de QR: mostrar, copiar código, descargar para imprimir. → `feat(admin): add qr and access code panel`
- [ ] **S3.** CRUD de colas con descripción + **eliminar** (falta `DELETE /queues/:id`). → `feat(api): add delete queue endpoint` · `feat(admin): add queue management`
- [ ] **S4.** Slider de tolerancia de expiración. → `feat(admin): add expiration tolerance slider`

**NEXA-059 · admin: Plan (solo lectura)**

- [ ] **S1.** Tarjetas de plan Gratis/Pro desde el mock. → `feat(admin): add plan comparison cards`
- [ ] **S2.** Bloque de consumo. _(los medidores quedan vacíos hasta que `Notification` se escriba)_ → `feat(admin): add plan usage panel`

### Fase F — Membresías

**NEXA-061 · api: contexto `memberships`**

- [ ] **S1.** Contratos en `packages/types`: `MembershipProgram`, `Tier`, `Membership`, `Reward`, `Redemption`, `LedgerEntry`. → `feat(types): add membership contracts`
- [ ] **S2.** Dominio: ledger inmutable + saldo derivado, con tests de idempotencia (§7.1). → `feat(api): add membership ledger domain`
- [ ] **S3.** Dominio: niveles y `tier-policy` (métrica, periodo, degradación), con tests. → `feat(api): add tier policy domain`
- [ ] **S4.** Casos de uso de programa: crear, editar, publicar, pausar (con tests). → `feat(api): add membership program use cases`
- [ ] **S5.** `EnrollMember` + `RecordVisit` implementando el puerto `VisitRecorder` (con tests). → `feat(api): add member enrollment and visit accrual`
- [ ] **S6.** Puerto `VisitRecorder` en `waitlist` + wiring en `composition.ts` (no-op si el módulo está apagado). → `feat(api): add visit recorder port to waitlist`
- [ ] **S7.** Catálogo de recompensas + `RedeemReward` (saldo, límites, vigencia), con tests. → `feat(api): add reward redemption`
- [ ] **S8.** Módulo de estadísticas del programa (§7.7). → `feat(api): add membership stats module`
- [ ] **S9.** Schema Prisma + migración + repos. → `feat(api): add membership persistence`
- [ ] **S10.** Routers HTTP + guardas de staff. → `feat(api): expose membership endpoints`

**NEXA-062 · admin: constructor de membresías**

- [ ] **S1.** Configuración del programa: modo de acumulación y reglas. → `feat(admin): add membership program setup`
- [ ] **S2.** Editor de niveles: umbral, beneficios, orden. → `feat(admin): add tier editor`
- [ ] **S3.** Catálogo de recompensas: costo, límites, vigencia. → `feat(admin): add reward catalog editor`
- [ ] **S4.** Analítica del programa (§7.7). → `feat(admin): add membership analytics`
- [ ] **S5.** Directorio de miembros con ledger por miembro y ajuste manual. → `feat(admin): add member directory`

**NEXA-063 · client + reception: superficies de membresía**

- [ ] **S1.** `client`: tarjeta de miembro (nivel, saldo, progreso al siguiente nivel). → `feat(client): add membership card`
- [ ] **S2.** `client`: catálogo de recompensas y canje. → `feat(client): add reward redemption`
- [ ] **S3.** `client`: inscripción post-visita (guest → registrado, §7.3). → `feat(client): add membership enrollment flow`
- [ ] **S4.** `reception`: nivel del comensal visible en la cola. → `feat(reception): show member tier in queue`
- [ ] **S5.** `reception`: validar canje en el local. → `feat(reception): add redemption validation`

---

## 9. Orden de ejecución

Orden acordado: **fundaciones → Panel → métricas reales → membresías → encuestas → resto.**

```
Fase A  Fundaciones ─────────► 047 api-client → 064 auth scope → 048 ui shell → 053 admin shell
                                      │
Fase B  Panel (quick win) ───► 054·S1 KPIs con los escalares que ya existen
                                      │   (panel navegable y usable de inmediato)
Fase C  Métricas reales ─────► 050 métricas api → 049 charts d3 → 054 resto · 051 reviews api
                                      │
Fase D  Membresías ──────────► 061 contexto memberships → 062 admin · 063 client/reception
                                      │
Fase E  Encuestas ───────────► 052 contexto surveys → 057 builder · 060 docs
                                      │
Fase F  Resto ───────────────► 056 reseñas · 055 lista de espera · 058 configuración · 059 plan
```

**Por qué el Panel va antes que las métricas reales:** la Fase B usa los escalares que ya
devuelve el backend, así que el panel queda navegable y demoable en cuanto existe el shell.
La Fase C lo llena de datos correctos sin volver a tocar el layout.

`051` (lectura de reseñas) sube a la Fase C porque el bloque "Reseñas recientes" del mock del
panel lo necesita; la página completa de reseñas (`056`) se queda al final.

> **Nota de estimación honesta.** Son 18 tareas / ~73 commits. El código puede ir rápido,
> pero cada fase implica revisión y PR: no es un bloque de 1–2 días. Lo que sí garantiza el
> orden es que **hay algo funcionando y mergeable desde la Fase B**, y que ninguna fase
> depende de que la siguiente exista.

**Nota de integración:** siguiendo lo aprendido con `landing-page`, los cambios de
`packages/*` (047, 048, 049, 052) se integran a `dev` **en cuanto estén verdes**, sin
esperar a que el bloque completo termine. Es la superficie compartida y la única que
castiga las ramas largas.

---

## 10. Fuera de alcance

- **Mesas / creador de layout** — sin backend. Nota: un modelo mínimo de mesas (conteo +
  tiempos de rotación, sin editor visual) es lo que haría el ETA realmente dinámico
  (NEXA-031). Ese es el premio real, y no requiere un editor de planos.
- **Gestión de staff** — el contexto `identity` es `export {};`. Hoy no se puede invitar a
  una hostess salvo por seed de base de datos.
- **Facturación real** — sin proveedor de pagos. `plan` ni siquiera está en
  `updateConfigSchema`, así que ningún endpoint puede cambiarlo.
- **Registro de notificaciones** — hueco ya listado en `Execution_Plan.md`; los medidores
  de consumo del plan quedan vacíos hasta que se resuelva.
- **Strapi / `apps/cms`** — **pospuesto, no descartado** (§6.1). Todo se consume del backend;
  la frontera sigue siendo válida como destino y el patrón puerto/adaptador la mantiene
  barata. Entrará cuando un módulo lo pida — probablemente catálogo y textos (NEXA-030).

**Dentro de membresías, queda fuera de la primera versión** (el modelo se diseña compatible,
pero no se implementa ahora): programas de referidos, códigos de cupón, tarjetas de regalo,
recompensas patrocinadas por terceros y niveles de pago con cobro recurrente. Todo eso
depende de un proveedor de pagos, que tampoco existe (ver arriba).

---

## 11. Riesgos y decisiones abiertas

- 🔴 **`requireStaff` no valida restaurante.** `require-staff.ts:10-19` solo comprueba que
  el rol sea `admin` o `hostess`; **cualquier staff puede leer métricas y mutar cualquier
  restaurante por código**. `StaffUser.restaurantId` existe en los tipos sin contraparte en
  la base. **Resuelto en el plan:** se arregla en la Fase A como NEXA-064, no se difiere con
  gestión de staff. Ahora es barato porque ya estamos construyendo el contexto de restaurante
  en la sesión; después sería una migración sobre datos vivos.
- 🟡 **Aplazar Strapi toca un documento rector.** `CLAUDE.md` lista la frontera
  Strapi ↔ backend como principio #6. No lo contradecimos —la frontera sigue siendo el
  destino— pero sí hay que redactarlo como diferido (NEXA-060) para que nadie lea el
  principio y asuma que `apps/cms` existe. **Riesgo real:** que la puerta se cierre sola por
  descuido. Se mitiga con una sola regla, ya obligatoria en `CLAUDE.md`: **ningún tipo de
  Prisma cruza al dominio**. Si eso se respeta en `surveys`, el adaptador de Strapi sigue
  siendo barato; si se filtra, la migración deja de ser un cambio de una sola capa.
- 🟢 **Encuestas y membresías son features de venta, no accesorios.** Decisión tomada: se
  construyen completas. Lo que sí importa es el **orden**, porque SurveyJS y LimeSurvey son
  productos enteros y no se llega ahí en una fase. Primero los 11 tipos de pregunta de §6.3
  y el ciclo de vida; después lógica condicional, ramificación, multi-página e i18n. El
  versionado de definiciones (§6.2) es justamente lo que permite agregar todo eso más tarde
  sin romper respuestas existentes — por eso va desde el primer step y no al final.
- 🔴 **El ledger de membresías no admite atajos.** Un `points: Int` mutable en el miembro
  parece más simple y es la decisión que después no se puede deshacer: sin ledger no hay
  auditoría, ni corrección, ni forma de resolver una disputa con un cliente. Además las
  recompensas cuestan dinero real al restaurante — un bug que acredita de más se paga en
  producto. `sourceRef` único por origen (§7.1) es lo que evita el doble abono al
  reprocesar un evento.
- 🟠 **Membresías toca las tres apps.** Es el bloque más grande del plan: admin (constructor
  + analítica), client (tarjeta, catálogo, canje) y reception (validar canje en el local).
  Estimar solo la parte de admin subestima el trabajo por mucho (§7.6).
- 🟡 **`[POR DEFINIR]`** ¿Acreditar retroactivamente la visita en la que el comensal se
  registró? (§7.3 — recomendado sí, acotado a esa sesión).
- 🟡 **`[POR DEFINIR]`** ¿Programa por restaurante o membresía Nexa-wide? (§7.5 — el modelo
  queda compatible con ambas; la decisión comercial puede esperar).
- 🟡 **Versionado de definiciones.** Si el dueño edita una encuesta activa, las respuestas
  previas deben seguir siendo legibles (§6.2). Es la fuente de bugs más común en este tipo de
  módulo — se resuelve en el dominio desde el step 1, no después.
- 🟡 **`[POR DEFINIR]`** Librería de drag & drop para el builder (`dnd-kit` vs. HTML5 nativo).
  Los mocks solo tienen la apariencia: `cursor-move` y un handler que baja la opacidad. No
  hay `draggable`, ni `dragstart`, ni sortable — nada se mueve realmente.

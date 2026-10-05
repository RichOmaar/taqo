# Contexto de Sesiones — TableNow (código: Nexa)

## Estado actual (2026-10-04)

### Marca
- El producto se llama **TableNow** (antes Nexa). El logotipo es "Table" en tinta + "Now" en teal.
- **TableNow solo aparece en el copy visible de `apps/landing`.** El código se queda como Nexa:
  paquetes `@nexa/*`, `nexaPreset`, base de datos `nexa`, IDs `NEXA-xxx`. Decidido el 2026-10-04;
  hubo un intento de renombrar todo y se revirtió.
- Fuentes del copy: las presentaciones de TableNow en claude.ai (la comercial para restaurantes
  `DBddYKgDCo1pBqCuYSaUQh` y la de socios `12KfpF2pSnCMCutZpcDA3u`). Tono honesto de etapa temprana:
  sin cifras ni clientes inventados.

### Rama `landing-page`
- Tiene todo `dev` + `routes-english` + `port-map` (merges del 2026-10-04); no le falta ningún
  commit de la rama más actualizada del equipo.
- Modelo de ramas del equipo (`Documentation/Branching.md`): rama de tarea → PR a `dev` → `qa` →
  `prod`. **El PR de esta rama va contra `dev`.**

### Landing (`apps/landing`)
- Home (`/`): hero con mockup CSS del teléfono → problema → solución por rol → cómo funciona →
  para tu equipo → métricas → lealtad/encuestas/reseñas (existen en `dev`) → precios →
  cómo arrancamos → contacto.
- Rutas en inglés: `/privacy`, `/terms` y `/support`. `/press` se eliminó porque tenía comunicados y
  estadísticas inventados.
- Marca, navegación, footer y contacto centralizados en `src/site.ts` y
  `src/components/SiteChrome.tsx`.
- Los CTA son enlaces (`buttonClasses` de `@nexa/ui`) a `#contacto` → `mailto:`. El alta es asistida;
  no hay registro autoservicio de restaurantes.
- Correo: `hola@tablenow.mx` (placeholder aceptado por ahora). WhatsApp: `null` (el botón aparece
  al llenarlo en `site.ts`).

---

## Pendiente

### Decisiones abiertas
- [ ] **Precio del plan Pro inconsistente:** el admin (`apps/admin/src/lib/plan-view.ts`) dice
      "$499 /mes MXN"; la landing dice "Se cotiza según tu operación" (como las presentaciones).
- [ ] **Legal:** `/privacy` y `/terms` son un borrador sin revisión legal y con razón social de relleno.
      Faltan el responsable, el domicilio y el correo ARCO, o se quitan del footer hasta tenerlos.
- [ ] **Hosting:** sin definir; bloquea publicar.
- [ ] Logo SVG real (hoy el logotipo es texto).

### Entorno local de Omar
- [ ] Usar **Node 24** (`.nvmrc`). Con Node 25, el build de admin y reception falla por
      `localStorage` (se puede saltar con `NODE_OPTIONS=--no-experimental-webstorage`).
- [ ] Agregar a `apps/api/.env` las variables nuevas de `dev`: `BETTER_AUTH_SECRET`,
      `BETTER_AUTH_URL`, `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` y `VAPID_SUBJECT`
      (sin ellas falla `waitlist-gateway.test.ts`).
- [ ] Después de traer cambios de schema, correr `pnpm --filter @nexa/api exec prisma generate`.

### Opcionales
- [ ] Mockup real del teléfono (hoy es un placeholder CSS)
- [ ] Animaciones al hacer scroll

---

## Notas para commits

**Excluir siempre de commits:**
- `.claude/` — configuración local de Claude Code
- `Documentation/stitch_nexa_restaurant_waitlist_app/` — mocks de referencia (ya commiteados una vez)
- `Documentation/Mocks/` — archivos HTML de mocks (referencia, no código)

**Convención:**
- Commits en inglés (Conventional Commits)
- Un commit por feature/fix lógico
- **Sin** trailer `Co-Authored-By: Claude`: todo commit va a nombre de Omar (juanomcam@gmail.com).
  Los 4 commits viejos de julio que sí lo traen ya están en `dev`; no se reescriben.

---

## Historial de sesiones

### Sesión 2026-07-13 — rama `landing-page`
- `ca4bebf` feat(landing): implement complete landing page with all sections
- `5aef211` feat(landing): add legal and support pages with smooth scrolling
- `64e7784` feat(ui): add micro-interactions and animated header transformation
- Landing con 6 secciones (versión Nexa), páginas legales, de soporte y de prensa, header
  animado (full → pill) y micro-interacciones.

### Sesión 2026-10-04 — rama `landing-page`
- Home reescrito con la marca TableNow y el copy de las presentaciones; se quitó el contenido
  inventado ("500 restaurantes", avatares, POS y soporte 24/7 en Pro).
- `buttonClasses` en `@nexa/ui` para que los enlaces se vean como botones.
- Renombre a `@tablenow/*` hecho y **revertido** (se decidió dejar Nexa en el código).
- Merge de `origin/routes-english` y `origin/port-map` (incluyen todo `dev`); se quitó `/press`.
- Verificado: typecheck 13/13, lint, tests (747 OK, salvo el archivo que pide variables de
  `.env`) y build de las 4 apps de Next.

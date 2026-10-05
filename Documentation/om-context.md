# Contexto de Sesiones — TableNow

## Estado Actual (2026-07-13)

### Implementado

- **apps/landing**: Landing page completa con 6 secciones + páginas legales
- **packages/ui**: Componentes base + landing + micro-interacciones
- **Design tokens**: Paleta coral/teal, tipografías, radios
- **Tailwind preset**: Configurado con tokens TableNow
- **Iconos**: lucide-react instalado en @tablenow/ui y landing

### Componentes Creados (packages/ui)

- [x] Badge — etiquetas/chips
- [x] Header — transformación animada (full → pill on scroll), glass effect, menú móvil
- [x] Footer — columnas, legal, copyright
- [x] FeatureCard — icono + título + descripción, hover lift + icon scale
- [x] StepCard — pasos numerados, hover animations
- [x] PricingCard — planes con features y CTA, hover shadow
- [x] RoadmapCard — fases con estado (completed/in-progress/upcoming)
- [x] SocialProof — avatares + texto con highlight
- [x] Card — prop `hoverable` para lift effect
- [x] Button — `active:scale` feedback

### Landing Page (apps/landing)

- [x] Hero con mockup de teléfono (placeholder CSS)
- [x] Beneficios (6 FeatureCards)
- [x] Cómo funciona (3 StepCards)
- [x] Precios (2 PricingCards: Gratis y Pro)
- [x] Visión/Roadmap (3 RoadmapCards)
- [x] CTA final
- [x] Footer completo
- [x] Smooth scrolling (CSS)

### Páginas Adicionales

- [x] /privacidad — Aviso de privacidad (LFPDPPP)
- [x] /terminos — Términos y condiciones
- [x] /soporte — Centro de ayuda con FAQs
- [x] /prensa — Sala de prensa con comunicados y kit de medios

### Mejoras UI/UX Implementadas

- [x] Header sticky con transformación pill on scroll (estilo iOS Dynamic Island)
- [x] Glass effect (backdrop-blur-2xl, backdrop-saturate-150)
- [x] Menú hamburguesa en móvil
- [x] Hover states en todos los cards (lift, shadow, scale)
- [x] Transiciones suaves (duration-300/500)
- [x] Active state en botones

---

## Pendiente

### Assets

- [ ] Mockup real del teléfono (actualmente placeholder CSS)
- [ ] Fotos de restaurantes para sección visión
- [ ] Logo SVG de TableNow
- [ ] Imágenes para StepCards (opcional)

### Mejoras Opcionales

- [ ] Scroll-triggered animations (fade-in on viewport)
- [ ] SEO meta tags adicionales
- [ ] Back to top button

---

## Decisiones

| Tema          | Decisión                                            |
| ------------- | --------------------------------------------------- |
| Branding      | Usar "TableNow" consistentemente                    |
| Navegación    | Links: Beneficios, Cómo funciona, Precios           |
| CTA principal | "Empieza gratis" / "Crear mi restaurante"           |
| Iconos        | lucide-react                                        |
| Mockup hero   | Placeholder CSS hasta tener asset real              |
| Header style  | Transformación full→pill on scroll con glass effect |

---

## Notas para Commits

**Excluir siempre de commits:**

- `.claude/` — configuración local de Claude Code
- `Documentation/stitch_nexa_restaurant_waitlist_app/` — mocks de referencia (ya commiteados una vez)
- `Documentation/Mocks/` — archivos HTML de mocks (referencia, no código)

**Convención:**

- Commits en inglés (Conventional Commits)
- Un commit por feature/fix lógico
- **Sin** trailer `Co-Authored-By: Claude` — todo commit va a nombre de Omar (juanomcam@gmail.com)

---

## Historial de Sesiones

### Sesión 2026-07-13

**Rama:** `landing-page`

**Commits realizados:**

1. `ca4bebf` — feat(landing): implement complete landing page with all sections
2. `5aef211` — feat(landing): add legal and support pages with smooth scrolling
3. `64e7784` — feat(ui): add micro-interactions and animated header transformation

**Trabajo completado:**

- Landing page completa con 6 secciones
- 4 páginas adicionales (privacidad, términos, soporte, prensa)
- Header con transformación animada (full → pill on scroll)
- Micro-interacciones en componentes (hover, active states)
- Glass effect estilo iOS

### Sesión 2026-10-04

**Rama:** `landing-page`

**Cambio de marca:** el producto ahora se llama **TableNow** (antes Nexa). Se renombró todo el
código: los paquetes son `@tablenow/*`, el preset de Tailwind es `tablenowPreset` y los logs dicen
`tablenow-api`. Se mantienen los IDs de tarea `NEXA-xxx`, las ramas `nexa-00x-slug`, los
`.docx` históricos de `V1 - Nexa MVP/` y las carpetas de mocks de Stitch.

**Trabajo completado:**

- Home reescrito con el contenido de las presentaciones de TableNow (comercial y para socios):
  problema → solución por rol → cómo funciona → equipo → métricas → lealtad → precios →
  cómo arrancamos → contacto.
- Se quitó el contenido inventado: "500 restaurantes", los avatares de pravatar, el POS en el
  plan Pro y el soporte 24/7.
- Header, footer y marca centralizados en `apps/landing/src/site.ts` y
  `src/components/SiteChrome.tsx`; las páginas secundarias los usan.
- Los CTA son enlaces reales (`buttonClasses` en `@tablenow/ui`) hacia `#contacto`; el alta es asistida.

**Pendiente para publicar (`[POR DEFINIR]`):**

- Correo, WhatsApp y dominio reales (en `site.ts` está el placeholder `hola@tablenow.mx`).
- `/prensa` tiene comunicados inventados (ronda pre-seed, alianza): reescribir o quitar.
- `/privacidad` y `/terminos` son un borrador sin revisión legal y con razón social de relleno.
- Confirmar que lealtad, encuestas y reseñas existen antes de anunciarlos.
- Logo SVG real.

**Para continuar (sesión 2026-07-13):**

- Revisar y aprobar cambios de UI/UX (commit marcado como opcional)
- Agregar assets reales (mockup teléfono, logo, fotos)
- Considerar scroll-triggered animations
- Merge a main cuando esté listo

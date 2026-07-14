# Contexto de Sesiones — Nexa

## Estado Actual (2026-07-13)

### Implementado
- **apps/landing**: Landing page completa con 6 secciones + páginas legales
- **packages/ui**: Componentes base + landing + micro-interacciones
- **Design tokens**: Paleta coral/teal, tipografías, radios
- **Tailwind preset**: Configurado con tokens Nexa
- **Iconos**: lucide-react instalado en @nexa/ui y landing

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
- [ ] Logo SVG de Nexa
- [ ] Imágenes para StepCards (opcional)

### Mejoras Opcionales
- [ ] Scroll-triggered animations (fade-in on viewport)
- [ ] SEO meta tags adicionales
- [ ] Back to top button

---

## Decisiones

| Tema | Decisión |
|------|----------|
| Branding | Usar "Nexa" consistentemente |
| Navegación | Links: Beneficios, Cómo funciona, Precios |
| CTA principal | "Empieza gratis" / "Crear mi restaurante" |
| Iconos | lucide-react |
| Mockup hero | Placeholder CSS hasta tener asset real |
| Header style | Transformación full→pill on scroll con glass effect |

---

## Notas para Commits

**Excluir siempre de commits:**
- `.claude/` — configuración local de Claude Code
- `Documentation/stitch_nexa_restaurant_waitlist_app/` — mocks de referencia (ya commiteados una vez)
- `Documentation/Mocks/` — archivos HTML de mocks (referencia, no código)

**Convención:**
- Commits en inglés (Conventional Commits)
- Un commit por feature/fix lógico
- Co-authored con Claude

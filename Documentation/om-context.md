# Contexto de Sesiones — Nexa

## Estado Actual (2026-07-13)

### Implementado
- **apps/landing**: Landing page completa con 6 secciones
- **packages/ui**: Componentes base + nuevos componentes landing
- **Design tokens**: Paleta coral/teal, tipografías, radios
- **Tailwind preset**: Configurado con tokens Nexa
- **Iconos**: lucide-react instalado en @nexa/ui y landing

### Componentes Creados (packages/ui)
- [x] Badge — etiquetas/chips
- [x] Header — navegación con logo, links, CTA
- [x] Footer — columnas, legal, copyright
- [x] FeatureCard — icono + título + descripción (con variante highlighted)
- [x] StepCard — pasos numerados con icono
- [x] PricingCard — planes con features y CTA
- [x] RoadmapCard — fases con estado (completed/in-progress/upcoming)
- [x] SocialProof — avatares + texto con highlight

### Landing Page Implementada (apps/landing/src/app/page.tsx)
- [x] Hero con mockup de teléfono (placeholder CSS)
- [x] Beneficios (6 FeatureCards)
- [x] Cómo funciona (3 StepCards)
- [x] Precios (2 PricingCards: Gratis y Pro)
- [x] Visión/Roadmap (3 RoadmapCards)
- [x] CTA final
- [x] Footer completo

---

## Pendiente

### Assets
- [ ] Mockup real del teléfono (actualmente placeholder CSS)
- [ ] Fotos de restaurantes para sección visión
- [ ] Logo SVG de Nexa
- [ ] Imágenes para StepCards (opcional)

### Mejoras
- [ ] Menú móvil (hamburger)
- [ ] Animaciones scroll (opcional)
- [ ] SEO meta tags adicionales

---

## Decisiones

| Tema | Decisión |
|------|----------|
| Branding | Usar "Nexa" consistentemente |
| Navegación | Links: Beneficios, Cómo funciona, Precios |
| CTA principal | "Empieza gratis" / "Crear mi restaurante" |
| Iconos | lucide-react |
| Mockup hero | Placeholder CSS hasta tener asset real |

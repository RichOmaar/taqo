---
name: Nexa Design System
colors:
  surface: '#fff8f5'
  surface-dim: '#e1d8d5'
  surface-bright: '#fff8f5'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#fbf2ee'
  surface-container: '#f5ece9'
  surface-container-high: '#efe6e3'
  surface-container-highest: '#e9e1dd'
  on-surface: '#1e1b19'
  on-surface-variant: '#57423d'
  inverse-surface: '#34302d'
  inverse-on-surface: '#f8efeb'
  outline: '#8a716c'
  outline-variant: '#dec0ba'
  surface-tint: '#a43c27'
  primary: '#a43c27'
  on-primary: '#ffffff'
  primary-container: '#f2755c'
  on-primary-container: '#670f02'
  inverse-primary: '#ffb4a5'
  secondary: '#006a62'
  on-secondary: '#ffffff'
  secondary-container: '#91f0e4'
  on-secondary-container: '#006f66'
  tertiary: '#655d58'
  on-tertiary: '#ffffff'
  tertiary-container: '#a29893'
  on-tertiary-container: '#37312d'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdad3'
  primary-fixed-dim: '#ffb4a5'
  on-primary-fixed: '#3e0400'
  on-primary-fixed-variant: '#842413'
  secondary-fixed: '#94f3e7'
  secondary-fixed-dim: '#77d7cb'
  on-secondary-fixed: '#00201d'
  on-secondary-fixed-variant: '#00504a'
  tertiary-fixed: '#ece0da'
  tertiary-fixed-dim: '#cfc4bf'
  on-tertiary-fixed: '#201a17'
  on-tertiary-fixed-variant: '#4c4541'
  background: '#fff8f5'
  on-background: '#1e1b19'
  surface-variant: '#e9e1dd'
typography:
  headline-xl:
    fontFamily: Quicksand
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Quicksand
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Quicksand
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 34px
  headline-md:
    fontFamily: Quicksand
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Be Vietnam Pro
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Be Vietnam Pro
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: Be Vietnam Pro
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Be Vietnam Pro
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 12px
  md: 24px
  lg: 48px
  xl: 80px
  gutter: 20px
  margin-mobile: 20px
  margin-desktop: 64px
---

## Brand & Style
The design system is built on a "Soft Hospitality" narrative, blending the warmth of a boutique bistro with the efficiency of modern technology. The brand personality is deeply welcoming, tactile, and human-centric, specifically tailored for the restaurant waitlist experience.

The visual style is a refined mix of **Minimalism** and **Tactile** design. It prioritizes generous whitespace to reduce the anxiety of waiting, using soft-touch surfaces and organic shapes to create a sense of comfort. Every interaction should feel like a polite gesture from a host. The interface avoids sharp edges and clinical precision in favor of a "cozy-modern" aesthetic that feels premium yet accessible.

## Colors
The palette is inspired by natural materials—terracotta, aged stone, and soft botanical greens.

- **Primary (#F2755C):** A vibrant coral/terracotta used for call-to-action elements, primary buttons, and critical status indicators. It evokes appetite and energy.
- **Secondary (#4FB0A5):** A soft teal used for success states, secondary accents, and "checked-in" indicators, providing a calming counterpoint to the primary coral.
- **Neutral (#2E2A28):** A deep charcoal with warm undertones for high-contrast text, ensuring legibility without the harshness of pure black.
- **Background (#FBF7F2):** A warm off-white that serves as the foundation for all screens, creating a paper-like, organic feel.
- **Muted Text (#8C837E):** A warm gray for secondary information and captions, maintaining the soft aesthetic.

## Typography
The typography system uses a pairing of **Quicksand** for headlines and **Be Vietnam Pro** for functional text. 

**Quicksand** provides a friendly, rounded geometric structure that reinforces the "soft" brand personality. It should be used for all display text and major headings. **Be Vietnam Pro** is used for body copy and labels to maintain high legibility and a contemporary, professional feel. 

Maintain generous paragraph spacing (1.5x font size) to ensure the interface feels breathable and unhurried. Use "Sentance case" for all headings to keep the tone conversational and approachable in Spanish.

## Layout & Spacing
The layout follows a **Fluid Grid** model with high internal padding to evoke a premium, airy feel.

- **Mobile:** 4-column layout with 20px side margins and 20px gutters. Content should primarily stack vertically in soft-rounded cards.
- **Desktop:** 12-column layout with a max-width of 1200px. Use asymmetrical layouts to create a modern, editorial feel for restaurant-side dashboards.
- **Spacing Rhythm:** Use a strict 8px baseline grid. Components should leverage "Generous Padding" (24px+) to prevent the UI from feeling crowded during busy restaurant hours.

## Elevation & Depth
Depth is created using **Ambient Shadows** and tonal layering. Avoid harsh dropshadows. 

- **Surface Level 0:** The warm background (#FBF7F2).
- **Surface Level 1 (Cards):** White (#FFFFFF) with a very soft, diffused shadow: `0px 10px 30px rgba(46, 42, 40, 0.04)`. This creates a subtle "lift" from the warm background.
- **Active States:** Buttons and interactive elements use a slightly deeper shadow upon hover to simulate a tactile "pressable" surface.
- **Overlays:** Modals and bottom sheets use a soft backdrop blur (12px) with a 20% opacity tint of the neutral color to maintain focus.

## Shapes
The shape language is defined by large, welcoming radii. 

- **Cards and Containers:** Use a consistent 20px (rounded-lg) or 24px (rounded-xl) radius to soften the edges of the digital experience.
- **Buttons:** Fully pill-shaped (rounded-full) to emphasize their interactive nature and friendly appearance.
- **Inputs:** 16px radius to align with the overall soft-geometric theme.
- **Icons:** Use "feather" or "phosphor" style line icons with rounded caps and joins. Avoid sharp corners in any iconography.

## Components
- **Primary Buttons:** Pill-shaped, #F2755C background, white text. Use large horizontal padding (32px).
- **Secondary Buttons:** Pill-shaped, transparent background with #F2755C border (2px) or a soft teal variation for secondary actions.
- **Waitlist Cards:** White background, 24px corner radius, featuring a prominent "Tiempo de espera" (Wait time) in Quicksand Bold.
- **Chips/Badges:** Small pill shapes with 10% opacity of the primary or secondary color for status indicators like "Mesa lista" or "En espera".
- **Input Fields:** Soft beige or white background with 16px corners. The focus state should use a 2px soft teal (#4FB0A5) border.
- **Bottom Sheets:** For mobile interactions (e.g., adding a guest), use bottom sheets with 32px top-corner radii to make the UI feel native and accessible.
- **Language:** All microcopy should be in Spanish (es-MX), using warm phrasing like "¡Bienvenidos!" instead of "Inicio" and "Reservar lugar" instead of "Enviar".
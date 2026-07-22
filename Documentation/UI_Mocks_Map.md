# Mapa de Mocks → App

Mapeo de cada mock de `Documentation/Mocks/` a la app del monorepo que lo implementa.
Fuente de referencia: `V1 - Nexa MVP/8_Prompts_Stitch_Nexa.docx` (prompts de Google Stitch)
y `DESIGN.md` (design system).

> Los mocks son **referencia visual**, no la fuente de verdad final. El copy visible es en
> español (es-MX); el código, en inglés (ver `CLAUDE.md`).

## Design system (base transversal)

| Mock                           | Destino                                                                                   |
| ------------------------------ | ----------------------------------------------------------------------------------------- |
| `nexa_design_system/DESIGN.md` | `packages/ui` — tokens (colores, tipografía, spacing, radios, sombras) y componentes base |

## `apps/landing` — Sitio de marketing (desktop-first, SEO)

| Mock                                      | Sección                      |
| ----------------------------------------- | ---------------------------- |
| `landing_page_hero_con_confianza_nexa`    | Hero con prueba de confianza |
| `c_mo_funciona_nexa_landing_section`      | Cómo funciona                |
| `beneficios_nexa_landing_section`         | Beneficios                   |
| `secci_n_de_precios_nexa_landing_section` | Precios (teaser freemium)    |
| `visi_n_y_futuro_nexa_landing_section`    | Visión y futuro              |
| `banda_cta_y_footer_nexa_landing_page`    | Banda CTA + footer           |

## `apps/client` — Comensal (mobile-first)

| Mock                              | Pantalla                            | Prompt Stitch |
| --------------------------------- | ----------------------------------- | ------------- |
| `unirse_a_la_fila_nexa`           | Unirse a la fila (alta)             | 1.1           |
| `est_s_en_la_fila_nexa`           | Estás en la fila (estado + ETA)     | 1.2           |
| `tu_mesa_est_lista_nexa`          | ¡Tu mesa está lista!                | 1.3           |
| `explorar_restaurantes_nexa`      | Catálogo de restaurantes            | 1.4           |
| `c_mo_estuvo_tu_experiencia_nexa` | Evaluación post-servicio            | 1.5           |
| `crea_tu_cuenta_nexa`             | Crear cuenta (opcional, BetterAuth) | 1.6           |

## `apps/reception` — Recepción / Anfitrión (tablet-desktop)

| Mock                                | Pantalla                          | Prompt Stitch |
| ----------------------------------- | --------------------------------- | ------------- |
| `tablero_de_control_nexa_anfitri_n` | Tablero de control (cola en vivo) | 2.1           |
| `agregar_a_la_fila_nexa_anfitri_n`  | Alta manual de comensal           | 2.2           |
| `detalle_de_cliente_nexa_anfitri_n` | Detalle de comensal               | 2.3           |

## `apps/admin` — Dueño (desktop)

| Mock                                        | Pantalla                                       | Prompt Stitch |
| ------------------------------------------- | ---------------------------------------------- | ------------- |
| `panel_de_m_tricas_nexa_due_o`              | Dashboard de métricas                          | 3.1           |
| `configuraci_n_nexa_due_o`                  | Configuración del restaurante                  | 3.2           |
| `personalizaci_n_del_formulario_nexa_due_o` | Constructor de formulario (contexto `surveys`) | 3.3           |
| `gesti_n_de_plan_nexa_due_o`                | Plan y facturación (freemium)                  | 3.4           |

## Convención de nombres

Las carpetas de `Mocks/` usan el título en español del prompt de Stitch, transliterado
(acentos y ñ → `_`). El sufijo indica la app: `_anfitri_n` = recepción, `_due_o` = admin,
`_landing_*` = landing, sin sufijo (o contexto de comensal) = client.

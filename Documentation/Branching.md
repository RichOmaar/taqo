# Ramas y entornos (Git flow)

Nexa usa tres ramas de larga vida, cada una asociada a un **entorno** de despliegue.
El disparo de CI/CD por rama se cablea en NEXA-024/026; este documento define la
convención que seguimos desde ya.

## Ramas de larga vida

| Rama   | Rol                                        | Entorno (CD futuro) | Se escribe mediante        |
| ------ | ------------------------------------------ | ------------------- | -------------------------- |
| `dev`  | **Default**. Integración y base de tareas. | dev                 | PRs desde ramas de tarea   |
| `qa`   | Estabilización / pruebas.                  | qa                  | Promoción desde `dev` (PR) |
| `prod` | Producción.                                | prod                | Promoción desde `qa` (PR)  |

Regla de oro: **nunca se commitea directo a `qa` ni a `prod`**. Solo llegan cambios por
promoción. `dev` solo recibe cambios por PR desde ramas de tarea (salvo docs/chore triviales).

## Flujo de una tarea

```
dev ──▶ nexa-00x-slug ──(PR)──▶ dev ──(PR)──▶ qa ──(PR)──▶ prod
        (rama de tarea)          integración   estabiliza   producción
```

1. Parte siempre de `dev` actualizado:
   ```bash
   git checkout dev && git pull
   git checkout -b nexa-008-reception-actions   # <task-id>-<slug>
   ```
2. Trabaja en steps (un commit por step, Conventional Commits en inglés).
3. Abre PR **contra `dev`**. Al mergear, la rama de tarea se borra.

## Promoción entre entornos

- `dev → qa`: cuando un bloque está listo para pruebas, PR de `dev` a `qa`.
- `qa → prod`: cuando qa está validado, PR de `qa` a `prod`.
- Mantener las promociones como merges (no rebase) para preservar el historial.

## Hotfixes

Un fix urgente en producción sale de `prod` (`hotfix/<slug>`), PR a `prod`, y luego se
**back-mergea** a `qa` y `dev` para que no se pierda.

## CI/CD (futuro, NEXA-024/026)

- Push/merge a `dev` → deploy al entorno **dev**.
- Push/merge a `qa` → deploy al entorno **qa**.
- Push/merge a `prod` → deploy al entorno **prod**.

La separación de despliegue de `apps/landing` respecto al resto se resuelve también en
esa etapa (postbuild), sin cambiar esta topología de ramas.

## Convenciones

- Nombre de rama de tarea: `nexa-00x-slug` (id de la tarea + slug corto en inglés).
- Hotfix: `hotfix/<slug>`.
- Protecciones recomendadas (cuando haya CI): exigir PR + checks verdes en `dev`, `qa` y
  `prod`; prohibir push directo a `qa`/`prod`.

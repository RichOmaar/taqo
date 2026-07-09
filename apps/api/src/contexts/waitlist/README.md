# waitlist context

Núcleo de la cola: entradas (WaitlistEntry), estados (waiting → notified → seated → no_show/cancelled), posición y cálculo de ETA.

Capas: `domain` → `application` → `infrastructure` → `interfaces`
(dirección de dependencias hacia adentro). Ver `../README.md` y `CLAUDE.md`.

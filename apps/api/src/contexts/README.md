# Bounded contexts

Cada bounded context vive en su propia carpeta y sigue las capas DDD:

```
<context>/
├── domain/          # Entidades, value objects, eventos, interfaces de repo. Sin framework.
├── application/     # Casos de uso / servicios de aplicación. Orquestan el dominio.
├── infrastructure/  # Implementaciones concretas (Prisma, Twilio, Strapi, ...).
└── interfaces/      # Controladores HTTP, handlers de WebSocket, mapeo DTO ↔ dominio.
```

Dirección de dependencias (hacia adentro): `interfaces → application → domain`.
La `infrastructure` implementa interfaces definidas en `domain`/`application`.

Contexts del MVP (scaffold en NEXA-006): `waitlist`, `restaurant`, `notifications`, `identity`.
Ver `CLAUDE.md` para el detalle de las reglas.

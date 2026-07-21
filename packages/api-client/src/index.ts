// Public entrypoint for @nexa/api-client — the typed HTTP and WebSocket client
// shared by the Nexa frontends. Transport only: it holds no business logic and
// speaks exclusively in the contracts declared by @nexa/types.
export * from './errors';
export * from './http';
export * from './client';
export * from './socket';

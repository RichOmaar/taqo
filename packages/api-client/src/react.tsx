'use client';

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { useStore } from 'zustand';

import type { NexaApiClient } from './client';
import {
  createNexaSession,
  type NexaSession,
  type SessionState,
  type SessionStorage,
} from './session';
import { createWaitlistSocket, type WaitlistSocket, type WaitlistSocketListeners } from './socket';

const SessionContext = createContext<NexaSession | null>(null);

export interface SessionProviderProps {
  baseUrl: string;
  storage?: SessionStorage;
  /** Injectable for tests; defaults to the global fetch. */
  fetch?: typeof globalThis.fetch;
  children: ReactNode;
}

/**
 * Provides one session (and the API client bound to it) to the tree, and
 * restores it from the persisted token on mount.
 */
export function SessionProvider({ baseUrl, storage, fetch, children }: SessionProviderProps) {
  // Created once per mount; a plain call would rebuild it on every render and
  // drop the token with it.
  const ref = useRef<NexaSession | null>(null);
  ref.current ??= createNexaSession({ baseUrl, storage, fetch });
  const session = ref.current;

  useEffect(() => {
    session.store
      .getState()
      .restore()
      .catch((error: unknown) => {
        // A non-auth failure (API down) means we cannot confirm the session.
        // Fall back to signed-out so the app stays usable, but say why rather
        // than leaving a guard spinning on `unknown` forever.
        session.store.setState({
          status: 'anonymous',
          error: error instanceof Error ? error.message : 'No se pudo restaurar la sesión',
        });
      });
  }, [session]);

  return <SessionContext.Provider value={session}>{children}</SessionContext.Provider>;
}

function useNexaSession(): NexaSession {
  const session = useContext(SessionContext);
  if (!session) throw new Error('useSession must be used inside a <SessionProvider>');
  return session;
}

/** The current session state; re-renders on any session change. */
export function useSession(): SessionState {
  return useStore(useNexaSession().store);
}

/** The API client bound to the current session. */
export function useApi(): NexaApiClient {
  return useNexaSession().api;
}

/**
 * Opens a waitlist socket for the lifetime of the component.
 *
 * The socket is rebuilt when the signed-in user changes, since the token is
 * fixed at handshake time. Listeners are read through a ref so callers can
 * pass inline objects without tearing down the connection every render.
 */
export function useWaitlistSocket(listeners: WaitlistSocketListeners): WaitlistSocket | null {
  const session = useNexaSession();
  const userId = useStore(session.store, (state) => state.user?.id ?? null);
  const [socket, setSocket] = useState<WaitlistSocket | null>(null);

  const listenersRef = useRef(listeners);
  listenersRef.current = listeners;

  useEffect(() => {
    const created = createWaitlistSocket({
      baseUrl: session.baseUrl,
      getToken: session.getToken,
    });

    const stop = created.listen({
      onEntryAdded: (payload) => listenersRef.current.onEntryAdded?.(payload),
      onEntryUpdated: (payload) => listenersRef.current.onEntryUpdated?.(payload),
      onEntryRemoved: (payload) => listenersRef.current.onEntryRemoved?.(payload),
    });

    setSocket(created);

    return () => {
      stop();
      created.disconnect();
      setSocket(null);
    };
  }, [session, userId]);

  return socket;
}

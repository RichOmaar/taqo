import type {
  AddQueueRequest,
  EntryActionResponse,
  GetEntryResponse,
  GetMetricsResponse,
  GetRestaurantResponse,
  JoinWaitlistRequest,
  JoinWaitlistResponse,
  ListQueueEntriesResponse,
  ListRestaurantsResponse,
  PushSubscriptionRequest,
  QueueResponse,
  SubmitReviewRequest,
  SubmitReviewResponse,
  UpdateQueueRequest,
  UpdateRestaurantConfigRequest,
  UUID,
  VapidKeyResponse,
} from '@nexa/types';

import { ApiRequestError } from './errors';
import { createHttpClient, type HttpClientOptions } from './http';

export type ApiClientOptions = HttpClientOptions;

/** Path segments may contain user-supplied codes; always encode them. */
const seg = encodeURIComponent;

/**
 * Typed client for the Nexa API.
 *
 * One instance per app, created with the app's base URL and token source.
 * Every method maps to exactly one endpoint and returns the contract declared
 * in `@nexa/types` — this package holds no business logic.
 */
export function createApiClient(options: ApiClientOptions) {
  const http = createHttpClient(options);
  const baseUrl = options.baseUrl.replace(/\/+$/, '');
  const fetchImpl = options.fetch ?? globalThis.fetch;

  return {
    auth: {
      /**
       * Signs a staff user in and returns the bearer token.
       *
       * BetterAuth returns the token in the `set-auth-token` response header
       * rather than the body, so this bypasses the JSON request helper.
       */
      async signInWithEmail(email: string, password: string): Promise<string> {
        const response = await fetchImpl(`${baseUrl}/api/auth/sign-in/email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });

        if (!response.ok) {
          throw new ApiRequestError(
            response.status,
            'invalid_credentials',
            'Credenciales inválidas',
          );
        }

        const token = response.headers.get('set-auth-token');
        if (!token) {
          throw new ApiRequestError(
            response.status,
            'missing_token',
            'La respuesta no incluyó un token',
          );
        }

        return token;
      },
    },

    restaurants: {
      list(): Promise<ListRestaurantsResponse> {
        return http.request('/restaurants');
      },
      get(code: string): Promise<GetRestaurantResponse> {
        return http.request(`/restaurants/${seg(code)}`);
      },
      metrics(code: string): Promise<GetMetricsResponse> {
        return http.request(`/restaurants/${seg(code)}/metrics`, { auth: true });
      },
      updateConfig(
        code: string,
        body: UpdateRestaurantConfigRequest,
      ): Promise<GetRestaurantResponse> {
        return http.request(`/restaurants/${seg(code)}`, { method: 'PATCH', body, auth: true });
      },
      addQueue(code: string, body: AddQueueRequest): Promise<GetRestaurantResponse> {
        return http.request(`/restaurants/${seg(code)}/queues`, {
          method: 'POST',
          body,
          auth: true,
        });
      },
      /** Auth is optional here: a token links the entry to a registered diner. */
      joinWaitlist(code: string, body: JoinWaitlistRequest): Promise<JoinWaitlistResponse> {
        return http.request(`/restaurants/${seg(code)}/waitlist`, {
          method: 'POST',
          body,
          auth: true,
        });
      },
      listQueueEntries(restaurantId: UUID, queueId: UUID): Promise<ListQueueEntriesResponse> {
        return http.request(`/restaurants/${seg(restaurantId)}/queues/${seg(queueId)}/entries`);
      },
    },

    queues: {
      update(id: UUID, body: UpdateQueueRequest): Promise<QueueResponse> {
        return http.request(`/queues/${seg(id)}`, { method: 'PATCH', body, auth: true });
      },
    },

    entries: {
      get(id: UUID): Promise<GetEntryResponse> {
        return http.request(`/entries/${seg(id)}`);
      },
      submitReview(id: UUID, body: SubmitReviewRequest): Promise<SubmitReviewResponse> {
        return http.request(`/entries/${seg(id)}/review`, { method: 'POST', body });
      },
      /** Diner self-cancel; the entry id itself is the capability. */
      leave(id: UUID): Promise<EntryActionResponse> {
        return http.request(`/entries/${seg(id)}/leave`, { method: 'POST' });
      },
      notify(id: UUID): Promise<EntryActionResponse> {
        return http.request(`/entries/${seg(id)}/notify`, { method: 'POST', auth: true });
      },
      seat(id: UUID): Promise<EntryActionResponse> {
        return http.request(`/entries/${seg(id)}/seat`, { method: 'POST', auth: true });
      },
      markNoShow(id: UUID): Promise<EntryActionResponse> {
        return http.request(`/entries/${seg(id)}/no-show`, { method: 'POST', auth: true });
      },
      cancel(id: UUID): Promise<EntryActionResponse> {
        return http.request(`/entries/${seg(id)}/cancel`, { method: 'POST', auth: true });
      },
      subscribePush(id: UUID, body: PushSubscriptionRequest): Promise<void> {
        return http.request(`/entries/${seg(id)}/push-subscription`, { method: 'POST', body });
      },
    },

    push: {
      publicKey(): Promise<VapidKeyResponse> {
        return http.request('/push/public-key');
      },
    },
  };
}

export type NexaApiClient = ReturnType<typeof createApiClient>;

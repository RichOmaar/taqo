import type {
  AccrualMode,
  AddQueueRequest,
  EntryActionResponse,
  GetCurrentStaffResponse,
  GetEntryResponse,
  GetMetricsResponse,
  GetMetricsSeriesResponse,
  GetPeakHoursResponse,
  DowngradePolicy,
  GetMembershipProgramResponse,
  GetRestaurantResponse,
  JoinMembershipResponse,
  ListReviewsResponse,
  MembershipCardResponse,
  MembershipProgramResponse,
  MembershipStatsResponse,
  MetricsBucket,
  RedemptionResponse,
  ReviewSummaryResponse,
  RewardResponse,
  ListSurveysResponse,
  SubmitSurveyResponse,
  Survey,
  SurveyAnswer,
  SurveyPurpose,
  SurveyResponsePayload,
  SurveyStatsResponse,
  TierMetric,
  TierPeriod,
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
import { createHttpClient, normalizeBaseUrl, type HttpClientOptions } from './http';

export type ApiClientOptions = HttpClientOptions;

/** Path segments may contain user-supplied codes; always encode them. */
const seg = encodeURIComponent;

/** Window for a metrics request. Omitted ends fall back to the server default. */
export interface MetricsRangeQuery {
  from?: Date;
  to?: Date;
}

/** Programme settings the owner controls. */
export interface ProgramSettings {
  name: string;
  accrualMode: AccrualMode;
  pointsPerVisit: number;
  tierMetric: TierMetric;
  tierPeriod: TierPeriod;
  /** Required when the period is rolling. */
  tierWindowDays: number | null;
  downgradePolicy: DowngradePolicy;
}

/** A level as the owner defines it; the server assigns the id. */
export interface TierInput {
  name: string;
  threshold: number;
  benefits: string[];
  position: number;
}

export interface RewardInput {
  name: string;
  description: string | null;
  costPoints: number;
  minTierPosition: number | null;
  limitPerMember: number | null;
  isActive: boolean;
}

/** A survey as the owner creates it. */
export interface SurveyInput {
  purpose: SurveyPurpose;
  title: string;
  description: string | null;
}

/** A question as the builder sends it; `id` is absent for a new one. */
export interface QuestionInput {
  id?: string;
  type: Survey['questions'][number]['type'];
  label: string;
  helpText: string | null;
  required: boolean;
  position: number;
  config: Survey['questions'][number]['config'];
}

/** Filters for the review list. */
export interface ReviewListQuery extends MetricsRangeQuery {
  /** 1–5; omit for every rating. */
  rating?: number;
  limit?: number;
  /** `nextCursor` from a previous page. */
  cursor?: string;
}

type Query = ReviewListQuery & { bucket?: string };

/** Builds a query string, omitting absent values so defaults stay server-side. */
function query(params?: Query): string {
  if (!params) return '';
  const search = new URLSearchParams();
  if (params.from) search.set('from', params.from.toISOString());
  if (params.to) search.set('to', params.to.toISOString());
  if (params.bucket) search.set('bucket', params.bucket);
  if (params.rating !== undefined) search.set('rating', String(params.rating));
  if (params.limit !== undefined) search.set('limit', String(params.limit));
  if (params.cursor) search.set('cursor', params.cursor);
  const encoded = search.toString();
  return encoded ? `?${encoded}` : '';
}

/**
 * Typed client for the Nexa API.
 *
 * One instance per app, created with the app's base URL and token source.
 * Every method maps to exactly one endpoint and returns the contract declared
 * in `@nexa/types` — this package holds no business logic.
 */
export function createApiClient(options: ApiClientOptions) {
  const http = createHttpClient(options);
  const baseUrl = normalizeBaseUrl(options.baseUrl);
  const fetchImpl = options.fetch ?? globalThis.fetch;

  /**
   * BetterAuth returns the bearer token in the `set-auth-token` response
   * header rather than the body, so credential exchanges bypass the JSON
   * request helper.
   */
  async function tokenRequest(
    path: string,
    body: Record<string, string>,
    failure: { code: string; message: string },
  ): Promise<string> {
    const response = await fetchImpl(`${baseUrl}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new ApiRequestError(response.status, failure.code, failure.message);
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
  }

  return {
    auth: {
      /** Signs a user in and returns the bearer token. */
      signInWithEmail(email: string, password: string): Promise<string> {
        return tokenRequest(
          '/api/auth/sign-in/email',
          { email, password },
          { code: 'invalid_credentials', message: 'Credenciales inválidas' },
        );
      },

      /** Registers a diner. Staff accounts are assigned, never self-served. */
      signUpWithEmail(name: string, email: string, password: string): Promise<string> {
        return tokenRequest(
          '/api/auth/sign-up/email',
          { name, email, password },
          { code: 'signup_failed', message: 'No se pudo crear la cuenta' },
        );
      },

      /** The signed-in staff user and the restaurant they manage. */
      me(): Promise<GetCurrentStaffResponse> {
        return http.request('/me', { auth: true });
      },
    },

    restaurants: {
      list(): Promise<ListRestaurantsResponse> {
        return http.request('/restaurants');
      },
      get(code: string): Promise<GetRestaurantResponse> {
        return http.request(`/restaurants/${seg(code)}`);
      },
      metrics(code: string, range?: MetricsRangeQuery): Promise<GetMetricsResponse> {
        return http.request(`/restaurants/${seg(code)}/metrics${query(range)}`, { auth: true });
      },
      /** Volume over time, for the dashboard's queue-volume chart. */
      metricsSeries(
        code: string,
        options?: MetricsRangeQuery & { bucket?: MetricsBucket },
      ): Promise<GetMetricsSeriesResponse> {
        return http.request(`/restaurants/${seg(code)}/metrics/timeseries${query(options)}`, {
          auth: true,
        });
      },
      /** Volume by weekday and hour, for the peak-hours heatmap. */
      peakHours(code: string, range?: MetricsRangeQuery): Promise<GetPeakHoursResponse> {
        return http.request(`/restaurants/${seg(code)}/metrics/peak-hours${query(range)}`, {
          auth: true,
        });
      },
      /** Reviews, newest first. Pass `nextCursor` back to page. */
      reviews(code: string, options?: ReviewListQuery): Promise<ListReviewsResponse> {
        return http.request(`/restaurants/${seg(code)}/reviews${query(options)}`, { auth: true });
      },
      /** Average and rating distribution. */
      reviewSummary(code: string, range?: MetricsRangeQuery): Promise<ReviewSummaryResponse> {
        return http.request(`/restaurants/${seg(code)}/reviews/summary${query(range)}`, {
          auth: true,
        });
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

    /** Loyalty programme: owner configuration and analytics. */
    membership: {
      get(code: string): Promise<GetMembershipProgramResponse> {
        return http.request(`/restaurants/${seg(code)}/membership`, { auth: true });
      },
      create(code: string, body: ProgramSettings): Promise<MembershipProgramResponse> {
        return http.request(`/restaurants/${seg(code)}/membership`, {
          method: 'POST',
          body,
          auth: true,
        });
      },
      update(code: string, body: Partial<ProgramSettings>): Promise<MembershipProgramResponse> {
        return http.request(`/restaurants/${seg(code)}/membership`, {
          method: 'PATCH',
          body,
          auth: true,
        });
      },
      /** Replaces the whole scheme; thresholds must rise with position. */
      replaceTiers(code: string, tiers: TierInput[]): Promise<MembershipProgramResponse> {
        return http.request(`/restaurants/${seg(code)}/membership/tiers`, {
          method: 'PUT',
          body: { tiers },
          auth: true,
        });
      },
      publish(code: string): Promise<MembershipProgramResponse> {
        return http.request(`/restaurants/${seg(code)}/membership/publish`, {
          method: 'POST',
          auth: true,
        });
      },
      pause(code: string): Promise<MembershipProgramResponse> {
        return http.request(`/restaurants/${seg(code)}/membership/pause`, {
          method: 'POST',
          auth: true,
        });
      },
      createReward(code: string, body: RewardInput): Promise<RewardResponse> {
        return http.request(`/restaurants/${seg(code)}/membership/rewards`, {
          method: 'POST',
          body,
          auth: true,
        });
      },
      updateReward(
        code: string,
        rewardId: UUID,
        body: Partial<RewardInput>,
      ): Promise<RewardResponse> {
        return http.request(`/restaurants/${seg(code)}/membership/rewards/${seg(rewardId)}`, {
          method: 'PATCH',
          body,
          auth: true,
        });
      },
      stats(code: string): Promise<MembershipStatsResponse> {
        return http.request(`/restaurants/${seg(code)}/membership/stats`, { auth: true });
      },
      /** Reception: marks a code as used at the counter. */
      validateCode(code: string): Promise<RedemptionResponse> {
        return http.request('/memberships/redemptions/validate', {
          method: 'POST',
          body: { code },
          auth: true,
        });
      },
    },

    /** Configurable forms: the intake form and the post-visit survey. */
    surveys: {
      list(code: string): Promise<ListSurveysResponse> {
        return http.request(`/restaurants/${seg(code)}/surveys`, { auth: true });
      },
      create(code: string, body: SurveyInput): Promise<SurveyResponsePayload> {
        return http.request(`/restaurants/${seg(code)}/surveys`, {
          method: 'POST',
          body,
          auth: true,
        });
      },
      replaceQuestions(
        code: string,
        purpose: SurveyPurpose,
        questions: QuestionInput[],
      ): Promise<SurveyResponsePayload> {
        return http.request(`/restaurants/${seg(code)}/surveys/${seg(purpose)}/questions`, {
          method: 'PUT',
          body: { questions },
          auth: true,
        });
      },
      publish(code: string, purpose: SurveyPurpose): Promise<SurveyResponsePayload> {
        return http.request(`/restaurants/${seg(code)}/surveys/${seg(purpose)}/publish`, {
          method: 'POST',
          auth: true,
        });
      },
      close(code: string, purpose: SurveyPurpose): Promise<SurveyResponsePayload> {
        return http.request(`/restaurants/${seg(code)}/surveys/${seg(purpose)}/close`, {
          method: 'POST',
          auth: true,
        });
      },
      stats(code: string, purpose: SurveyPurpose): Promise<SurveyStatsResponse> {
        return http.request(`/restaurants/${seg(code)}/surveys/${seg(purpose)}/stats`, {
          auth: true,
        });
      },
      /** The live definition, if any. Open: a diner may have no account yet. */
      active(code: string, purpose: SurveyPurpose): Promise<{ survey: Survey | null }> {
        return http.request(`/restaurants/${seg(code)}/surveys/${seg(purpose)}/active`);
      },
      submit(
        surveyId: UUID,
        subjectRef: string | null,
        answers: SurveyAnswer[],
      ): Promise<SubmitSurveyResponse> {
        return http.request(`/surveys/${seg(surveyId)}/responses`, {
          method: 'POST',
          body: { subjectRef, answers },
        });
      },
    },

    /** Loyalty programme, from the diner's side. */
    myMembership: {
      get(code: string): Promise<MembershipCardResponse> {
        return http.request(`/restaurants/${seg(code)}/membership/me`, { auth: true });
      },
      join(code: string): Promise<JoinMembershipResponse> {
        return http.request(`/restaurants/${seg(code)}/membership/join`, {
          method: 'POST',
          auth: true,
        });
      },
      redeem(membershipId: UUID, rewardId: UUID): Promise<RedemptionResponse> {
        return http.request(`/memberships/${seg(membershipId)}/redeem`, {
          method: 'POST',
          body: { rewardId },
          auth: true,
        });
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

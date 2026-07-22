import { GetMetrics } from './contexts/restaurant/application/get-metrics';
import { GetMetricsSeries } from './contexts/restaurant/application/get-metrics-series';
import { GetPeakHours } from './contexts/restaurant/application/get-peak-hours';
import { GetReviewSummary } from './contexts/restaurant/application/get-review-summary';
import { ListReviews } from './contexts/restaurant/application/list-reviews';
import { ListWaitlistHistory } from './contexts/restaurant/application/list-waitlist-history';
import { RemoveQueue } from './contexts/restaurant/application/remove-queue';
import { ListRestaurants } from './contexts/restaurant/application/list-restaurants';
import { RestaurantConfig } from './contexts/restaurant/application/restaurant-config';
import type { RestaurantRepository } from './contexts/restaurant/domain/restaurant-repository';
import { PrismaMetricsRepository } from './contexts/restaurant/infrastructure/prisma-metrics-repository';
import { PrismaRestaurantRepository } from './contexts/restaurant/infrastructure/prisma-restaurant-repository';
import { PrismaReviewReadRepository } from './contexts/restaurant/infrastructure/prisma-review-read-repository';
import { PrismaWaitlistHistoryReadRepository } from './contexts/restaurant/infrastructure/prisma-waitlist-history-read-repository';
import { GetCurrentStaff } from './contexts/identity/application/get-current-staff';
import { PrismaStaffRepository } from './contexts/identity/infrastructure/prisma-staff-repository';
import { EnrollMember } from './contexts/memberships/application/enroll-member';
import { ManageProgram } from './contexts/memberships/application/manage-program';
import { RecordVisit } from './contexts/memberships/application/record-visit';
import { RedeemReward } from './contexts/memberships/application/redeem-reward';
import { ValidateRedemption } from './contexts/memberships/application/validate-redemption';
import type {
  LedgerRepository,
  MembershipRepository,
  ProgramRepository,
  RewardRepository,
} from './contexts/memberships/domain/repositories';
import { PrismaProgramWriteRepository } from './contexts/memberships/infrastructure/prisma-program-write-repository';
import {
  PrismaLedgerRepository,
  PrismaMembershipRepository,
  PrismaProgramRepository,
  PrismaRedemptionRepository,
  PrismaRewardRepository,
} from './contexts/memberships/infrastructure/prisma-repositories';
import {
  PrismaStatsRepository,
  type StatsRepository,
} from './contexts/memberships/infrastructure/prisma-stats-repository';
import { ManageSurvey } from './contexts/surveys/application/manage-survey';
import { SubmitResponse } from './contexts/surveys/application/submit-response';
import type { ResponseRepository, SurveyRepository } from './contexts/surveys/domain/repositories';
import { PrismaResponseRepository } from './contexts/surveys/infrastructure/prisma-response-repository';
import { PrismaSurveyRepository } from './contexts/surveys/infrastructure/prisma-survey-repository';
import { loadEnv } from './config/env';
import type { PushSubscriptionRepository } from './contexts/notifications/domain/push-subscription-repository';
import { PrismaPushSubscriptionRepository } from './contexts/notifications/infrastructure/prisma-push-subscription-repository';
import { WebPushNotifier } from './contexts/notifications/infrastructure/web-push-notifier';
import { EntryActions } from './contexts/waitlist/application/entry-actions';
import { ExpireNoShows } from './contexts/waitlist/application/expire-no-shows';
import { GetEntry } from './contexts/waitlist/application/get-entry';
import { JoinWaitlist } from './contexts/waitlist/application/join-waitlist';
import { ListQueueEntries } from './contexts/waitlist/application/list-queue-entries';
import type { WaitlistEventPublisher } from './contexts/waitlist/application/ports';
import { SubmitReview } from './contexts/waitlist/application/submit-review';
import { PrismaReviewRepository } from './contexts/waitlist/infrastructure/prisma-review-repository';
import { PrismaWaitlistRepository } from './contexts/waitlist/infrastructure/prisma-waitlist-repository';
import { prisma } from './db/prisma';

export interface Container {
  restaurants: RestaurantRepository;
  getCurrentStaff: GetCurrentStaff;
  listRestaurants: ListRestaurants;
  getMetrics: GetMetrics;
  getMetricsSeries: GetMetricsSeries;
  getPeakHours: GetPeakHours;
  listReviews: ListReviews;
  listWaitlistHistory: ListWaitlistHistory;
  removeQueue: RemoveQueue;
  getReviewSummary: GetReviewSummary;
  restaurantConfig: RestaurantConfig;
  joinWaitlist: JoinWaitlist;
  listQueueEntries: ListQueueEntries;
  getEntry: GetEntry;
  entryActions: EntryActions;
  submitReview: SubmitReview;
  expireNoShows: ExpireNoShows;
  pushSubscriptions: PushSubscriptionRepository;
  vapidPublicKey: string | undefined;
  membershipPrograms: ProgramRepository;
  memberships: MembershipRepository;
  membershipLedger: LedgerRepository;
  membershipRewards: RewardRepository;
  membershipStats: StatsRepository;
  manageProgram: ManageProgram;
  enrollMember: EnrollMember;
  redeemReward: RedeemReward;
  validateRedemption: ValidateRedemption;
  surveys: SurveyRepository;
  surveyResponses: ResponseRepository;
  manageSurvey: ManageSurvey;
  submitSurveyResponse: SubmitResponse;
}

/** Composition root: wires repositories and use cases with the given publisher. */
export function buildContainer(publisher: WaitlistEventPublisher): Container {
  const env = loadEnv();
  const restaurants = new PrismaRestaurantRepository(prisma);
  const metricsRepository = new PrismaMetricsRepository(prisma);
  const reviewReads = new PrismaReviewReadRepository(prisma);
  const historyReads = new PrismaWaitlistHistoryReadRepository(prisma);

  const membershipPrograms = new PrismaProgramRepository(prisma);
  const membershipsRepo = new PrismaMembershipRepository(prisma);
  const membershipLedger = new PrismaLedgerRepository(prisma);
  const membershipRewards = new PrismaRewardRepository(prisma);
  const membershipRedemptions = new PrismaRedemptionRepository(prisma);
  // Seating credits loyalty through waitlist's VisitRecorder port; the mapping
  // from an entry to a visit lives at this seam, not inside either context.
  const recordVisit = new RecordVisit(membershipPrograms, membershipsRepo, membershipLedger);

  const surveys = new PrismaSurveyRepository(prisma);
  const surveyResponses = new PrismaResponseRepository(prisma);

  const waitlist = new PrismaWaitlistRepository(prisma);
  const reviews = new PrismaReviewRepository(prisma);
  const submitReview = new SubmitReview(waitlist, reviews);
  const pushSubscriptions = new PrismaPushSubscriptionRepository(prisma);
  const notifier = new WebPushNotifier(pushSubscriptions, {
    publicKey: env.VAPID_PUBLIC_KEY,
    privateKey: env.VAPID_PRIVATE_KEY,
    subject: env.VAPID_SUBJECT,
  });
  return {
    restaurants,
    // The restaurant repository satisfies identity's RestaurantLookup port.
    getCurrentStaff: new GetCurrentStaff(new PrismaStaffRepository(prisma), restaurants),
    listRestaurants: new ListRestaurants(restaurants),
    getMetrics: new GetMetrics(restaurants, metricsRepository),
    getMetricsSeries: new GetMetricsSeries(restaurants, metricsRepository),
    getPeakHours: new GetPeakHours(restaurants, metricsRepository),
    listReviews: new ListReviews(restaurants, reviewReads),
    listWaitlistHistory: new ListWaitlistHistory(restaurants, historyReads),
    removeQueue: new RemoveQueue(restaurants),
    getReviewSummary: new GetReviewSummary(restaurants, reviewReads),
    restaurantConfig: new RestaurantConfig(restaurants),
    joinWaitlist: new JoinWaitlist(restaurants, waitlist, publisher),
    listQueueEntries: new ListQueueEntries(waitlist),
    getEntry: new GetEntry(waitlist),
    entryActions: new EntryActions(waitlist, publisher, notifier, {
      dinerSeated: (entry) => {
        void recordVisit
          .execute({
            sourceRef: `entry:${entry.id}`,
            userId: entry.userId,
            ownerRef: entry.restaurantId,
            occurredAt: entry.seatedAt ? new Date(entry.seatedAt) : new Date(),
          })
          .catch(() => undefined);
      },
    }),
    submitReview,
    expireNoShows: new ExpireNoShows(waitlist, publisher),
    pushSubscriptions,
    vapidPublicKey: env.VAPID_PUBLIC_KEY,
    membershipPrograms,
    memberships: membershipsRepo,
    membershipLedger,
    membershipRewards,
    membershipStats: new PrismaStatsRepository(prisma),
    manageProgram: new ManageProgram(membershipPrograms, new PrismaProgramWriteRepository(prisma)),
    enrollMember: new EnrollMember(membershipPrograms, membershipsRepo),
    redeemReward: new RedeemReward(
      membershipPrograms,
      membershipsRepo,
      membershipLedger,
      membershipRewards,
      membershipRedemptions,
    ),
    validateRedemption: new ValidateRedemption(membershipRedemptions),
    surveys,
    surveyResponses,
    manageSurvey: new ManageSurvey(surveys),
    // A completed feedback survey mirrors into ServiceReview through the
    // existing use case, so its guards on status and duplicates still apply.
    submitSurveyResponse: new SubmitResponse(surveys, surveyResponses, {
      recorded: (subjectRef, rating, comment) => {
        if (rating === null) return;
        void submitReview
          .execute({ entryId: subjectRef, rating, feedback: comment })
          .catch(() => undefined);
      },
    }),
  };
}

import { GetMetrics } from './contexts/restaurant/application/get-metrics';
import { ListRestaurants } from './contexts/restaurant/application/list-restaurants';
import { RestaurantConfig } from './contexts/restaurant/application/restaurant-config';
import type { RestaurantRepository } from './contexts/restaurant/domain/restaurant-repository';
import { PrismaMetricsRepository } from './contexts/restaurant/infrastructure/prisma-metrics-repository';
import { PrismaRestaurantRepository } from './contexts/restaurant/infrastructure/prisma-restaurant-repository';
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
  listRestaurants: ListRestaurants;
  getMetrics: GetMetrics;
  restaurantConfig: RestaurantConfig;
  joinWaitlist: JoinWaitlist;
  listQueueEntries: ListQueueEntries;
  getEntry: GetEntry;
  entryActions: EntryActions;
  submitReview: SubmitReview;
  expireNoShows: ExpireNoShows;
}

/** Composition root: wires repositories and use cases with the given publisher. */
export function buildContainer(publisher: WaitlistEventPublisher): Container {
  const restaurants = new PrismaRestaurantRepository(prisma);
  const waitlist = new PrismaWaitlistRepository(prisma);
  const reviews = new PrismaReviewRepository(prisma);
  return {
    restaurants,
    listRestaurants: new ListRestaurants(restaurants),
    getMetrics: new GetMetrics(restaurants, new PrismaMetricsRepository(prisma)),
    restaurantConfig: new RestaurantConfig(restaurants),
    joinWaitlist: new JoinWaitlist(restaurants, waitlist, publisher),
    listQueueEntries: new ListQueueEntries(waitlist),
    getEntry: new GetEntry(waitlist),
    entryActions: new EntryActions(waitlist, publisher),
    submitReview: new SubmitReview(waitlist, reviews),
    expireNoShows: new ExpireNoShows(waitlist, publisher),
  };
}

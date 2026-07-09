import { JoinWaitlist } from './contexts/waitlist/application/join-waitlist';
import { ListQueueEntries } from './contexts/waitlist/application/list-queue-entries';
import type { WaitlistEventPublisher } from './contexts/waitlist/application/ports';
import type { RestaurantRepository } from './contexts/restaurant/domain/restaurant-repository';
import { PrismaRestaurantRepository } from './contexts/restaurant/infrastructure/prisma-restaurant-repository';
import { PrismaWaitlistRepository } from './contexts/waitlist/infrastructure/prisma-waitlist-repository';
import { prisma } from './db/prisma';

export interface Container {
  restaurants: RestaurantRepository;
  joinWaitlist: JoinWaitlist;
  listQueueEntries: ListQueueEntries;
}

/** Composition root: wires repositories and use cases with the given publisher. */
export function buildContainer(publisher: WaitlistEventPublisher): Container {
  const restaurants = new PrismaRestaurantRepository(prisma);
  const waitlist = new PrismaWaitlistRepository(prisma);
  return {
    restaurants,
    joinWaitlist: new JoinWaitlist(restaurants, waitlist, publisher),
    listQueueEntries: new ListQueueEntries(waitlist),
  };
}

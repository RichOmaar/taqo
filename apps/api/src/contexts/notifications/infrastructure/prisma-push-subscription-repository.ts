import type { PrismaClient } from '@prisma/client';

import type {
  NewPushSubscription,
  PushSubscriptionRepository,
  StoredPushSubscription,
} from '../domain/push-subscription-repository';

export class PrismaPushSubscriptionRepository implements PushSubscriptionRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(subscription: NewPushSubscription): Promise<void> {
    await this.prisma.pushSubscription.upsert({
      where: { endpoint: subscription.endpoint },
      update: {
        entryId: subscription.entryId,
        p256dh: subscription.p256dh,
        auth: subscription.auth,
      },
      create: subscription,
    });
  }

  async findByEntry(entryId: string): Promise<StoredPushSubscription[]> {
    const rows = await this.prisma.pushSubscription.findMany({ where: { entryId } });
    return rows.map((r) => ({ endpoint: r.endpoint, p256dh: r.p256dh, auth: r.auth }));
  }
}

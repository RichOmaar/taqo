import type { WaitlistEntry } from '@nexa/types';
import webpush from 'web-push';

import type { DinerNotifier } from '../../waitlist/application/ports';
import type { PushSubscriptionRepository } from '../domain/push-subscription-repository';

export interface VapidConfig {
  publicKey?: string;
  privateKey?: string;
  subject: string;
}

/** Sends web push notifications to a diner's registered browser subscriptions. */
export class WebPushNotifier implements DinerNotifier {
  private readonly enabled: boolean;

  constructor(
    private readonly subscriptions: PushSubscriptionRepository,
    config: VapidConfig,
  ) {
    if (config.publicKey && config.privateKey) {
      webpush.setVapidDetails(config.subject, config.publicKey, config.privateKey);
      this.enabled = true;
    } else {
      this.enabled = false;
    }
  }

  tableReady(entry: WaitlistEntry): void {
    if (!this.enabled) return;
    void this.send(entry);
  }

  private async send(entry: WaitlistEntry): Promise<void> {
    const subs = await this.subscriptions.findByEntry(entry.id);
    const payload = JSON.stringify({
      title: '¡Tu mesa está lista!',
      body: 'Acércate a la recepción.',
    });
    await Promise.all(
      subs.map((s) =>
        webpush
          .sendNotification(
            { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
            payload,
          )
          .catch(() => undefined),
      ),
    );
  }
}

export interface StoredPushSubscription {
  endpoint: string;
  p256dh: string;
  auth: string;
}

export interface NewPushSubscription extends StoredPushSubscription {
  entryId: string;
}

export interface PushSubscriptionRepository {
  save(subscription: NewPushSubscription): Promise<void>;
  findByEntry(entryId: string): Promise<StoredPushSubscription[]>;
}

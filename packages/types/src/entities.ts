import type { ISODateString, JsonObject, UUID } from './common';
import type {
  NotificationChannel,
  NotificationEventType,
  NotificationStatus,
  RestaurantPlan,
  StaffRole,
  WaitlistStatus,
} from './enums';

export interface Restaurant {
  id: UUID;
  name: string;
  /** Short code diners use to join the queue. */
  code: string;
  /** Token embedded in the restaurant QR. */
  qrToken: string;
  /** Synthetic base ETA per position, in minutes. */
  etaBaseMinutes: number;
  /** Minutes after being notified before an entry can be marked no-show. */
  expirationMinutes: number;
  plan: RestaurantPlan;
  createdAt: ISODateString;
}

export interface Queue {
  id: UUID;
  restaurantId: UUID;
  name: string;
  /** Ordering among the restaurant's queues (lower = higher priority). */
  priority: number;
  isActive: boolean;
}

export interface WaitlistEntry {
  id: UUID;
  queueId: UUID;
  restaurantId: UUID;
  /** Present when the diner is a registered user; null for guests. */
  userId: UUID | null;
  /** Real name or assigned gamertag-style nickname. */
  displayName: string;
  partySize: number;
  phone: string | null;
  status: WaitlistStatus;
  /** 1-based position within the queue. */
  position: number;
  etaMinutes: number | null;
  /** True when the hostess pinned the ETA manually. */
  etaIsManual: boolean;
  /** Answers to the restaurant's configurable form (defined in Strapi). */
  formData: JsonObject;
  joinedAt: ISODateString;
  notifiedAt: ISODateString | null;
  seatedAt: ISODateString | null;
}

export interface User {
  id: UUID;
  email: string;
  name: string | null;
  createdAt: ISODateString;
}

export interface StaffUser {
  id: UUID;
  restaurantId: UUID;
  email: string;
  role: StaffRole;
}

export interface Notification {
  id: UUID;
  entryId: UUID;
  channel: NotificationChannel;
  eventType: NotificationEventType;
  status: NotificationStatus;
  sentAt: ISODateString;
}

export interface ServiceReview {
  id: UUID;
  entryId: UUID;
  restaurantId: UUID;
  /** 1-5 rating. */
  rating: number;
  feedback: string | null;
  createdAt: ISODateString;
}

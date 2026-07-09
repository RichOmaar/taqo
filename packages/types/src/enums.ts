// Domain enums. Each is declared as a readonly array (usable at runtime for
// validation) plus a derived union type.

export const RESTAURANT_PLANS = ['free', 'paid'] as const;
export type RestaurantPlan = (typeof RESTAURANT_PLANS)[number];

export const WAITLIST_STATUSES = ['waiting', 'notified', 'seated', 'no_show', 'cancelled'] as const;
export type WaitlistStatus = (typeof WAITLIST_STATUSES)[number];

export const STAFF_ROLES = ['admin', 'hostess'] as const;
export type StaffRole = (typeof STAFF_ROLES)[number];

export const NOTIFICATION_CHANNELS = ['web_push', 'sms', 'whatsapp'] as const;
export type NotificationChannel = (typeof NOTIFICATION_CHANNELS)[number];

export const NOTIFICATION_EVENT_TYPES = ['registered', 'turn_near', 'table_ready'] as const;
export type NotificationEventType = (typeof NOTIFICATION_EVENT_TYPES)[number];

export const NOTIFICATION_STATUSES = ['sent', 'failed'] as const;
export type NotificationStatus = (typeof NOTIFICATION_STATUSES)[number];

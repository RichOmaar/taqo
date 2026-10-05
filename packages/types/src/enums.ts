// Domain enums. Each is declared as a readonly array (usable at runtime for
// validation) plus a derived union type.

export const RESTAURANT_PLANS = ['free', 'paid'] as const;
export type RestaurantPlan = (typeof RESTAURANT_PLANS)[number];

export const WAITLIST_STATUSES = ['waiting', 'notified', 'seated', 'no_show', 'cancelled'] as const;
export type WaitlistStatus = (typeof WAITLIST_STATUSES)[number];

export const STAFF_ROLES = ['admin', 'hostess'] as const;
export type StaffRole = (typeof STAFF_ROLES)[number];

// Memberships — a loyalty program's configuration and its ledger.

/** What a visit earns. */
export const ACCRUAL_MODES = ['visits', 'points', 'both'] as const;
export type AccrualMode = (typeof ACCRUAL_MODES)[number];

export const PROGRAM_STATUSES = ['draft', 'active', 'paused'] as const;
export type ProgramStatus = (typeof PROGRAM_STATUSES)[number];

/** Which accumulated quantity decides a member's tier. */
export const TIER_METRICS = ['visits', 'points'] as const;
export type TierMetric = (typeof TIER_METRICS)[number];

/** Whether tier progress counts forever or only within a moving window. */
export const TIER_PERIODS = ['lifetime', 'rolling'] as const;
export type TierPeriod = (typeof TIER_PERIODS)[number];

/** What happens when a member's progress falls below their tier. */
export const DOWNGRADE_POLICIES = ['never', 'on_period_exit'] as const;
export type DowngradePolicy = (typeof DOWNGRADE_POLICIES)[number];

/**
 * Why a ledger entry exists. Entries are immutable: a correction is an
 * `adjustment`, never an edit, so the history stays auditable.
 */
export const LEDGER_KINDS = ['accrual', 'redemption', 'expiry', 'adjustment'] as const;
export type LedgerKind = (typeof LEDGER_KINDS)[number];

export const REDEMPTION_STATUSES = ['issued', 'redeemed', 'expired', 'cancelled'] as const;
export type RedemptionStatus = (typeof REDEMPTION_STATUSES)[number];

export const MEMBERSHIP_STATUSES = ['active', 'cancelled'] as const;
export type MembershipStatus = (typeof MEMBERSHIP_STATUSES)[number];

export const NOTIFICATION_CHANNELS = ['web_push', 'sms', 'whatsapp'] as const;
export type NotificationChannel = (typeof NOTIFICATION_CHANNELS)[number];

export const NOTIFICATION_EVENT_TYPES = ['registered', 'turn_near', 'table_ready'] as const;
export type NotificationEventType = (typeof NOTIFICATION_EVENT_TYPES)[number];

export const NOTIFICATION_STATUSES = ['sent', 'failed'] as const;
export type NotificationStatus = (typeof NOTIFICATION_STATUSES)[number];

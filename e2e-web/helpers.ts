import pg from 'pg';

const TEST_URL = 'postgresql://nexa:nexa@localhost:5433/nexa_e2e';

/** Reset the operational tables so each test starts from an empty queue. */
export async function truncateEntries(): Promise<void> {
  const client = new pg.Client({ connectionString: TEST_URL });
  await client.connect();
  await client.query(
    'TRUNCATE waitlist_entries, service_reviews, notifications, push_subscriptions RESTART IDENTITY CASCADE',
  );
  await client.end();
}

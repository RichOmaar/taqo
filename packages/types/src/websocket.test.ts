import { describe, expect, it } from 'vitest';

import { WS_EVENTS, entryRoom, queueRoom } from './websocket';

describe('websocket room helpers', () => {
  it('builds a stable queue room key', () => {
    expect(queueRoom('r1', 'q1')).toBe('restaurant:r1:queue:q1');
  });

  it('builds a stable entry room key', () => {
    expect(entryRoom('e1')).toBe('entry:e1');
  });

  it('exposes the server event names', () => {
    expect(WS_EVENTS.ENTRY_ADDED).toBe('entry_added');
    expect(WS_EVENTS.ENTRY_UPDATED).toBe('entry_updated');
    expect(WS_EVENTS.ENTRY_REMOVED).toBe('entry_removed');
  });
});

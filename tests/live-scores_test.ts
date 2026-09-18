import assert from 'node:assert/strict';
// @ts-expect-error Node's strip-types test runner requires the explicit .ts extension.
import { syncLiveResults } from '../lib/results.ts';

const games = [{ id: 'test', away: 'BUF', home: 'WAS' }];
let writes = 0;
const db = {
  prepare: () => ({
    bind: (...args: unknown[]) => {
      writes++;
      return args;
    },
  }),
  batch: async () => {},
};
const payload = (
  state: string,
  completed = false,
  name = 'STATUS_IN_PROGRESS',
) => ({
  events: [
    {
      competitions: [
        {
          status: {
            type: { state, completed, name },
            period: 2,
            displayClock: '8:42',
          },
          competitors: [
            {
              homeAway: 'away',
              score: '14',
              team: { abbreviation: 'BUF' },
              winner: completed,
            },
            { homeAway: 'home', score: '7', team: { abbreviation: 'WSH' } },
          ],
        },
      ],
    },
  ],
});
let response = payload('in');
globalThis.fetch = async () =>
  ({ ok: true, json: async () => response }) as Response;
// Test doubles exercise the feed parser without a database or external network.
const sync = () => syncLiveResults(2, games as never, db as never);
let result = await sync();
assert.equal(result.updated, false);
assert.equal(writes, 0, 'Live scores must not award points or finalize games');
assert.equal(result.scores.test.away, 14);
assert.equal(result.scores.test.home, 7);
assert.equal(result.scores.test.detail, 'Q2 · 8:42');
response = payload('in', false, 'STATUS_HALFTIME');
assert.equal((await sync()).scores.test.detail, 'Halftime');
response = payload('post', true);
result = await sync();
assert.equal(result.updated, true);
assert.equal(result.scores.test.state, 'final');
assert.equal(writes, 1);
response = payload('pre');
assert.deepEqual(
  (await sync()).scores,
  {},
  'Upcoming games must not show live scores',
);
globalThis.fetch = async () => ({ ok: false }) as Response;
assert.deepEqual(
  (await sync()).scores,
  {},
  'Unavailable feed must not invent scores',
);
console.log('Live score parsing checks passed');

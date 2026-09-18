import assert from 'node:assert/strict';
// @ts-expect-error Node's strip-types runner requires the .ts extension.
import { matchupNews } from '../lib/news.ts';
const now = Date.parse('2026-09-18T00:00:00Z');
const games = [
  { id: 'a', away: 'BUF', home: 'WAS', status: 'scheduled' },
  { id: 'b', away: 'BUF', home: 'WAS', status: 'final' },
];
const article = (
  id: number,
  headline: string,
  team = 'BUF',
  published = '2026-09-17T23:00:00Z',
) => ({
  id,
  headline,
  published,
  categories: [{ type: 'team', team: { abbreviation: team } }],
  links: { web: { href: `https://www.espn.com/nfl/story/_/id/${id}` } },
});
const articles = [
  article(1, 'QB ruled out'),
  article(2, 'Player questionable', 'WSH'),
  article(3, 'Quarterback named starter'),
  article(4, 'Team signs defender'),
  article(5, 'Star injured', 'KC'),
  article(6, 'Power rankings'),
  article(7, 'QB injured', 'BUF', '2026-08-01T00:00:00Z'),
  article(8, 'QB injured', 'BUF', '2026-09-19T00:00:00Z'),
];
const result = matchupNews(articles, games as never, now);
assert.equal(result.a.length, 3);
assert.equal(result.a[0].topic, 'Injury / availability');
assert.equal(result.a[1].id, '2', 'Normalize ESPN WSH to WAS');
assert.equal(result.a[2].topic, 'Quarterback');
assert.equal(result.b, undefined, 'Hide news on finished games');
assert.equal(
  matchupNews([article(5, 'Star injured', 'KC')], games as never, now).a,
  undefined,
);
const unsafe = article(9, 'Star injured');
unsafe.links.web.href = 'javascript:alert(1)';
assert.deepEqual(matchupNews([unsafe], games as never, now), {});
assert.equal(
  matchupNews([articles[0], articles[0]], games as never, now).a.length,
  1,
);
console.log('Matchup news filtering checks passed');

// Exercise the request itself so the endpoint and identification header regressions are caught.
// @ts-expect-error Node's strip-types runner requires the .ts extension.
const { getPickNews } = await import('../lib/news.ts');
let requests = 0;
globalThis.fetch = async (url, options) => {
  requests++;
  assert.equal(
    String(url),
    'https://site.web.api.espn.com/apis/site/v2/sports/football/nfl/news?limit=50',
  );
  assert.equal(
    new Headers(options?.headers).get('user-agent'),
    'SundayClub/1.0',
  );
  return Response.json({
    articles: [article(99, 'Star injured', 'BUF', new Date(Date.now() - 1000).toISOString())],
  });
};
const feed = await getPickNews(games as never);
assert.equal(feed.unavailable, false);
assert.equal(feed.games.a[0].id, '99');
await getPickNews(games as never);
assert.equal(requests, 1, 'Reuse successful news cache');
console.log('News feed request checks passed');

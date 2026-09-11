'use client';
/* eslint-disable next/no-html-link-for-pages -- Sites sign-in and sign-out require full top-level navigation. */
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowUpRight,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleUserRound,
  Copy,
  LockKeyhole,
  Moon,
  Sun,
  Trophy,
  Users,
  Zap,
  ShieldCheck,
  RefreshCw,
  Eye,
  EyeOff,
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogAction,
  AlertDialogFooter,
} from '@/components/ui/alert-dialog';
import { fallbackGames, team, type Game } from '@/lib/games';
type League = { id: string; name: string; owner: string; code: string };
type Member = { id: string; name: string };
type Standing = Member & { weekly: number; monthly: number; season: number };
type MemberCompletion = Member & { picked: number };
type State = {
  profile: Member;
  leagues: League[];
  league: string | null;
  games: Game[];
  picks: Record<string, string>;
  pickCounts: Record<string, Record<string, number>>;
  picksPublished: boolean;
  canPublishPicks: boolean;
  publishedPicks: Record<string, Record<string, string>>;
  startedGames: string[];
  revealedGames: string[];
  allPicksComplete: boolean;
  memberCompletion: MemberCompletion[];
  totalGames: number;
  marketOdds: Record<
    string,
    { away: number; home: number; source: string; updatedAt: number }
  >;
  members: Member[];
  standings: Standing[];
  scheduleOfficial: boolean;
  serverNow: number;
};
const nav = [
  ['picks', 'Picks', Zap],
  ['standings', 'Standings', Trophy],
  ['league-picks', 'League Picks', Eye],
  ['leagues', 'Leagues', Users],
  ['account', 'Account', CircleUserRound],
] as const;
export default function PickApp() {
  const [view, setView] = useState('picks');
  const [week, setWeek] = useState(1);
  const [leagueId, setLeagueId] = useState('');
  const [data, setData] = useState<State | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [signedOut, setSignedOut] = useState(false);
  const [period, setPeriod] = useState('weekly');
  const [now, setNow] = useState(0);
  const [remove, setRemove] = useState<Member | null>(null);
  const [installed, setInstalled] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const offset = useRef(0);
  const requestId = useRef(0);
  const load = useCallback(async () => {
    const id = ++requestId.current;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/club?week=${week}&league=${encodeURIComponent(leagueId)}`,
        { cache: 'no-store' },
      );
      const body = (await res.json()) as State & { error: string };
      if (id !== requestId.current) return;
      if (!res.ok) {
        if (res.status === 401) {
          setSignedOut(true);
          setData(null);
          return;
        }
        throw new Error(body.error);
      }
      setSignedOut(false);
      setData(body);
      offset.current = body.serverNow - Date.now();
      setNow(body.serverNow);
    } catch (e) {
      if (id === requestId.current)
        setError(
          e instanceof Error ? e.message : 'Unable to load your league.',
        );
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, [week, leagueId]);
  useEffect(() => {
    // eslint-disable-next-line react/react-compiler -- Synchronize the selected league and week with the remote API.
    void load();
  }, [load]);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now() + offset.current), 1000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    if (!data) return;
    const nextKickoff = data.games
      .filter(
        (game) =>
          !data.startedGames.includes(game.id) && game.kickoff > data.serverNow,
      )
      .sort((a, b) => a.kickoff - b.kickoff)[0]?.kickoff;
    if (!nextKickoff) return;
    const delay = Math.min(
      Math.max(nextKickoff - (Date.now() + offset.current) + 500, 500),
      2_147_483_647,
    );
    const timer = setTimeout(() => void load(), delay);
    return () => clearTimeout(timer);
  }, [data, load]);
  useEffect(() => {
    if (
      !data?.games.some(
        (game) =>
          game.kickoff <= data.serverNow &&
          !['final', 'cancelled'].includes(game.status),
      )
    )
      return;
    const timer = setTimeout(() => void load(), 60_000);
    return () => clearTimeout(timer);
  }, [data, load]);
  useEffect(() => {
    const initial =
      document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
    setTheme(initial);
  }, []);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', theme === 'dark' ? '#0f1b1c' : '#123e35');
  }, [theme]);
  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('sunday-club-theme', next);
    setTheme(next);
  };
  useEffect(() => {
    if ('serviceWorker' in navigator)
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    // eslint-disable-next-line react/react-compiler -- Read the browser display mode after hydration.
    setInstalled(window.matchMedia('(display-mode: standalone)').matches);
    const refresh = () => load();
    window.addEventListener('online', refresh);
    return () => window.removeEventListener('online', refresh);
  }, [load]);
  async function mutate(body: Record<string, unknown>, message: string) {
    if (busy) return false;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const res = await fetch('/api/club', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ league: data?.league, ...body }),
      });
      const answer = (await res.json()) as { error: string; league?: string };
      if (!res.ok) throw new Error(answer.error);
      if (answer.league && answer.league !== leagueId)
        setLeagueId(answer.league);
      else await load();
      setNotice(message);
      return true;
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'Unable to save. Please retry.',
      );
      return false;
    } finally {
      setBusy(false);
    }
  }
  const league = data?.leagues.find((l) => l.id === data.league);
  const owner = !!league && league.owner === data?.profile.id;
  const games = data?.games ?? fallbackGames.filter((g) => g.week === week);
  const picks = data?.picks ?? {};
  const count = games.filter((g) => picks[g.id]).length;
  const hasRevealedPicks = Boolean(data?.revealedGames.length);
  const pickPercentage = (game: Game, teamId: string) => {
    const counts = data?.pickCounts[game.id] ?? {};
    const total = Object.values(counts).reduce((sum, votes) => sum + votes, 0);
    if (!total) return 50;
    const awayPercentage = Math.round(((counts[game.away] ?? 0) / total) * 100);
    return teamId === game.away ? awayPercentage : 100 - awayPercentage;
  };
  const marketPercentage = (game: Game, teamId: string) => {
    const odds = data?.marketOdds?.[game.id];
    if (!odds) return null;
    return teamId === game.away ? odds.away : odds.home;
  };
  const locked = (g: Game) => g.kickoff <= now || g.status !== 'scheduled';
  const date = (g: Game) =>
    now
      ? new Date(g.kickoff).toLocaleString(undefined, {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          timeZoneName: 'short',
        })
      : 'Loading kickoff…';
  const leaderboard = [...(data?.standings ?? [])].sort(
    (a, b) =>
      (period === 'weekly'
        ? b.weekly - a.weekly
        : period === 'monthly'
          ? b.monthly - a.monthly
          : b.season - a.season) || a.name.localeCompare(b.name),
  );
  const month = Math.ceil(week / 4);
  function smallForm(
    action: string,
    label: string,
    placeholder: string,
    key = 'name',
    initial = '',
  ) {
    return (
      <form
        className="inline-form"
        onSubmit={async (e) => {
          e.preventDefault();
          const f = e.currentTarget;
          const value = new FormData(f).get(key);
          if (
            await mutate(
              { action, [key]: value },
              action === 'join'
                ? 'You’re in. Time to make your picks.'
                : 'Saved.',
            )
          )
            f.reset();
        }}
      >
        <label>
          {label}
          <input
            name={key}
            placeholder={placeholder}
            defaultValue={initial}
            required
            maxLength={key === 'code' ? 20 : 50}
          />
        </label>
        <button className="primary" disabled={busy || signedOut}>
          {action === 'create'
            ? 'Create league'
            : action === 'join'
              ? 'Join league'
              : 'Save changes'}
          <ArrowUpRight size={16} />
        </button>
      </form>
    );
  }
  return (
    <div className="shell">
      <header className="header">
        <a className="brand" href="/">
          <span className="brand-icon">
            <Zap size={23} fill="currentColor" />
          </span>
          SUNDAY<span className="light">CLUB</span>
        </a>
        <div className="header-right">
          <span className="season">2026 SEASON</span>
          <button
            className="icon-button theme-toggle"
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            onClick={toggleTheme}
          >
            {theme === 'dark' ? <Sun size={21} /> : <Moon size={21} />}
          </button>
          <button
            className="icon-button"
            aria-label="Open account"
            onClick={() => setView('account')}
          >
            <CircleUserRound />
          </button>
        </div>
      </header>
      <main>
        <div className="league-line">
          <button
            className="league-link eyebrow"
            onClick={() => setView('leagues')}
          >
            {league ? league.name : 'YOUR SUNDAY TRADITION'}
            {league && <ChevronRight size={14} />}
          </button>
          <span className="pill">
            {data?.scheduleOfficial === false
              ? 'SCHEDULE OFFLINE'
              : `OFFICIAL WEEK ${week}`}
          </span>
        </div>
        <div className="heading">
          <div>
            <h1>
              {view === 'picks'
                ? 'Make your picks.'
                : view === 'standings'
                  ? 'The bragging board.'
                  : view === 'league-picks'
                    ? 'See every call.'
                    : view === 'leagues'
                      ? 'Find your crew.'
                      : 'Your corner.'}
            </h1>
            <p>
              {view === 'picks'
                ? 'A little football. A lot of bragging rights.'
                : view === 'standings'
                  ? 'One correct winner. One step up the table.'
                  : view === 'league-picks'
                    ? 'Picks unlock game by game at kickoff.'
                    : view === 'leagues'
                      ? 'Private leagues. Friendly rivalries.'
                      : 'Make yourself at home.'}
            </p>
          </div>
          <button
            className="outline"
            onClick={() => setView(view === 'leagues' ? 'picks' : 'leagues')}
          >
            {view === 'leagues' ? 'Back to picks' : 'Your leagues'}
            <ArrowUpRight size={17} />
          </button>
        </div>
        {error && (
          <div role="alert" className="message error">
            {error}
            <button
              onClick={() => {
                setError('');
                void load();
              }}
            >
              Retry <RefreshCw size={14} />
            </button>
          </div>
        )}
        {notice && (
          <output className="message success">
            {' '}
            <Check size={17} />
            {notice}
            <button
              aria-label="Dismiss notification"
              onClick={() => setNotice('')}
            >
              ×
            </button>
          </output>
        )}
        {signedOut && (
          <div className="message">
            <span>Sign in to create a league and save your picks.</span>
            <a
              className="primary"
              href="/signin-with-chatgpt?return_to=%2F"
              target="_top"
            >
              Sign in with ChatGPT
            </a>
          </div>
        )}
        {view === 'picks' || view === 'standings' || view === 'league-picks' ? (
          <div className="layout">
            <section aria-busy={loading}>
              <div className="weekbar">
                <button
                  aria-label="Previous week"
                  disabled={week === 1 || busy}
                  onClick={() => setWeek((w) => w - 1)}
                >
                  <ChevronLeft />
                </button>
                <div>
                  <b>Week {week}</b>
                  <span>REGULAR SEASON · 2026</span>
                </div>
                <button
                  aria-label="Next week"
                  disabled={week === 18 || busy}
                  onClick={() => setWeek((w) => w + 1)}
                >
                  <ChevronRight />
                </button>
              </div>
              {view === 'picks' ? (
                <>
                  <div className="pick-progress">
                    <div>
                      <b>Your weekly picks</b>
                      <span>
                        {loading
                          ? 'Loading…'
                          : `${count} / ${games.length} picked`}
                      </span>
                    </div>
                    <Progress
                      aria-label="Weekly picks completed"
                      value={games.length ? (count / games.length) * 100 : 0}
                    />
                    <div className="progress-note">
                      {league
                        ? count === games.length
                          ? 'All set. You can change picks until kickoff.'
                          : 'Picks save automatically and lock at kickoff.'
                        : 'Create or join a league to start picking.'}
                    </div>
                  </div>
                  <div className="section-label">
                    <h2>Game day</h2>
                    <span>
                      {busy ? 'Saving…' : 'Tap a team to pick a winner'}
                    </span>
                  </div>
                  <div className="games">
                    {games.map((g) => (
                      <article className="game" key={g.id}>
                        <div className="game-meta">
                          <span>{date(g)}</span>
                          <span>
                            {locked(g) ? (
                              <>
                                <LockKeyhole size={12} />
                                {g.status === 'final'
                                  ? 'Final'
                                  : g.status === 'cancelled'
                                    ? 'Cancelled'
                                    : 'Locked'}
                              </>
                            ) : (
                              <>● Upcoming</>
                            )}
                          </span>
                        </div>
                        <div className="matchup">
                          {[g.away, g.home].map((id, i) => (
                            <button
                              key={id}
                              aria-label={
                                picks[g.id] === id
                                  ? `Remove ${team(id)[2]} pick`
                                  : `Pick ${team(id)[2]} over ${team(i === 0 ? g.home : g.away)[2]}`
                              }
                              aria-pressed={picks[g.id] === id}
                              className={`team ${picks[g.id] === id ? 'chosen' : ''}`}
                              disabled={locked(g) || busy || loading || !league}
                              onClick={() => {
                                const removing = picks[g.id] === id;
                                void mutate(
                                  removing
                                    ? { action: 'unpick', game: g.id }
                                    : {
                                        action: 'pick',
                                        game: g.id,
                                        team: id,
                                      },
                                  removing
                                    ? 'Pick removed.'
                                    : `${team(id)[2]} pick saved.`,
                                );
                              }}
                            >
                              <span className="team-badge" aria-hidden="true">
                                <img
                                  className="team-logo"
                                  src={`/team-logos/${id}.png`}
                                  alt=""
                                  width="46"
                                  height="46"
                                />
                              </span>
                              <span className="team-name">
                                <small>{team(id)[1]}</small>
                                <strong>{team(id)[2]}</strong>
                                <span className="team-percentages">
                                  <span className="market-chance">
                                    <b>
                                      {marketPercentage(g, id) ?? '—'}
                                      {marketPercentage(g, id) === null
                                        ? ''
                                        : '%'}
                                    </b>{' '}
                                    market
                                  </span>
                                  <span className="pick-popularity">
                                    <b>{pickPercentage(g, id)}%</b> league picks
                                  </span>
                                </span>
                              </span>
                              <span className="pick-circle">
                                {picks[g.id] === id && <Check size={14} />}
                              </span>
                              {i === 0 && <span className="versus">VS</span>}
                            </button>
                          ))}
                        </div>
                        {data?.marketOdds?.[g.id] && (
                          <div className="odds-source">
                            Implied win chance from{' '}
                            {data.marketOdds[g.id].source} moneyline, margin
                            removed · updated{' '}
                            {new Date(
                              data.marketOdds[g.id].updatedAt,
                            ).toLocaleTimeString(undefined, {
                              hour: 'numeric',
                              minute: '2-digit',
                            })}
                          </div>
                        )}
                        {g.status === 'final' && (
                          <div className="result-line">
                            {g.winner
                              ? `${team(g.winner)[2]} win`
                              : 'Tie — no points'}
                            <span>
                              {picks[g.id]
                                ? picks[g.id] === g.winner
                                  ? '+1 point'
                                  : '0 points'
                                : 'No pick'}
                            </span>
                          </div>
                        )}
                      </article>
                    ))}
                  </div>
                </>
              ) : (
                <div className="standings-grid">
                  {view === 'standings' && (
                    <div className="panel standings">
                      <Tabs
                        value={period}
                        onValueChange={(v) => setPeriod(String(v))}
                      >
                        <TabsList className="period-tabs">
                          <TabsTrigger value="weekly">Week {week}</TabsTrigger>
                          <TabsTrigger value="monthly">
                            Month {month}
                          </TabsTrigger>
                          <TabsTrigger value="season">Full season</TabsTrigger>
                        </TabsList>
                      </Tabs>
                      {leaderboard.length ? (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Rank</TableHead>
                              <TableHead>Player</TableHead>
                              <TableHead className="text-right">
                                Points
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {leaderboard.map((p) => {
                              const score =
                                period === 'weekly'
                                  ? p.weekly
                                  : period === 'monthly'
                                    ? p.monthly
                                    : p.season;
                              const rank =
                                leaderboard.findIndex(
                                  (x) =>
                                    (period === 'weekly'
                                      ? x.weekly
                                      : period === 'monthly'
                                        ? x.monthly
                                        : x.season) === score,
                                ) + 1;
                              return (
                                <TableRow key={p.id}>
                                  <TableCell>
                                    <span
                                      className={
                                        rank === 1 ? 'rank first' : 'rank'
                                      }
                                    >
                                      {rank === 1 ? <Trophy size={17} /> : rank}
                                    </span>
                                  </TableCell>
                                  <TableCell>
                                    <strong>{p.name}</strong>
                                    {p.id === data?.profile.id && (
                                      <span className="you-tag">YOU</span>
                                    )}
                                  </TableCell>
                                  <TableCell className="text-right score">
                                    {score}
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      ) : (
                        <div className="empty-panel">
                          <Trophy size={32} />
                          <h2>Your rivalry starts here.</h2>
                          <p>Create or join a league to see the standings.</p>
                          <button
                            className="primary"
                            onClick={() => setView('leagues')}
                          >
                            Find your league
                          </button>
                        </div>
                      )}
                      <p className="footnote">
                        1 point per correct winner. Ties and cancelled games
                        earn 0. Equal scores share a rank.
                      </p>
                    </div>
                  )}
                  {view === 'league-picks' && (
                    <div className="panel published-picks">
                      <div className="published-heading">
                        <div>
                          <span className="eyebrow">WEEK {week}</span>
                          <h2>League picks</h2>
                        </div>
                        {hasRevealedPicks ? (
                          <Eye size={21} />
                        ) : (
                          <EyeOff size={21} />
                        )}
                      </div>
                      {data && !data.allPicksComplete && (
                        <div className="completion-list">
                          <div className="completion-title">
                            <strong>Member progress</strong>
                            <span>Week {week} · visible to league</span>
                          </div>
                          {data?.memberCompletion.map((member) => {
                            const percentage = data.totalGames
                              ? Math.round(
                                  (member.picked / data.totalGames) * 100,
                                )
                              : 0;
                            return (
                              <div
                                className="completion-member"
                                key={member.id}
                              >
                                <div>
                                  <span>{member.name}</span>
                                  <b>
                                    {member.picked}/{data.totalGames} ·{' '}
                                    {percentage}%
                                  </b>
                                </div>
                                <Progress
                                  aria-label={`${member.name} pick completion`}
                                  value={percentage}
                                />
                              </div>
                            );
                          })}
                        </div>
                      )}
                      {owner && !data?.allPicksComplete && (
                        <div className="publication-actions">
                          <button
                            className="primary"
                            disabled={busy || !data?.canPublishPicks}
                            onClick={() =>
                              mutate(
                                { action: 'publish-picks', week },
                                data?.picksPublished
                                  ? `Published Week ${week} picks are updated.`
                                  : `Current Week ${week} picks are now public to the league.`,
                              )
                            }
                          >
                            <Eye size={17} />
                            {data?.picksPublished
                              ? 'Update published picks'
                              : 'Publish complete matchups'}
                          </button>
                          {data?.picksPublished && (
                            <button
                              className="outline"
                              disabled={busy}
                              onClick={() =>
                                mutate(
                                  { action: 'unpublish-picks', week },
                                  `Future Week ${week} picks are private again. Started games stay visible.`,
                                )
                              }
                            >
                              <EyeOff size={16} />
                              Unpublish picks
                            </button>
                          )}
                          <small>
                            A matchup is published only after every league
                            member has submitted a pick for it. Incomplete
                            matchups stay private until you update the
                            publication or the game starts.
                          </small>
                        </div>
                      )}
                      {data && hasRevealedPicks ? (
                        <>
                          <div className="picks-table-scroll">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Matchup</TableHead>
                                  {data.members.map((member) => (
                                    <TableHead key={member.id}>
                                      {member.name}
                                    </TableHead>
                                  ))}
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {games.map((game) => (
                                  <TableRow key={game.id}>
                                    <TableCell className="matchup-cell">
                                      {game.away} @ {game.home}
                                    </TableCell>
                                    {data.revealedGames.includes(game.id) ? (
                                      data.members.map((member) => {
                                        const selected =
                                          data.publishedPicks[member.id]?.[
                                            game.id
                                          ];
                                        const selectedPercentage = selected
                                          ? pickPercentage(game, selected)
                                          : null;
                                        const isWildPick =
                                          selectedPercentage !== null &&
                                          selectedPercentage <= 20;
                                        return (
                                          <TableCell key={member.id}>
                                            <span
                                              className={
                                                selected
                                                  ? `published-team${isWildPick ? ' wild-pick' : ''}`
                                                  : 'missing-pick'
                                              }
                                              title={
                                                isWildPick
                                                  ? 'Wild pick · selected by 20% or less of the league'
                                                  : undefined
                                              }
                                            >
                                              {selected ??
                                                (data.startedGames.includes(
                                                  game.id,
                                                )
                                                  ? 'No pick'
                                                  : 'Not published')}
                                              {isWildPick && (
                                                <small>WILD PICK</small>
                                              )}
                                            </span>
                                          </TableCell>
                                        );
                                      })
                                    ) : (
                                      <TableCell
                                        className="private-game"
                                        colSpan={Math.max(
                                          data.members.length,
                                          1,
                                        )}
                                      >
                                        Private until kickoff
                                      </TableCell>
                                    )}
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                          <p className="wild-pick-note">
                            WILD marks a team selected by 20% or less of the
                            league for that matchup.
                          </p>
                        </>
                      ) : (
                        <div className="private-picks-state">
                          <EyeOff size={30} />
                          <h3>Picks are private.</h3>
                          <p>
                            Each game’s picks appear automatically at kickoff.
                            The commissioner can publish a matchup early after
                            every league member has selected a winner for it.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </section>
            <aside>
              <div className="club-card">
                <div className="eyebrow">
                  {league ? 'YOUR PRIVATE LEAGUE' : 'BETTER WITH YOUR PEOPLE'}
                </div>
                <Users size={30} />
                <h2>
                  {league ? (
                    league.name
                  ) : (
                    <>
                      Your crew.
                      <br />
                      Your competition.
                    </>
                  )}
                </h2>
                <p>
                  {league
                    ? `${data?.members.length} ${data?.members.length === 1 ? 'player' : 'players'}. One season of bragging rights.`
                    : 'Create a private league and make every game personal.'}
                </p>
                <button className="primary" onClick={() => setView('leagues')}>
                  {league ? 'Manage league' : 'Create a league'}
                  <ArrowUpRight size={17} />
                </button>
              </div>
              <div className="rules">
                <Trophy size={21} />
                <h3>Keep it simple.</h3>
                <p>One correct winner. One point.</p>
                <p>Picks lock at kickoff. Tied scores share the glory.</p>
              </div>
              <div className="data-note">
                Official NFL schedule
                <br />
                <span>
                  All 18 weeks include official matchups and kickoff times.
                </span>
              </div>
            </aside>
          </div>
        ) : null}
        {view === 'leagues' && (
          <div className="management-grid">
            <section className="panel">
              <h2>Your leagues</h2>
              {data?.leagues.length ? (
                <div className="league-list">
                  {data.leagues.map((l) => (
                    <button
                      key={l.id}
                      disabled={busy}
                      className={`league-option ${data.league === l.id ? 'selected' : ''}`}
                      onClick={() => {
                        setLeagueId(l.id);
                        setNotice('');
                      }}
                    >
                      <span>
                        <strong>{l.name}</strong>
                        <small>
                          {l.owner === data.profile.id
                            ? 'Commissioner'
                            : 'Member'}{' '}
                          · 2026
                        </small>
                      </span>
                      {data.league === l.id ? (
                        <Check size={20} />
                      ) : (
                        <ChevronRight size={20} />
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <p>No leagues yet. Bring your friends together below.</p>
              )}
              {smallForm(
                'create',
                'Start a new league',
                'e.g. Sunday regulars',
              )}
              {smallForm(
                'join',
                'Join with an invite code',
                'Enter 12-character code',
                'code',
              )}
            </section>
            {league && (
              <section className="panel">
                <div className="panel-heading">
                  <h2>{league.name}</h2>
                  {owner && <ShieldCheck size={23} />}
                </div>
                {owner ? (
                  <>
                    <p>
                      Invite friends with this code. They’ll also need access to
                      this private site.
                    </p>
                    <div className="invite-code">
                      <code>{league.code}</code>
                      <button
                        className="icon-button"
                        aria-label="Copy invite code"
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(league.code);
                            setNotice('Invite code copied.');
                          } catch {
                            setError(
                              'Copy is unavailable. Select and copy the code above.',
                            );
                          }
                        }}
                      >
                        <Copy size={18} />
                      </button>
                    </div>
                    <button
                      className="text-button"
                      disabled={busy}
                      onClick={() =>
                        mutate(
                          { action: 'rotate' },
                          'New invite code created. The previous code no longer works.',
                        )
                      }
                    >
                      Generate a new invite code
                    </button>
                  </>
                ) : (
                  <p>
                    Ask your commissioner for an invite code to bring a friend.
                  </p>
                )}
                <h3 className="spaced">Players · {data?.members.length}</h3>
                {data?.members.map((m) => (
                  <div className="member" key={m.id}>
                    <span className="avatar">
                      {m.name.slice(0, 1).toUpperCase()}
                    </span>
                    <span>
                      {m.name}
                      {m.id === league.owner && <small>Commissioner</small>}
                    </span>
                    {owner && m.id !== data.profile.id && (
                      <button
                        className="text-button danger"
                        onClick={() => setRemove(m)}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
                {owner && (
                  <>
                    <h3 className="spaced">Commissioner settings</h3>
                    {smallForm(
                      'rename',
                      'League name',
                      league.name,
                      'name',
                      league.name,
                    )}
                    <p className="footnote">
                      Final scores and standings update automatically from the
                      NFL scoreboard.
                    </p>
                  </>
                )}
              </section>
            )}
          </div>
        )}
        {view === 'account' && (
          <div className="management-grid">
            <section className="panel">
              <CircleUserRound size={35} />
              <h2 className="spaced">
                {data?.profile.name ?? 'Welcome to the club.'}
              </h2>
              {data ? (
                <>
                  {smallForm(
                    'profile',
                    'Your display name',
                    'How your friends know you',
                    'name',
                    data.profile.name,
                  )}
                  <p className="footnote">
                    Signed in with ChatGPT. Your picks follow your account
                    across devices.
                  </p>
                  <a
                    className="outline"
                    href="/signout-with-chatgpt?return_to=%2F"
                    target="_top"
                  >
                    Sign out
                  </a>
                </>
              ) : (
                <a
                  className="primary"
                  href="/signin-with-chatgpt?return_to=%2F"
                  target="_top"
                >
                  Sign in with ChatGPT
                </a>
              )}
            </section>
            <section className="panel">
              <Zap size={30} />
              <h2 className="spaced">Keep Sunday close.</h2>
              <p>
                {installed
                  ? 'Sunday Club is running as an installed app.'
                  : 'On iPhone, open in Safari and use Share → Add to Home Screen. On Android, use your browser’s Install app option.'}
              </p>
              <p className="footnote">
                An internet connection is required to save picks. The latest
                official schedule stays available after it is downloaded.
              </p>
            </section>
          </div>
        )}
      </main>
      <nav className="bottom" aria-label="Main navigation">
        {nav.map(([id, label, Icon]) => (
          <button
            key={id}
            className={view === id ? 'active' : ''}
            aria-current={view === id ? 'page' : undefined}
            onClick={() => {
              setView(id);
              setNotice('');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            <Icon size={20} />
            {label}
          </button>
        ))}
      </nav>
      <AlertDialog
        open={!!remove}
        onOpenChange={(open) => {
          if (!open) setRemove(null);
        }}
      >
        <AlertDialogContent className="bg-white">
          <AlertDialogTitle>Remove {remove?.name}?</AlertDialogTitle>
          <AlertDialogDescription>
            Their picks and standing in this league will be deleted. Generate a
            new invite code to prevent them from rejoining.
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep player</AlertDialogCancel>
            <AlertDialogAction
              disabled={busy}
              onClick={async () => {
                if (
                  await mutate(
                    { action: 'remove', member: remove?.id },
                    'Player removed.',
                  )
                )
                  setRemove(null);
              }}
            >
              Remove player
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

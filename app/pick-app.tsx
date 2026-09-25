'use client';
import { currentNflWeek } from '../lib/current-week';
import type { LiveScore } from '../lib/results';
import type { PickNews } from '../lib/news';
/* eslint-disable next/no-html-link-for-pages -- Sites sign-in and sign-out require full top-level navigation. */
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ComponentType,
  type TouchEvent,
} from 'react';
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
  Flag,
  Flame,
  Brain,
  CircleCheckBig,
  PawPrint,
  Crown,
  Swords,
  CircleCheck,
  CircleX,
  ArrowUp,
  ArrowDown,
  Minus,
  Target,
  Sparkles,
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
import { fallbackGames, team, teams, type Game } from '@/lib/games';
type League = { id: string; name: string; owner: string; code: string };
type Member = { id: string; name: string; favoriteTeam?: string | null };
type Standing = Member & {
  weekly: number;
  monthly: number;
  season: number;
  againstTeamWeekly: number;
  againstTeamMonthly: number;
  againstTeamSeason: number;
  wildWeekly: number;
  wildMonthly: number;
  wildSeason: number;
  favoriteLossWeekly: number;
  favoriteLossMonthly: number;
  favoriteLossSeason: number;
  missedPickWeekly: number;
  missedPickMonthly: number;
  missedPickSeason: number;
  perfectWeekWeekly: number;
  perfectWeekMonthly: number;
  perfectWeekSeason: number;
  loneWolfWeekly: number;
  loneWolfMonthly: number;
  loneWolfSeason: number;
  upsetKingWeekly: number;
  upsetKingMonthly: number;
  upsetKingSeason: number;
  gutsWeekly: number;
  gutsMonthly: number;
  gutsSeason: number;
  nostradamus: boolean;
  throughWeekSeason: number;
  previousSeason: number;
};
type MemberCompletion = Member & { picked: number };
type BadgeKey =
  | 'vende-patrias'
  | 'wild-picker'
  | 'titanic-musician'
  | 'mama-pichas'
  | 'nostradamus'
  | 'perfect-week'
  | 'lone-wolf'
  | 'upset-king'
  | 'no-guts-no-glory';
const badgeOptions: { key: BadgeKey; name: string; description: string }[] = [
  {
    key: 'vende-patrias',
    name: 'VENDE PATRIAS',
    description: 'Most public picks against their own favorite team.',
  },
  {
    key: 'wild-picker',
    name: 'WILD PICKER',
    description: 'Most public picks selected by 20% or less of the league.',
  },
  {
    key: 'titanic-musician',
    name: 'TITANIC MUSICIAN',
    description: 'Most incorrect picks placed on their own favorite team.',
  },
  {
    key: 'mama-pichas',
    name: 'MAMA PICHAS',
    description: 'Most games that started without a submitted pick.',
  },
  {
    key: 'nostradamus',
    name: 'NOSTRADAMUS',
    description:
      'Correctly predicted the Super Bowl champion before the league deadline.',
  },
  {
    key: 'perfect-week',
    name: 'PERFECT WEEK',
    description: 'Correctly picked every completed game in a week.',
  },
  {
    key: 'lone-wolf',
    name: 'LONE WOLF',
    description: 'Most games as the only member who picked the winner.',
  },
  {
    key: 'upset-king',
    name: 'UPSET KING',
    description: 'Most correct picks of the market underdog.',
  },
  {
    key: 'no-guts-no-glory',
    name: 'NO GUTS, NO GLORY',
    description: 'Most correct Wild or Upset picks.',
  },
];
function MamaPichasIcon({
  size = 15,
  'aria-hidden': ariaHidden,
}: {
  size?: number;
  'aria-hidden'?: boolean | 'true' | 'false';
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="-1 -1 26 26"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={ariaHidden}
    >
      <path d="M7.5 8.5v7c-2.6.4-4.5 2.4-4.5 4.7C3 22.3 4.8 24 7.2 24c2 0 3.7-.6 4.8-1.6 1.1 1 2.8 1.6 4.8 1.6 2.4 0 4.2-1.7 4.2-3.8 0-2.3-1.9-4.3-4.5-4.7v-7" />
      <path d="M7.5 8.5c-2 0-3.2-2-2.3-3.7C7.4.9 9.6.8 12 .8s4.6.1 6.8 4c.9 1.7-.3 3.7-2.3 3.7-1.7 0-3.1-.7-4.5-2-1.4 1.3-2.8 2-4.5 2Z" />
      <path d="M12 .8v2.1" />
      <path d="M7.5 15.5c2.2-.3 3.7-1.7 4.1-3.8" />
      <path d="M10.2 19.5c0 1.2.7 2.3 1.8 2.9" />
    </svg>
  );
}
function SinkingBoatIcon({
  size = 15,
  'aria-hidden': ariaHidden,
}: {
  size?: number;
  'aria-hidden'?: boolean | 'true' | 'false';
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={ariaHidden}
    >
      <path d="m4 9 14 5-4 5-7-2.5Z" />
      <path d="m9 11 2-5 5 2.5-1.2 4" />
      <path d="M12 6V3" />
      <path d="M3 21c1.2-1 2.4-1 3.6 0 1.2 1 2.4 1 3.6 0 1.2-1 2.4-1 3.6 0 1.2 1 2.4 1 3.6 0 1.2-1 2.4-1 3.6 0" />
    </svg>
  );
}
const badgeIcons = {
  'vende-patrias': Flag,
  'wild-picker': Flame,
  'titanic-musician': SinkingBoatIcon,
  'mama-pichas': MamaPichasIcon,
  nostradamus: Brain,
  'perfect-week': CircleCheckBig,
  'lone-wolf': PawPrint,
  'upset-king': Crown,
  'no-guts-no-glory': Swords,
} satisfies Record<
  BadgeKey,
  ComponentType<{
    size?: number;
    'aria-hidden'?: boolean | 'true' | 'false';
  }>
>;
type State = {
  profile: Member;
  leagues: League[];
  league: string | null;
  games: Game[];
  liveScores?: Record<string, LiveScore>;
  pickNews?: {
    games: Record<string, PickNews[]>;
    updatedAt: number;
    unavailable: boolean;
  };
  picks: Record<string, string>;
  pickCounts: Record<string, Record<string, number>>;
  picksPublished: boolean;
  canPublishPicks: boolean;
  publishedPicks: Record<string, Record<string, string>>;
  offsetPicks: Record<string, string[]>;
  badgeSettings: Record<BadgeKey, boolean>;
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
  remainingSeasonGames: number;
  remainingGames: Record<'weekly' | 'monthly' | 'season', number>;
  scheduleOfficial: boolean;
  superBowlPick: string | null;
  outrightPicks: Record<string, string>;
  superBowlWinner: string | null;
  superBowlLockWeek: number;
  superBowlPoints: number;
  superBowlDeadline: number;
  superBowlLocked: boolean;
  serverNow: number;
};
const teamChoices = [...teams].sort((a, b) =>
  String(a[2]).localeCompare(String(b[2])),
);
const nav = [
  ['picks', 'Picks', Zap],
  ['outrights', 'Outrights', Crown],
  ['standings', 'Standings', Trophy],
  ['league-picks', 'League Picks', Eye],
  ['leagues', 'Leagues', Users],
  ['account', 'Account', CircleUserRound],
] as const;
const divisions = [
  { id: 'afc_east', name: 'AFC East', teams: ['BUF', 'MIA', 'NE', 'NYJ'] },
  { id: 'afc_north', name: 'AFC North', teams: ['BAL', 'CIN', 'CLE', 'PIT'] },
  { id: 'afc_south', name: 'AFC South', teams: ['HOU', 'IND', 'JAX', 'TEN'] },
  { id: 'afc_west', name: 'AFC West', teams: ['DEN', 'KC', 'LV', 'LAC'] },
  { id: 'nfc_east', name: 'NFC East', teams: ['DAL', 'NYG', 'PHI', 'WAS'] },
  { id: 'nfc_north', name: 'NFC North', teams: ['CHI', 'DET', 'GB', 'MIN'] },
  { id: 'nfc_south', name: 'NFC South', teams: ['ATL', 'CAR', 'NO', 'TB'] },
  { id: 'nfc_west', name: 'NFC West', teams: ['ARI', 'LAR', 'SF', 'SEA'] },
] as const;
export default function PickApp({ initialWeek }: { initialWeek: number }) {
  const [view, setView] = useState('picks');
  const [week, setWeek] = useState(initialWeek);
  const previousCurrentWeek = useRef(initialWeek);
  const [leagueId, setLeagueId] = useState('');
  const [data, setData] = useState<State | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [signedOut, setSignedOut] = useState(false);
  const [period, setPeriod] = useState('monthly');
  const [now, setNow] = useState(0);
  const [remove, setRemove] = useState<Member | null>(null);
  const [installed, setInstalled] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [hideNoImpact, setHideNoImpact] = useState(false);
  const offset = useRef(0);
  const requestId = useRef(0);
  const swipeSurface = useRef<HTMLElement | null>(null);
  const swipeAnimating = useRef(false);
  const swipeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const swipeStart = useRef<{ x: number; y: number } | null>(null);
  useEffect(
    () => () => {
      if (swipeTimer.current) clearTimeout(swipeTimer.current);
    },
    [],
  );
  useEffect(() => {
    if (!now) return;
    const current = currentNflWeek(now);
    const previous = previousCurrentWeek.current;
    if (current !== previous) {
      setWeek((selected) => (selected === previous ? current : selected));
      previousCurrentWeek.current = current;
    }
  }, [now]);
  const load = useCallback(
    async (background = false) => {
      const id = ++requestId.current;
      if (!background) setLoading(true);
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
    },
    [week, leagueId],
  );
  useEffect(() => {
    // eslint-disable-next-line react/react-compiler -- Synchronize the selected league and week with the remote API.
    void load();
  }, [load]);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now() + offset.current), 1000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    if (view !== 'picks') return;
    const timer = setInterval(() => void load(true), 5 * 60_000);
    return () => clearInterval(timer);
  }, [view, load]);
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
    const timer = setTimeout(() => void load(true), 30_000);
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
  useEffect(() => {
    if (!data?.profile.id || !data.league) {
      setHideNoImpact(false);
      return;
    }
    setHideNoImpact(
      localStorage.getItem(
        `mingo-hide-no-impact:${data.profile.id}:${data.league}`,
      ) === 'true',
    );
  }, [data?.profile.id, data?.league]);
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
  const badgeEnabled = (badge: BadgeKey) =>
    data?.badgeSettings[badge] !== false;
  const standingsBadge = (badge: BadgeKey, count?: number) => {
    const option = badgeOptions.find((item) => item.key === badge)!;
    const Icon = badgeIcons[badge];
    const earned = count ?? 1;
    const selectedPeriod =
      period === 'weekly'
        ? `Week ${week}`
        : period === 'monthly'
          ? `Month ${Math.ceil(week / 4)}`
          : 'the full season';
    const earnedLabel = `${earned} ${earned === 1 ? 'time' : 'times'}`;
    return (
      <button
        type="button"
        className={`player-badge ${badge}`}
        aria-label={`${option.name}. Earned ${earnedLabel} in ${selectedPeriod}. ${option.description}`}
      >
        <Icon size={15} aria-hidden="true" />
        <span className="badge-overlay" role="tooltip">
          <span className="badge-overlay-brand">
            <span>
              <Flag size={11} aria-hidden="true" />
              Mingo Quiniela
            </span>
            <span className="badge-overlay-period">{selectedPeriod}</span>
          </span>
          <span className="badge-overlay-title">
            <span className={`badge-overlay-icon ${badge}`}>
              <Icon size={16} aria-hidden="true" />
            </span>
            <strong>
              {option.name}{' '}
              <span className="badge-overlay-times">x{earned}</span>
            </strong>
          </span>
          <span className="badge-overlay-description">
            {option.description}
          </span>
        </span>
      </button>
    );
  };
  const games = data?.games ?? fallbackGames.filter((g) => g.week === week);
  const isLive = (game: Game) =>
    data?.liveScores?.[game.id]?.state === 'live' &&
    game.status !== 'final' &&
    game.status !== 'cancelled';
  const pickGames = [...games].sort((a, b) => {
    const order = (game: Game) =>
      isLive(game)
        ? 0
        : game.status === 'final' || game.status === 'cancelled'
          ? 2
          : 1;
    return order(a) - order(b) || a.kickoff - b.kickoff;
  });
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
  const isUnanimousGame = (game: Game) => {
    if (!data?.revealedGames.includes(game.id) || !data.members.length)
      return false;
    const selections = data.members.map(
      (member) => data.publishedPicks[member.id]?.[game.id],
    );
    return (
      selections.every((selection) => Boolean(selection)) &&
      new Set(selections).size === 1
    );
  };
  const unanimousGameCount = games.filter(isUnanimousGame).length;
  const leaguePickGames = hideNoImpact
    ? games.filter((game) => !isUnanimousGame(game))
    : games;
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
  const month = Math.ceil(week / 4);
  const leaderboard = [...(data?.standings ?? [])].sort(
    (a, b) =>
      (period === 'weekly'
        ? b.weekly - a.weekly
        : period === 'monthly'
          ? b.monthly - a.monthly
          : b.season - a.season) || a.name.localeCompare(b.name),
  );
  const periodScore = (standing: Standing) =>
    period === 'weekly'
      ? standing.weekly
      : period === 'monthly'
        ? standing.monthly
        : standing.season;
  const raceLeaderboard = [...(data?.standings ?? [])].sort(
    (a, b) => periodScore(b) - periodScore(a) || a.name.localeCompare(b.name),
  );
  const raceRemainingGames =
    data?.remainingGames?.[period as 'weekly' | 'monthly' | 'season'] ??
    (period === 'season' ? (data?.remainingSeasonGames ?? 0) : 0);
  const racePeriodLabel =
    period === 'weekly'
      ? `Week ${week}`
      : period === 'monthly'
        ? `Month ${month}`
        : 'Full season';
  const movementLeaderboard = [...(data?.standings ?? [])].sort(
    (a, b) =>
      b.throughWeekSeason - a.throughWeekSeason || a.name.localeCompare(b.name),
  );
  const previousMovementLeaderboard = [...(data?.standings ?? [])].sort(
    (a, b) =>
      b.previousSeason - a.previousSeason || a.name.localeCompare(b.name),
  );
  const tiedRank = (
    players: Standing[],
    score: number,
    key: 'throughWeekSeason' | 'previousSeason',
  ) => players.findIndex((player) => player[key] === score) + 1;
  const seasonMovement = (player: Standing) => {
    if (week <= 1) return 0;
    const currentRank = tiedRank(
      movementLeaderboard,
      player.throughWeekSeason,
      'throughWeekSeason',
    );
    const previousRank = tiedRank(
      previousMovementLeaderboard,
      player.previousSeason,
      'previousSeason',
    );
    return previousRank - currentRank;
  };
  const selectedWeekFinished =
    games.some((game) => game.status !== 'cancelled') &&
    games.every((game) => ['final', 'cancelled'].includes(game.status));
  const weeklyWinnerScore = Math.max(
    0,
    ...(data?.standings ?? []).map((standing) => standing.weekly),
  );
  const weeklyWinnerNames = (data?.standings ?? [])
    .filter((standing) => standing.weekly === weeklyWinnerScore)
    .map((standing) => standing.name);
  const biggestCall = games
    .filter((game) => game.status === 'final' && game.winner)
    .map((game) => {
      const counts = data?.pickCounts[game.id] ?? {};
      const total = Object.values(counts).reduce(
        (sum, votes) => sum + votes,
        0,
      );
      const winnerCount = counts[game.winner!] ?? 0;
      const callers = (data?.members ?? [])
        .filter(
          (member) =>
            data?.publishedPicks[member.id]?.[game.id] === game.winner,
        )
        .map((member) => member.name);
      return {
        game,
        percentage: total ? Math.round((winnerCount / total) * 100) : 100,
        callers,
      };
    })
    .filter((call) => call.callers.length)
    .sort(
      (a, b) => a.percentage - b.percentage || a.game.kickoff - b.game.kickoff,
    )[0];
  const missedWeekPicks = games
    .filter((game) => game.status !== 'cancelled')
    .reduce(
      (total, game) =>
        total +
        (data?.members ?? []).filter(
          (member) => !data?.publishedPicks[member.id]?.[game.id],
        ).length,
      0,
    );
  const biggestMover = [...(data?.standings ?? [])]
    .map((standing) => ({
      name: standing.name,
      movement: seasonMovement(standing),
    }))
    .sort((a, b) => b.movement - a.movement || a.name.localeCompare(b.name))[0];
  const periodCount = (
    standing: Standing,
    kind:
      | 'against'
      | 'wild'
      | 'favorite-loss'
      | 'missed'
      | 'perfect-week'
      | 'lone-wolf'
      | 'upset-king'
      | 'guts',
  ) => {
    if (kind === 'against')
      return period === 'weekly'
        ? standing.againstTeamWeekly
        : period === 'monthly'
          ? standing.againstTeamMonthly
          : standing.againstTeamSeason;
    if (kind === 'wild')
      return period === 'weekly'
        ? standing.wildWeekly
        : period === 'monthly'
          ? standing.wildMonthly
          : standing.wildSeason;
    if (kind === 'favorite-loss')
      return period === 'weekly'
        ? standing.favoriteLossWeekly
        : period === 'monthly'
          ? standing.favoriteLossMonthly
          : standing.favoriteLossSeason;
    if (kind === 'perfect-week')
      return period === 'weekly'
        ? standing.perfectWeekWeekly
        : period === 'monthly'
          ? standing.perfectWeekMonthly
          : standing.perfectWeekSeason;
    if (kind === 'lone-wolf')
      return period === 'weekly'
        ? standing.loneWolfWeekly
        : period === 'monthly'
          ? standing.loneWolfMonthly
          : standing.loneWolfSeason;
    if (kind === 'upset-king')
      return period === 'weekly'
        ? standing.upsetKingWeekly
        : period === 'monthly'
          ? standing.upsetKingMonthly
          : standing.upsetKingSeason;
    if (kind === 'guts')
      return period === 'weekly'
        ? standing.gutsWeekly
        : period === 'monthly'
          ? standing.gutsMonthly
          : standing.gutsSeason;
    return period === 'weekly'
      ? standing.missedPickWeekly
      : period === 'monthly'
        ? standing.missedPickMonthly
        : standing.missedPickSeason;
  };
  const againstLeaderCount = Math.max(
    0,
    ...leaderboard.map((standing) => periodCount(standing, 'against')),
  );
  const wildLeaderCount = Math.max(
    0,
    ...leaderboard.map((standing) => periodCount(standing, 'wild')),
  );
  const favoriteLossLeaderCount = Math.max(
    0,
    ...leaderboard.map((standing) => periodCount(standing, 'favorite-loss')),
  );
  const missedPickLeaderCount = Math.max(
    0,
    ...leaderboard.map((standing) => periodCount(standing, 'missed')),
  );
  const loneWolfLeaderCount = Math.max(
    0,
    ...leaderboard.map((standing) => periodCount(standing, 'lone-wolf')),
  );
  const upsetKingLeaderCount = Math.max(
    0,
    ...leaderboard.map((standing) => periodCount(standing, 'upset-king')),
  );
  const gutsLeaderCount = Math.max(
    0,
    ...leaderboard.map((standing) => periodCount(standing, 'guts')),
  );
  const visibleBadgeKeys = new Set<BadgeKey>();
  if (badgeEnabled('vende-patrias') && againstLeaderCount > 0)
    visibleBadgeKeys.add('vende-patrias');
  if (badgeEnabled('wild-picker') && wildLeaderCount > 0)
    visibleBadgeKeys.add('wild-picker');
  if (badgeEnabled('titanic-musician') && favoriteLossLeaderCount > 0)
    visibleBadgeKeys.add('titanic-musician');
  if (badgeEnabled('mama-pichas') && missedPickLeaderCount > 0)
    visibleBadgeKeys.add('mama-pichas');
  if (
    badgeEnabled('nostradamus') &&
    leaderboard.some((standing) => standing.nostradamus)
  )
    visibleBadgeKeys.add('nostradamus');
  if (
    badgeEnabled('perfect-week') &&
    leaderboard.some((standing) => periodCount(standing, 'perfect-week') > 0)
  )
    visibleBadgeKeys.add('perfect-week');
  if (badgeEnabled('lone-wolf') && loneWolfLeaderCount > 0)
    visibleBadgeKeys.add('lone-wolf');
  if (badgeEnabled('upset-king') && upsetKingLeaderCount > 0)
    visibleBadgeKeys.add('upset-king');
  if (badgeEnabled('no-guts-no-glory') && gutsLeaderCount > 0)
    visibleBadgeKeys.add('no-guts-no-glory');
  // A badge distinguishes members only when some, rather than all, earn it.
  const earnsBadge = (standing: Standing, badge: BadgeKey) => {
    if (badge === 'nostradamus') return standing.nostradamus;
    if (badge === 'perfect-week')
      return periodCount(standing, 'perfect-week') > 0;
    const criteria = {
      'vende-patrias': ['against', againstLeaderCount],
      'wild-picker': ['wild', wildLeaderCount],
      'titanic-musician': ['favorite-loss', favoriteLossLeaderCount],
      'mama-pichas': ['missed', missedPickLeaderCount],
      'lone-wolf': ['lone-wolf', loneWolfLeaderCount],
      'upset-king': ['upset-king', upsetKingLeaderCount],
      'no-guts-no-glory': ['guts', gutsLeaderCount],
    } as const;
    const [kind, leaderCount] = criteria[badge];
    return leaderCount > 0 && periodCount(standing, kind) === leaderCount;
  };
  for (const badge of visibleBadgeKeys) {
    if (leaderboard.every((standing) => earnsBadge(standing, badge))) {
      visibleBadgeKeys.delete(badge);
    }
  }
  const startTabSwipe = (event: TouchEvent<HTMLElement>) => {
    if (
      swipeAnimating.current ||
      event.touches.length !== 1 ||
      (event.target as Element).closest(
        'input, select, textarea, [data-slot="table-container"], .weekbar, .period-tabs',
      )
    ) {
      swipeStart.current = null;
      return;
    }
    const touch = event.touches[0];
    swipeStart.current = {
      x: touch.clientX,
      y: touch.clientY,
    };
    const surface = swipeSurface.current;
    if (surface) {
      surface.style.transition = 'none';
      surface.style.willChange = 'transform, opacity';
    }
  };
  const moveTabSwipe = (event: TouchEvent<HTMLElement>) => {
    const start = swipeStart.current;
    const surface = swipeSurface.current;
    if (!start || !surface || event.touches.length !== 1) return;
    const touch = event.touches[0];
    const horizontal = touch.clientX - start.x;
    const vertical = touch.clientY - start.y;
    if (Math.abs(horizontal) < 6 || Math.abs(horizontal) <= Math.abs(vertical))
      return;
    event.preventDefault();
    const currentIndex = nav.findIndex(([id]) => id === view);
    const atEdge =
      (currentIndex === 0 && horizontal > 0) ||
      (currentIndex === nav.length - 1 && horizontal < 0);
    const movement = atEdge ? horizontal * 0.22 : horizontal;
    surface.style.transform = `translate3d(${movement}px, 0, 0)`;
    surface.style.opacity = String(
      1 - Math.min(Math.abs(movement) / window.innerWidth, 0.18),
    );
  };
  const finishTabSwipe = (event: TouchEvent<HTMLElement>) => {
    const start = swipeStart.current;
    swipeStart.current = null;
    const surface = swipeSurface.current;
    if (!start || !surface || event.changedTouches.length !== 1) return;
    const touch = event.changedTouches[0];
    const horizontal = touch.clientX - start.x;
    const vertical = touch.clientY - start.y;
    const currentIndex = nav.findIndex(([id]) => id === view);
    const nextIndex = currentIndex + (horizontal < 0 ? 1 : -1);
    const shouldSnapBack =
      Math.abs(horizontal) < 70 ||
      Math.abs(horizontal) < Math.abs(vertical) * 1.35 ||
      currentIndex < 0 ||
      nextIndex < 0 ||
      nextIndex >= nav.length;
    surface.style.transition =
      'transform 180ms cubic-bezier(.22,.8,.32,1), opacity 180ms ease';
    if (shouldSnapBack) {
      surface.style.transform = 'translate3d(0, 0, 0)';
      surface.style.opacity = '1';
      swipeTimer.current = setTimeout(() => {
        surface.style.transition = '';
        surface.style.willChange = '';
      }, 190);
      return;
    }
    swipeAnimating.current = true;
    const direction = horizontal < 0 ? -1 : 1;
    surface.style.transform = `translate3d(${direction * window.innerWidth}px, 0, 0)`;
    surface.style.opacity = '0.55';
    swipeTimer.current = setTimeout(() => {
      setView(nav[nextIndex][0]);
      setNotice('');
      window.scrollTo({ top: 0, behavior: 'auto' });
      surface.style.transition = 'none';
      surface.style.transform = `translate3d(${-direction * 52}px, 0, 0)`;
      surface.style.opacity = '0.72';
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          surface.style.transition =
            'transform 190ms cubic-bezier(.22,.8,.32,1), opacity 190ms ease';
          surface.style.transform = 'translate3d(0, 0, 0)';
          surface.style.opacity = '1';
          swipeTimer.current = setTimeout(() => {
            surface.style.transition = '';
            surface.style.willChange = '';
            swipeAnimating.current = false;
          }, 200);
        });
      });
    }, 180);
  };
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
            <img src="/field-goal.svg" width="38" height="38" alt="" />
          </span>
          MINGO<span className="light">QUINIELA</span>
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
            className={`icon-button${data?.profile.favoriteTeam ? ' favorite-team-avatar' : ''}`}
            aria-label="Open account"
            onClick={() => setView('account')}
          >
            {data?.profile.favoriteTeam ? (
              <img
                src={`/team-logos/${data.profile.favoriteTeam}.png`}
                alt={`${team(data.profile.favoriteTeam)[2]} logo`}
                width="34"
                height="34"
              />
            ) : (
              <CircleUserRound />
            )}
          </button>
        </div>
      </header>
      <main
        ref={swipeSurface}
        className="swipe-tabs"
        onTouchStart={startTabSwipe}
        onTouchMove={moveTabSwipe}
        onTouchEnd={finishTabSwipe}
        onTouchCancel={() => {
          swipeStart.current = null;
          const surface = swipeSurface.current;
          if (surface) {
            surface.style.transition =
              'transform 180ms ease, opacity 180ms ease';
            surface.style.transform = 'translate3d(0, 0, 0)';
            surface.style.opacity = '1';
            swipeTimer.current = setTimeout(() => {
              surface.style.transition = '';
              surface.style.willChange = '';
            }, 190);
          }
        }}
      >
        <div className="league-line">
          <button
            className="league-link eyebrow"
            onClick={() => setView('leagues')}
          >
            {league ? league.name : 'YOUR MINGO QUINIELA'}
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
                : view === 'outrights'
                  ? 'Call the champions.'
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
                : view === 'outrights'
                  ? 'Choose every division winner and your Super Bowl champion.'
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
        {view === 'picks' ||
        view === 'outrights' ||
        view === 'standings' ||
        view === 'league-picks' ? (
          <div className="layout">
            <section aria-busy={loading}>
              {view !== 'outrights' && (
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
              )}
              {view === 'outrights' ? (
                <div className="outrights-page">
                  <section className="outrights-intro">
                    <div>
                      <span className="eyebrow">SEASON OUTRIGHTS</span>
                      <h2>Pick the winners.</h2>
                      <p>
                        All selections lock when Week{' '}
                        {data?.superBowlLockWeek ?? 5} begins.
                      </p>
                    </div>
                    <span
                      className={`outrights-status${data?.superBowlLocked ? ' locked' : ''}`}
                    >
                      {data?.superBowlLocked ? <LockKeyhole size={14} /> : null}
                      {data?.superBowlLocked
                        ? 'Locked'
                        : `Open through Week ${data?.superBowlLockWeek ?? 5}`}
                    </span>
                  </section>
                  <section className="outright-card super-bowl-outright">
                    <div className="outright-heading">
                      <div>
                        <span className="eyebrow">SUPER BOWL</span>
                        <h2>League champion</h2>
                      </div>
                      <p>
                        A correct prediction wins {data?.superBowlPoints ?? 0}{' '}
                        season{' '}
                        {(data?.superBowlPoints ?? 0) === 1
                          ? 'point'
                          : 'points'}
                        .
                        {badgeEnabled('nostradamus') &&
                          ' It also earns NOSTRADAMUS.'}
                      </p>
                    </div>
                    <div className="logo-choice-grid all-teams">
                      {teamChoices.map((entry) => {
                        const selected = data?.superBowlPick === entry[0];
                        return (
                          <button
                            key={entry[0]}
                            className={
                              selected ? 'logo-choice selected' : 'logo-choice'
                            }
                            disabled={busy || data?.superBowlLocked || !league}
                            aria-label={`${entry[2]}${selected ? ', selected' : ''}`}
                            onClick={() =>
                              void mutate(
                                selected
                                  ? { action: 'super-bowl-unpick' }
                                  : {
                                      action: 'super-bowl-pick',
                                      team: entry[0],
                                    },
                                selected
                                  ? 'Super Bowl prediction removed.'
                                  : `${entry[2]} selected as Super Bowl winner.`,
                              )
                            }
                          >
                            <img
                              src={`/team-logos/${entry[0]}.png`}
                              alt=""
                              width="42"
                              height="42"
                            />
                            <span>{entry[0]}</span>
                            {selected && <Check size={14} />}
                          </button>
                        );
                      })}
                    </div>
                  </section>
                  <div className="division-grid">
                    {divisions.map((division) => (
                      <section className="outright-card" key={division.id}>
                        <div className="outright-heading">
                          <span className="eyebrow">
                            {division.name.startsWith('AFC') ? 'AFC' : 'NFC'}
                          </span>
                          <h2>{division.name}</h2>
                        </div>
                        <div className="logo-choice-grid">
                          {division.teams.map((teamId) => {
                            const selected =
                              data?.outrightPicks[division.id] === teamId;
                            return (
                              <button
                                key={teamId}
                                className={
                                  selected
                                    ? 'logo-choice selected'
                                    : 'logo-choice'
                                }
                                disabled={
                                  busy || data?.superBowlLocked || !league
                                }
                                aria-label={`${team(teamId)[2]}${selected ? ', selected' : ''}`}
                                onClick={() =>
                                  void mutate(
                                    selected
                                      ? {
                                          action: 'outright-unpick',
                                          category: division.id,
                                        }
                                      : {
                                          action: 'outright-pick',
                                          category: division.id,
                                          team: teamId,
                                        },
                                    selected
                                      ? `${division.name} prediction removed.`
                                      : `${team(teamId)[2]} selected for ${division.name}.`,
                                  )
                                }
                              >
                                <img
                                  src={`/team-logos/${teamId}.png`}
                                  alt=""
                                  width="48"
                                  height="48"
                                />
                                <span>{teamId}</span>
                                {selected && <Check size={14} />}
                              </button>
                            );
                          })}
                        </div>
                      </section>
                    ))}
                  </div>
                </div>
              ) : view === 'picks' ? (
                <>
                  {data && !data.profile.favoriteTeam && (
                    <div className="favorite-required">
                      <div>
                        <b>Choose your favorite NFL team</b>
                        <span>
                          This is required before you can submit picks.
                        </span>
                      </div>
                      <button
                        className="outline"
                        onClick={() => setView('account')}
                      >
                        Choose team
                      </button>
                    </div>
                  )}
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
                    {pickGames.map((g) => (
                      <article
                        className={`game${isLive(g) ? ' game-live' : ''}`}
                        key={g.id}
                      >
                        <div className="game-meta">
                          <span>{date(g)}</span>
                          {!isLive(g) && (
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
                          )}
                        </div>
                        {data?.liveScores?.[g.id] && (
                          <div
                            className={`live-score ${data.liveScores[g.id].state}`}
                            aria-label={`${g.away} ${data.liveScores[g.id].away}, ${g.home} ${data.liveScores[g.id].home}, ${data.liveScores[g.id].detail}`}
                          >
                            <strong>
                              {g.away} <b>{data.liveScores[g.id].away}</b>
                            </strong>
                            <span>{data.liveScores[g.id].detail}</span>
                            <strong>
                              <b>{data.liveScores[g.id].home}</b> {g.home}
                            </strong>
                          </div>
                        )}
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
                              disabled={
                                locked(g) ||
                                busy ||
                                loading ||
                                !league ||
                                !data?.profile.favoriteTeam
                              }
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
                        {!['final', 'cancelled'].includes(g.status) && (
                          <details
                            className="pick-news"
                            open={Boolean(data?.pickNews?.games[g.id]?.length)}
                          >
                            <summary>
                              Matchup news{' '}
                              <span>
                                {data?.pickNews?.games[g.id]?.length ?? 0}{' '}
                                updates
                              </span>
                            </summary>
                            {data?.pickNews?.unavailable && (
                              <p className="news-status">
                                News feed temporarily unavailable.{' '}
                                {data.pickNews.updatedAt
                                  ? 'Showing previously fetched updates.'
                                  : 'Try refreshing later.'}
                              </p>
                            )}
                            {data?.pickNews?.games[g.id]?.length ? (
                              <ul>
                                {data.pickNews.games[g.id].map((item) => (
                                  <li key={item.id}>
                                    <span className="news-topic">
                                      {item.topic}
                                    </span>
                                    <a
                                      href={item.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                    >
                                      {item.headline}{' '}
                                      <ArrowUpRight
                                        size={14}
                                        aria-hidden="true"
                                      />
                                    </a>
                                    <small>
                                      ESPN ·{' '}
                                      <time
                                        dateTime={new Date(
                                          item.publishedAt,
                                        ).toISOString()}
                                      >
                                        {new Date(
                                          item.publishedAt,
                                        ).toLocaleString(undefined, {
                                          month: 'short',
                                          day: 'numeric',
                                          hour: 'numeric',
                                          minute: '2-digit',
                                        })}
                                      </time>
                                    </small>
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              !data?.pickNews?.unavailable && (
                                <p className="news-status">
                                  No recent injury, quarterback or roster news
                                  in this feed.
                                </p>
                              )
                            )}
                          </details>
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
                          <TabsTrigger value="monthly">
                            Month {month}
                          </TabsTrigger>
                          <TabsTrigger value="weekly">Week {week}</TabsTrigger>
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
                              const againstCount = periodCount(p, 'against');
                              const wildCount = periodCount(p, 'wild');
                              const favoriteLossCount = periodCount(
                                p,
                                'favorite-loss',
                              );
                              const missedPickCount = periodCount(p, 'missed');
                              const perfectWeekCount = periodCount(
                                p,
                                'perfect-week',
                              );
                              const loneWolfCount = periodCount(p, 'lone-wolf');
                              const upsetKingCount = periodCount(
                                p,
                                'upset-king',
                              );
                              const gutsCount = periodCount(p, 'guts');
                              return (
                                <TableRow key={p.id}>
                                  <TableCell>
                                    <div className="rank-movement-cell">
                                      <span
                                        className={
                                          rank === 1 ? 'rank first' : 'rank'
                                        }
                                      >
                                        {rank === 1 ? (
                                          <Trophy size={17} />
                                        ) : (
                                          rank
                                        )}
                                      </span>
                                      {week > 1 &&
                                        (seasonMovement(p) > 0 ? (
                                          <span
                                            className="rank-change up"
                                            title={`Up ${seasonMovement(p)} ${seasonMovement(p) === 1 ? 'place' : 'places'} in the season standings during Week ${week}`}
                                          >
                                            <ArrowUp size={11} />
                                            {seasonMovement(p)}
                                          </span>
                                        ) : seasonMovement(p) < 0 ? (
                                          <span
                                            className="rank-change down"
                                            title={`Down ${Math.abs(seasonMovement(p))} ${Math.abs(seasonMovement(p)) === 1 ? 'place' : 'places'} in the season standings during Week ${week}`}
                                          >
                                            <ArrowDown size={11} />
                                            {Math.abs(seasonMovement(p))}
                                          </span>
                                        ) : (
                                          <span
                                            className="rank-change even"
                                            title={`No season rank change during Week ${week}`}
                                          >
                                            <Minus size={11} />
                                          </span>
                                        ))}
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <div className="standing-player">
                                      <strong>{p.name}</strong>
                                      {p.id === data?.profile.id && (
                                        <span className="you-tag">YOU</span>
                                      )}
                                      {visibleBadgeKeys.has('vende-patrias') &&
                                        againstLeaderCount > 0 &&
                                        againstCount === againstLeaderCount &&
                                        standingsBadge(
                                          'vende-patrias',
                                          againstCount,
                                        )}
                                      {visibleBadgeKeys.has('wild-picker') &&
                                        wildLeaderCount > 0 &&
                                        wildCount === wildLeaderCount &&
                                        standingsBadge(
                                          'wild-picker',
                                          wildCount,
                                        )}
                                      {visibleBadgeKeys.has(
                                        'titanic-musician',
                                      ) &&
                                        favoriteLossLeaderCount > 0 &&
                                        favoriteLossCount ===
                                          favoriteLossLeaderCount &&
                                        standingsBadge(
                                          'titanic-musician',
                                          favoriteLossCount,
                                        )}
                                      {visibleBadgeKeys.has('mama-pichas') &&
                                        missedPickLeaderCount > 0 &&
                                        missedPickCount ===
                                          missedPickLeaderCount &&
                                        standingsBadge(
                                          'mama-pichas',
                                          missedPickCount,
                                        )}
                                      {visibleBadgeKeys.has('nostradamus') &&
                                        p.nostradamus &&
                                        standingsBadge('nostradamus')}
                                      {visibleBadgeKeys.has('perfect-week') &&
                                        perfectWeekCount > 0 &&
                                        standingsBadge(
                                          'perfect-week',
                                          perfectWeekCount,
                                        )}
                                      {visibleBadgeKeys.has('lone-wolf') &&
                                        loneWolfLeaderCount > 0 &&
                                        loneWolfCount === loneWolfLeaderCount &&
                                        standingsBadge(
                                          'lone-wolf',
                                          loneWolfCount,
                                        )}
                                      {visibleBadgeKeys.has('upset-king') &&
                                        upsetKingLeaderCount > 0 &&
                                        upsetKingCount ===
                                          upsetKingLeaderCount &&
                                        standingsBadge(
                                          'upset-king',
                                          upsetKingCount,
                                        )}
                                      {visibleBadgeKeys.has(
                                        'no-guts-no-glory',
                                      ) &&
                                        gutsLeaderCount > 0 &&
                                        gutsCount === gutsLeaderCount &&
                                        standingsBadge(
                                          'no-guts-no-glory',
                                          gutsCount,
                                        )}
                                    </div>
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
                      {selectedWeekFinished && leaderboard.length > 0 && (
                        <section className="weekly-recap">
                          <div className="standings-feature-heading">
                            <span>
                              <Sparkles size={16} />
                              Week {week} recap
                            </span>
                            <small>Final</small>
                          </div>
                          <div className="weekly-recap-grid">
                            <article>
                              <small>Week winner</small>
                              <strong>{weeklyWinnerNames.join(' & ')}</strong>
                              <span>{weeklyWinnerScore} correct picks</span>
                            </article>
                            <article>
                              <small>Best call</small>
                              <strong>
                                {biggestCall
                                  ? `${biggestCall.game.winner} over ${biggestCall.game.winner === biggestCall.game.away ? biggestCall.game.home : biggestCall.game.away}`
                                  : 'No winning call'}
                              </strong>
                              <span>
                                {biggestCall
                                  ? `${biggestCall.callers.join(', ')} · ${biggestCall.percentage}% backed it`
                                  : 'No player selected a winner'}
                              </span>
                            </article>
                            <article>
                              <small>Biggest mover</small>
                              <strong>
                                {(biggestMover?.movement ?? 0) > 0
                                  ? biggestMover.name
                                  : 'Standings held'}
                              </strong>
                              <span>
                                {(biggestMover?.movement ?? 0) > 0
                                  ? `Up ${biggestMover.movement} ${biggestMover.movement === 1 ? 'place' : 'places'}`
                                  : 'No one moved up this week'}
                              </span>
                            </article>
                            <article>
                              <small>Missed picks</small>
                              <strong>{missedWeekPicks}</strong>
                              <span>
                                {missedWeekPicks === 1
                                  ? 'pick was not submitted'
                                  : 'picks were not submitted'}
                              </span>
                            </article>
                          </div>
                        </section>
                      )}
                      {raceLeaderboard.length > 0 && (
                        <section className="playoff-race">
                          <div className="standings-feature-heading">
                            <span>
                              <Target size={16} />
                              Playoff race · {racePeriodLabel}
                            </span>
                            <small>{raceRemainingGames} games left</small>
                          </div>
                          <div className="playoff-race-list">
                            {raceLeaderboard.map((player) => {
                              const leaderScore = raceLeaderboard[0]
                                ? periodScore(raceLeaderboard[0])
                                : 0;
                              const playerScore = periodScore(player);
                              const behind = leaderScore - playerScore;
                              const alive = behind <= raceRemainingGames;
                              const raceRank =
                                raceLeaderboard.findIndex(
                                  (entry) => periodScore(entry) === playerScore,
                                ) + 1;
                              return (
                                <div
                                  className="playoff-race-row"
                                  key={player.id}
                                >
                                  <span className="playoff-position">
                                    {raceRank}
                                  </span>
                                  <strong>{player.name}</strong>
                                  <span className="playoff-gap">
                                    {behind === 0 ? 'Leader' : `${behind} back`}
                                  </span>
                                  <span
                                    className={`playoff-status ${alive ? 'alive' : 'out'}`}
                                  >
                                    {behind === 0
                                      ? 'Front runner'
                                      : alive
                                        ? 'In the race'
                                        : 'Eliminated'}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                          <p>
                            A player remains in the race while the points behind
                            first do not exceed the unresolved games remaining
                            in {racePeriodLabel.toLowerCase()}.
                          </p>
                        </section>
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
                          <label className="no-impact-filter">
                            <span>
                              <input
                                type="checkbox"
                                checked={hideNoImpact}
                                onChange={(event) => {
                                  const checked = event.currentTarget.checked;
                                  setHideNoImpact(checked);
                                  localStorage.setItem(
                                    `mingo-hide-no-impact:${data.profile.id}:${data.league}`,
                                    String(checked),
                                  );
                                }}
                              />
                              <span aria-hidden="true" />
                            </span>
                            <strong>Hide no-impact matches</strong>
                            <small>
                              {unanimousGameCount}{' '}
                              {unanimousGameCount === 1 ? 'match' : 'matches'}
                            </small>
                          </label>
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
                                {leaguePickGames.map((game) => {
                                  const unanimous = isUnanimousGame(game);
                                  return (
                                    <TableRow
                                      key={game.id}
                                      className={[
                                        isLive(game) ? 'league-live-row' : '',
                                        unanimous ? 'unanimous-pick-row' : '',
                                      ]
                                        .filter(Boolean)
                                        .join(' ')}
                                      aria-label={
                                        isLive(game)
                                          ? `${game.away} at ${game.home}, game in progress${unanimous ? ', unanimous picks with no standings impact' : ''}`
                                          : unanimous
                                            ? `${game.away} at ${game.home}, unanimous picks with no standings impact`
                                            : undefined
                                      }
                                    >
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
                                          const isOffset = Boolean(
                                            data.offsetPicks[
                                              member.id
                                            ]?.includes(game.id),
                                          );
                                          const isFinalWithWinner =
                                            game.status === 'final' &&
                                            Boolean(game.winner);
                                          const isCorrect =
                                            isFinalWithWinner &&
                                            selected === game.winner;
                                          const isIncorrect =
                                            isFinalWithWinner &&
                                            selected !== game.winner;
                                          return (
                                            <TableCell key={member.id}>
                                              <span
                                                className={
                                                  selected
                                                    ? `published-team${isOffset ? ' offset-pick' : isWildPick ? ' wild-pick' : ''}${isCorrect ? ' correct-pick' : isIncorrect ? ' incorrect-pick' : ''}`
                                                    : `missing-pick${isIncorrect ? ' incorrect-pick' : ''}`
                                                }
                                                title={
                                                  isCorrect
                                                    ? 'Correct pick'
                                                    : isIncorrect
                                                      ? selected
                                                        ? 'Incorrect pick'
                                                        : 'No pick submitted'
                                                      : isOffset
                                                        ? 'Upset · changed after publication and currently the league’s only pick for this team'
                                                        : isWildPick
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
                                                {(isOffset || isWildPick) && (
                                                  <small>
                                                    {isOffset
                                                      ? 'UPSET'
                                                      : 'WILD PICK'}
                                                  </small>
                                                )}
                                                {isCorrect && (
                                                  <CircleCheck
                                                    className="pick-result-icon"
                                                    size={13}
                                                    aria-label="Correct pick"
                                                  />
                                                )}
                                                {isIncorrect && (
                                                  <CircleX
                                                    className="pick-result-icon"
                                                    size={13}
                                                    aria-label={
                                                      selected
                                                        ? 'Incorrect pick'
                                                        : 'No pick submitted'
                                                    }
                                                  />
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
                                  );
                                })}
                              </TableBody>
                            </Table>
                          </div>
                          {hideNoImpact && leaguePickGames.length === 0 && (
                            <p className="no-impact-empty">
                              Every revealed matchup has the same pick from all
                              members.
                            </p>
                          )}
                          <p className="wild-pick-note">
                            Completed games show correct picks in green and
                            incorrect or missing picks in red. WILD marks a team
                            selected by 20% or less of the league for that
                            matchup. UPSET marks a unique pick changed after
                            that matchup became public. Neutral highlighted rows
                            are matchups where every member chose the same team,
                            so the result cannot change the relative standings.
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
              {smallForm('create', 'Start a new league', 'e.g. Mingo crew')}
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
                      {m.favoriteTeam ? (
                        <img
                          src={`/team-logos/${m.favoriteTeam}.png`}
                          alt=""
                          width="30"
                          height="30"
                        />
                      ) : (
                        m.name.slice(0, 1).toUpperCase()
                      )}
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
                    <form
                      className="season-settings-form"
                      key={`${league.id}-${data?.superBowlLockWeek}-${data?.superBowlPoints}`}
                      onSubmit={async (event) => {
                        event.preventDefault();
                        const form = new FormData(event.currentTarget);
                        await mutate(
                          {
                            action: 'super-bowl-settings',
                            lockWeek: Number(form.get('lockWeek')),
                            points: Number(form.get('points')),
                          },
                          'Super Bowl prediction settings updated.',
                        );
                      }}
                    >
                      <div>
                        <strong>Outrights predictions</strong>
                        <small>
                          Division and Super Bowl picks lock when the first game
                          of the selected week starts.
                        </small>
                      </div>
                      <div className="season-settings-fields">
                        <label>
                          Lock week
                          <select
                            name="lockWeek"
                            defaultValue={data?.superBowlLockWeek ?? 5}
                          >
                            {Array.from(
                              { length: 17 },
                              (_, index) => index + 2,
                            ).map((value) => (
                              <option key={value} value={value}>
                                Week {value}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label>
                          Points for correct winner
                          <input
                            type="number"
                            name="points"
                            min="0"
                            max="100"
                            step="1"
                            defaultValue={data?.superBowlPoints ?? 0}
                            required
                          />
                        </label>
                      </div>
                      <button className="primary" disabled={busy}>
                        Save prediction settings
                      </button>
                    </form>
                    <form
                      className="badge-settings-form"
                      key={`${league.id}-${JSON.stringify(data?.badgeSettings)}`}
                      onSubmit={async (event) => {
                        event.preventDefault();
                        const badges = new FormData(event.currentTarget)
                          .getAll('badges')
                          .map(String);
                        await mutate(
                          { action: 'badge-settings', badges },
                          'League badges updated.',
                        );
                      }}
                    >
                      <div>
                        <strong>Standings badges</strong>
                        <small>
                          Choose which badges appear for everyone in this
                          league.
                        </small>
                      </div>
                      <div className="badge-settings-list">
                        {badgeOptions.map((badge) => (
                          <label key={badge.key}>
                            <input
                              type="checkbox"
                              name="badges"
                              value={badge.key}
                              defaultChecked={badgeEnabled(badge.key)}
                            />
                            <span>
                              <b>{badge.name}</b>
                              <small>{badge.description}</small>
                            </span>
                          </label>
                        ))}
                      </div>
                      <button className="primary" disabled={busy}>
                        Save badge settings
                      </button>
                    </form>
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
              {data?.profile.favoriteTeam ? (
                <img
                  className="account-team-avatar"
                  src={`/team-logos/${data.profile.favoriteTeam}.png`}
                  alt={`${team(data.profile.favoriteTeam)[2]} logo`}
                  width="56"
                  height="56"
                />
              ) : (
                <CircleUserRound size={35} />
              )}
              <h2 className="spaced">
                {data?.profile.name ?? 'Welcome to Mingo Quiniela.'}
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
                  <form
                    className="favorite-team-form"
                    onSubmit={async (e) => {
                      e.preventDefault();
                      const favoriteTeam = new FormData(e.currentTarget).get(
                        'favoriteTeam',
                      );
                      await mutate(
                        { action: 'favorite-team', favoriteTeam },
                        'Favorite team saved.',
                      );
                    }}
                  >
                    <label htmlFor="favorite-team">Your favorite team</label>
                    <div>
                      <select
                        id="favorite-team"
                        name="favoriteTeam"
                        required
                        defaultValue={data.profile.favoriteTeam ?? ''}
                      >
                        <option value="" disabled>
                          Choose an NFL team
                        </option>
                        {[...fallbackGames]
                          .flatMap((game) => [game.away, game.home])
                          .filter((id, index, all) => all.indexOf(id) === index)
                          .sort((a, b) => team(a)[2].localeCompare(team(b)[2]))
                          .map((id) => (
                            <option key={id} value={id}>
                              {team(id)[1]} {team(id)[2]}
                            </option>
                          ))}
                      </select>
                      <button className="primary" disabled={busy}>
                        Save team
                      </button>
                    </div>
                    <small>
                      Standings count every public pick you make against this
                      team.
                    </small>
                  </form>
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
              <img src="/field-goal.svg" alt="" width="36" height="36" />
              <h2 className="spaced">Take Mingo Quiniela with you.</h2>
              <p>
                {installed
                  ? 'Mingo Quiniela is running as an installed app.'
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

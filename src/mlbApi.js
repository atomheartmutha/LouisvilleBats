/**
 * MLB Stats API Client for Louisville Bats (Triple-A, sportId=11)
 * Extracts real schedule, team, and roster stats, then transforms them
 * into "Backyard Baseball" kid player attributes.
 */

const MLB_API_BASE = 'https://statsapi.mlb.com/api/v1';
const SPORT_ID_AAA = 11; // Triple-A Minor League Baseball
let rosterCache = null;
let rosterExpires = 0;
let rosterRequest = null;

export async function getBatsCharacters() {
  if (Date.now() < rosterExpires && rosterCache) return rosterCache;
  if (rosterRequest) return rosterRequest;
  rosterRequest = (async () => {
    try {
      const response = await fetch(`${MLB_API_BASE}/teams/416/roster?rosterType=active`, { signal: AbortSignal.timeout(5000) });
      if (!response.ok) throw new Error('Roster unavailable');
      const data = await response.json();
      const characters = (data.roster || []).filter(p => p.person?.id && p.person?.fullName).map(p => ({
        id: p.person.id, fullName: p.person.fullName, jerseyNumber: p.jerseyNumber || '—',
        primaryPosition: p.position?.abbreviation || '—',
        // Neutral game ratings are not presented as real player statistics.
        backyardStats: { batting: 5, running: 5, pitching: 5, fielding: 5 },
        rawStats: { battingAvg: null, homeRuns: null, stolenBases: null },
        source: `${MLB_API_BASE}/people/${p.person.id}`
      }));
      if (!characters.length) throw new Error('Empty roster');
      try {
        const statsURL = `${MLB_API_BASE}/stats?stats=season&group=hitting&teamId=416&sportIds=11&limit=1000&playerPool=ALL`;
        const statsResponse = await fetch(statsURL, { signal: AbortSignal.timeout(4000) });
        if (!statsResponse.ok) throw new Error('Stats unavailable');
        const statsData = await statsResponse.json();
        for (const player of characters) {
          const split = statsData.stats?.flatMap(s => s.splits || []).find(s => s.player?.id === player.id && s.team?.id === 416);
          if (!split) continue;
          const stat = split.stat;
          player.rawStats = { battingAvg: stat.avg ?? null, homeRuns: stat.homeRuns ?? null, stolenBases: stat.stolenBases ?? null, hits: stat.hits ?? null, atBats: stat.atBats ?? null, season: split.season };
          player.statsSource = statsURL;
          player.backyardStats = transformToBackyardStats({ id: player.id, stats: stat }).backyardStats;
        }
      } catch (_) { /* Names remain available when only the stats service fails. */ }
      rosterCache = { characters, source: 'mlb', fetchedAt: new Date().toISOString() };
      rosterExpires = Date.now() + 300_000;
      return rosterCache;
    } catch (_) {
      rosterExpires = Date.now() + 30_000;
      return rosterCache ? { ...rosterCache, source: 'cached-mlb' } : {
        characters: snapshotCharacters(),
        source: 'mlb-snapshot',
        fetchedAt: FALLBACK_BATS_ROSTER_DATE
      };
    } finally { rosterRequest = null; }
  })();
  return rosterRequest;
}

/**
 * Fetch schedule of Triple-A games (sportId=11)
 */
export async function getTripleASchedule(date = null) {
  let url = `${MLB_API_BASE}/schedule/games/?sportId=${SPORT_ID_AAA}`;
  if (date) {
    url += `&date=${date}`;
  }
  
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const data = await res.json();
    return data;
  } catch (err) {
    console.warn('Error fetching MLB schedule:', err.message);
    return null;
  }
}

/**
 * Find the Louisville Bats recent or upcoming game from the schedule
 */
export async function getBatsRecentGame() {
  const scheduleData = await getTripleASchedule();
  if (!scheduleData || !scheduleData.dates) return null;

  for (const dateObj of scheduleData.dates) {
    for (const game of dateObj.games) {
      const homeName = game.teams?.home?.team?.name || '';
      const awayName = game.teams?.away?.team?.name || '';
      if (homeName.includes('Louisville') || awayName.includes('Louisville') ||
          homeName.includes('Bats') || awayName.includes('Bats')) {
        return game;
      }
    }
  }
  return null;
}

/**
 * Transform real MLB stats into 1-10 Backyard Baseball kid attributes
 * (Batting, Running Speed, Pitching, Fielding)
 */
export function transformToBackyardStats(player) {
  const stats = player.stats || {};
  const battingAvg = parseFloat(stats.avg || stats.battingAverage || '0.250');
  const homeRuns = parseInt(stats.homeRuns ?? stats.hr ?? '5', 10);
  const stolenBases = parseInt(stats.stolenBases ?? stats.sb ?? '3', 10);
  const fieldingPct = parseFloat(stats.fielding || stats.fieldingPercentage || '0.960');
  const era = parseFloat(stats.era || '4.20');

  // Convert to 1-10 scale (Backyard Baseball style)
  const batting = Math.min(10, Math.max(1, Math.round(battingAvg * 20 + (homeRuns > 10 ? 3 : 1))));
  const running = Math.min(10, Math.max(1, Math.round(stolenBases * 0.5 + 4)));
  const pitching = Math.min(10, Math.max(1, Math.round(11 - (era * 1.2))));
  const fielding = Math.min(10, Math.max(1, Math.round((fieldingPct - 0.90) * 80 + 3)));

  return {
    id: player.id || Math.floor(Math.random() * 10000),
    fullName: player.fullName || player.name || 'Bats Rookie',
    jerseyNumber: player.primaryNumber || '24',
    primaryPosition: player.primaryPosition?.abbreviation || 'OF',
    backyardStats: {
      batting,   // 1 - 10
      running,   // 1 - 10
      pitching,  // 1 - 10
      fielding   // 1 - 10
    },
    rawStats: {
      battingAvg,
      homeRuns,
      stolenBases,
      era,
      fieldingPct
    }
  };
}

/**
 * Fallback authentic Louisville Bats player pool for offline or demo reliability
 */
export const FALLBACK_BATS_ROSTER_DATE = '2026-09-12T00:00:00.000Z';
// Last-known active roster from MLB Stats team 416. Position players lead the
// list so the default draft choice remains a hitter when upstream is offline.
export const FALLBACK_BATS_ROSTER = [
  { id: 802143, fullName: 'Dayne Leonard', jerseyNumber: '20', primaryPosition: 'C' },
  { id: 666150, fullName: 'Dominic Fletcher', jerseyNumber: '18', primaryPosition: 'RF' },
  { id: 694689, fullName: 'Dominic Pitelli', jerseyNumber: '17', primaryPosition: 'SS' },
  { id: 695490, fullName: 'Edwin Arroyo', jerseyNumber: '19', primaryPosition: '2B' },
  { id: 688005, fullName: 'Francisco Urbaez', jerseyNumber: '13', primaryPosition: '2B' },
  { id: 641658, fullName: 'Garrett Hampson', jerseyNumber: '5', primaryPosition: '2B' },
  { id: 699114, fullName: 'Leo Balcazar', jerseyNumber: '3', primaryPosition: 'SS' },
  { id: 664948, fullName: 'Anthony Misiewicz', jerseyNumber: '36', primaryPosition: 'P' },
  { id: 686844, fullName: 'Ben Wereski', jerseyNumber: '45', primaryPosition: 'P' },
  { id: 694650, fullName: 'Cameron Cotter', jerseyNumber: '51', primaryPosition: 'P' },
  { id: 686730, fullName: 'Carson Spiers', jerseyNumber: '53', primaryPosition: 'P' },
  { id: 695534, fullName: 'Chase Petty', jerseyNumber: '14', primaryPosition: 'P' },
  { id: 686678, fullName: 'Chase Solesky', jerseyNumber: '12', primaryPosition: 'P' },
  { id: 683175, fullName: 'Connor Phillips', jerseyNumber: '34', primaryPosition: 'P' },
  { id: 670241, fullName: 'Darius Vines', jerseyNumber: '41', primaryPosition: 'P' },
  { id: 688609, fullName: 'Hunter Parks', jerseyNumber: '49', primaryPosition: 'P' },
  { id: 805723, fullName: 'Jared Lyons', jerseyNumber: '32', primaryPosition: 'P' },
  { id: 683742, fullName: 'Jose Franco', jerseyNumber: '48', primaryPosition: 'P' },
  { id: 687924, fullName: 'Julian Aguiar', jerseyNumber: '39', primaryPosition: 'P' },
  { id: 592288, fullName: 'Kent Emanuel', jerseyNumber: '40', primaryPosition: 'P' },
  { id: 674265, fullName: 'Kevin Abel', jerseyNumber: '37', primaryPosition: 'P' }
];

function snapshotCharacters() {
  return FALLBACK_BATS_ROSTER.map(player => ({
    ...player,
    backyardStats: { batting: 5, running: 5, pitching: 5, fielding: 5 },
    rawStats: { battingAvg: null, homeRuns: null, stolenBases: null },
    source: `${MLB_API_BASE}/people/${player.id}`
  }));
}

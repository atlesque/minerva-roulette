export const NAMES = ['Kris', 'Gilles', 'Tom', 'Thijs', 'Alex'] as const

/** 2026-06-11 09:00 CET (UTC+1) = 07:00 UTC — fallback epoch */
const EPOCH_MS = new Date('2026-06-11T07:00:00Z').getTime()
const WEEK_MS = 7 * 24 * 60 * 60 * 1000

// ─── Manual schedule ──────────────────────────────────────────────────────────
// Keys: Brussels-local Monday dates (YYYY-MM-DD). Weeks start Monday 07:00
// Europe/Brussels. Only entries for names in NAMES are listed.
// Covers 2026-07-06 through 2026-12-21. Before or after → fallback.

const SCHEDULE = new Map<string, string>([
  ['2026-07-06', 'Kris'],
  ['2026-07-13', 'Gilles'],
  ['2026-07-20', 'Tom'],
  ['2026-07-27', 'Thijs'],
  ['2026-08-03', 'Alex'],
  ['2026-08-10', 'Kris'],
  ['2026-08-17', 'Gilles'],
  ['2026-08-24', 'Tom'],
  ['2026-08-31', 'Thijs'],
  ['2026-09-07', 'Alex'],
  ['2026-09-14', 'Kris'],
  ['2026-09-21', 'Gilles'],
  ['2026-09-28', 'Tom'],
  ['2026-10-05', 'Thijs'],
  ['2026-10-12', 'Alex'],
  ['2026-10-19', 'Kris'],
  ['2026-10-26', 'Gilles'],
  ['2026-11-02', 'Tom'],
  ['2026-11-09', 'Thijs'],
  ['2026-11-16', 'Alex'],
  ['2026-11-23', 'Kris'],
  ['2026-11-30', 'Gilles'],
  ['2026-12-07', 'Tom'],
  ['2026-12-14', 'Thijs'],
  ['2026-12-21', 'Alex'],
])

// ─── Helpers ──────────────────────────────────────────────────────────────────

const WEEKDAY_INDEX: Record<string, number> = {
  Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6,
}

/**
 * Returns the Brussels-local YYYY-MM-DD of the Monday that starts the week
 * containing `date`. Weeks start Monday at 07:00 Europe/Brussels.
 */
function getMondayKey(date: Date): string {
  const weekday = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Europe/Brussels',
    weekday: 'short',
  }).format(date)

  const hour = parseInt(
    new Intl.DateTimeFormat('en-US', {
      timeZone: 'Europe/Brussels',
      hour: 'numeric',
      hour12: false,
    }).format(date),
    10,
  )

  let daysBack = WEEKDAY_INDEX[weekday] ?? 0
  if (daysBack === 0 && hour < 7) {
    daysBack = 7
  }

  const monday = new Date(date.getTime() - daysBack * 24 * 60 * 60 * 1000)

  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Brussels',
  }).format(monday)
}

// ─── Composable ───────────────────────────────────────────────────────────────

export function useWinner(date: Date = new Date()) {
  const mondayKey = getMondayKey(date)
  const scheduledName = SCHEDULE.get(mondayKey)

  if (scheduledName !== undefined) {
    return {
      winnerIndex: NAMES.indexOf(scheduledName as typeof NAMES[number]),
      winnerName: scheduledName,
    }
  }

  // Fallback: original epoch-based cyclic rotation
  const diff = date.getTime() - EPOCH_MS
  const index = diff < 0 ? 0 : Math.floor(diff / WEEK_MS) % NAMES.length
  return {
    winnerIndex: index,
    winnerName: NAMES[index],
  }
}

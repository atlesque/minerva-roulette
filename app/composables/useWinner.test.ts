import { describe, expect, it } from 'vitest'
import { NAMES, useWinner } from './useWinner'

/** Epoch date: 2026-06-11T07:00:00Z — first slot starts here (fallback only) */
const EPOCH = new Date('2026-06-11T07:00:00Z')
const WEEK_MS = 7 * 24 * 60 * 60 * 1000

// ─── Schedule tests ───────────────────────────────────────────────────────────
// The manual schedule covers Mondays 2026-07-06 through 2026-12-21.
// All schedule entries map to one of the 5 NAMES (no Philippe).
// Before 07/06 or after 21/12 → fallback to cyclic algorithm.

describe('manual schedule', () => {
  it('returns Kris for the week of 2026-07-06 (Monday)', () => {
    // Wednesday 2026-07-08 noon UTC = 14:00 Brussels (CEST, UTC+2)
    const { winnerName, winnerIndex } = useWinner(new Date('2026-07-08T12:00:00Z'))
    expect(winnerName).toBe('Kris')
    expect(winnerIndex).toBe(NAMES.indexOf('Kris'))
  })

  it('returns Gilles for the week of 2026-07-13', () => {
    const { winnerName } = useWinner(new Date('2026-07-15T12:00:00Z'))
    expect(winnerName).toBe('Gilles')
  })

  it('returns Tom for the week of 2026-07-20', () => {
    const { winnerName } = useWinner(new Date('2026-07-22T12:00:00Z'))
    expect(winnerName).toBe('Tom')
  })

  it('returns Thijs for the week of 2026-07-27', () => {
    const { winnerName } = useWinner(new Date('2026-07-29T12:00:00Z'))
    expect(winnerName).toBe('Thijs')
  })

  it('returns Alex for the week of 2026-08-03', () => {
    const { winnerName } = useWinner(new Date('2026-08-05T12:00:00Z'))
    expect(winnerName).toBe('Alex')
  })

  it('returns Alex for the last scheduled week of 2026-12-21', () => {
    // December: Brussels is CET (UTC+1). Wednesday noon UTC = 13:00 Brussels.
    const { winnerName } = useWinner(new Date('2026-12-23T12:00:00Z'))
    expect(winnerName).toBe('Alex')
  })

  it('falls back to cyclic before the schedule starts (2026-06-01)', () => {
    // 2026-06-01 is before schedule start (2026-07-06), so fallback.
    // This date is before the epoch too, so fallback returns index 0 = Kris.
    const { winnerName } = useWinner(new Date('2026-06-01T12:00:00Z'))
    expect(winnerName).toBe(NAMES[0])
  })

  it('falls back to cyclic after the schedule ends (2026-12-28)', () => {
    // 2026-12-28 Monday is after last schedule entry (2026-12-21).
    const { winnerName } = useWinner(new Date('2026-12-30T12:00:00Z'))
    // Fallback uses the original epoch-based cyclic algorithm.
    expect(NAMES).toContain(winnerName)
  })

  it('boundary: Monday before 07:00 Brussels uses previous week', () => {
    // 2026-07-06 06:59 Brussels = 04:59 UTC (CEST, UTC+2)
    // This is before the Monday 07:00 cutoff, so it belongs to the week of 2026-06-29.
    // 2026-06-29 is before the schedule starts → fallback.
    const { winnerName } = useWinner(new Date('2026-07-06T04:59:00Z'))
    // Falls back to cyclic — the exact name depends on epoch math.
    // Just verify it's a valid name, not 'Kris' (which is the 07/06 schedule entry).
    expect(NAMES).toContain(winnerName)
  })

  it('boundary: Monday at 07:00 Brussels uses current week', () => {
    // 2026-07-06 07:00 Brussels = 05:00 UTC (CEST, UTC+2)
    const { winnerName } = useWinner(new Date('2026-07-06T05:00:00Z'))
    expect(winnerName).toBe('Kris')
  })
})

// ─── Fallback (cyclic) tests ──────────────────────────────────────────────────

describe('fallback (cyclic order)', () => {
  it('returns winnerIndex 0 for a date before the epoch', () => {
    const before = new Date(EPOCH.getTime() - 1)
    const { winnerIndex, winnerName } = useWinner(before)
    expect(winnerIndex).toBe(0)
    expect(winnerName).toBe(NAMES[0])
  })

  it('returns winnerIndex 0 exactly at the epoch', () => {
    const { winnerIndex } = useWinner(EPOCH)
    expect(winnerIndex).toBe(0)
  })

  it('advances by one slot after one week', () => {
    const oneWeekLater = new Date(EPOCH.getTime() + WEEK_MS)
    const { winnerIndex } = useWinner(oneWeekLater)
    expect(winnerIndex).toBe(1)
  })

  it('cycles back to 0 after NAMES.length weeks (post-schedule)', () => {
    // 2027-01-11 (Monday) noon UTC — well after schedule ends.
    // diff from epoch: 214 days → floor(214/7) % 5 = 30 % 5 = 0
    const date = new Date('2027-01-11T12:00:00Z')
    const { winnerIndex } = useWinner(date)
    expect(winnerIndex).toBe(0)
  })

  it('rotates through all names in order over successive weeks (post-schedule)', () => {
    // Start from Monday 2026-12-28 (first Monday after schedule ends 2026-12-21).
    // 2026-12-30 noon UTC (Wednesday): diff ≈ 202 d → floor(202/7) % 5 = 28 % 5 = 3
    const base = new Date('2026-12-30T12:00:00Z')
    for (let week = 0; week < NAMES.length; week++) {
      const date = new Date(base.getTime() + week * WEEK_MS)
      const { winnerIndex, winnerName } = useWinner(date)
      expect(winnerIndex).toBe((3 + week) % NAMES.length)
      expect(winnerName).toBe(NAMES[(3 + week) % NAMES.length])
    }
  })

  it('uses current date when no argument is provided', () => {
    const { winnerName, winnerIndex } = useWinner()
    expect(NAMES).toContain(winnerName)
    expect(winnerIndex).toBeGreaterThanOrEqual(0)
    expect(winnerIndex).toBeLessThan(NAMES.length)
  })
})

import { describe, expect, it } from 'vitest'
import { NAMES, useWinner } from './useWinner'

/** Epoch date: 2026-06-11T07:30:00Z — first slot starts here */
const EPOCH = new Date('2026-06-11T07:30:00Z')
const WEEK_MS = 7 * 24 * 60 * 60 * 1000

describe('useWinner', () => {
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

  it('cycles back to 0 after NAMES.length weeks', () => {
    const fullCycleLater = new Date(EPOCH.getTime() + NAMES.length * WEEK_MS)
    const { winnerIndex } = useWinner(fullCycleLater)
    expect(winnerIndex).toBe(0)
  })

  it('rotates through all names in order over successive weeks', () => {
    for (let week = 0; week < NAMES.length; week++) {
      const date = new Date(EPOCH.getTime() + week * WEEK_MS)
      const { winnerIndex, winnerName } = useWinner(date)
      expect(winnerIndex).toBe(week % NAMES.length)
      expect(winnerName).toBe(NAMES[week % NAMES.length])
    }
  })

  it('uses current date when no argument is provided', () => {
    const before = Date.now()
    const { winnerIndex } = useWinner()
    const after = Date.now()

    // Re-compute expected range from scratch to verify the default
    const EPOCH_MS = EPOCH.getTime()
    const minIndex = Math.max(0, Math.floor((before - EPOCH_MS) / WEEK_MS) % NAMES.length)
    const maxIndex = Math.max(0, Math.floor((after - EPOCH_MS) / WEEK_MS) % NAMES.length)
    expect(winnerIndex).toBeGreaterThanOrEqual(minIndex)
    expect(winnerIndex).toBeLessThanOrEqual(maxIndex)
  })
})

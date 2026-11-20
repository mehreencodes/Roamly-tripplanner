import { describe, expect, it } from 'vitest'
import type { Activity } from '@/types/trip'
import { analyzeDays, type CoordsOf } from './scheduleEngine'

const h = (hours: number, minutes = 0) => hours * 60 + minutes

const act = (
  id: string,
  startMin: number | null,
  durationMin: number,
  placeId: string | null = null,
): Activity => ({ id, placeId, title: id.toUpperCase(), startMin, durationMin })

const none: CoordsOf = () => undefined

// 'a' aur 'b' lagbhag 11.1 km door hain (0.1 degree latitude)
const coords: Record<string, { lat: number; lng: number }> = {
  a: { lat: 0, lng: 0 },
  b: { lat: 0.1, lng: 0 },
}
const withCoords: CoordsOf = (id) => coords[id]

describe('analyzeDays', () => {
  it('finds nothing on a clean day', () => {
    expect(analyzeDays([[act('a', h(9), 60), act('b', h(11), 60)]], none)).toEqual([])
  })
  it('reports the real overlap when one activity sits inside another', () => {
    const [issue] = analyzeDays([[act('a', h(11), 75), act('b', h(11), 60)]], none)
    expect(issue.type).toBe('overlap')
    expect(issue.message).toContain('overlap by 1 h.')
  })
  it('checks by time, not by list order', () => {
    expect(analyzeDays([[act('b', h(11), 60), act('a', h(9), 60)]], none)).toEqual([])
  })

  it('detects an overlap and suggests a later start', () => {
    const [issue, ...rest] = analyzeDays([[act('a', h(9), 120), act('b', h(10), 60)]], none)
    expect(rest).toHaveLength(0)
    expect(issue.type).toBe('overlap')
    expect(issue.severity).toBe('error')
    expect(issue.fix).toMatchObject({ kind: 'shift', activityId: 'b', startMin: h(11, 15) })
  })

  it('flags every activity that overlaps a long one', () => {
    const issues = analyzeDays(
      [[act('a', h(9), 360), act('b', h(10), 60), act('c', h(12), 60)]],
      none,
    )
    expect(issues.filter((i) => i.type === 'overlap')).toHaveLength(2)
  })

  it('flags a gap that is too short for the distance', () => {
    const [issue] = analyzeDays(
      [[act('a', h(9), 60, 'a'), act('b', h(10, 10), 60, 'b')]],
      withCoords,
    )
    expect(issue.type).toBe('tight-gap')
    expect(issue.detail).toContain('straight line')
    expect(issue.fix).toMatchObject({ kind: 'shift', activityId: 'b', startMin: h(10, 30) })
  })

  it('accepts a gap that is long enough for the distance', () => {
    expect(
      analyzeDays([[act('a', h(9), 60, 'a'), act('b', h(11), 60, 'b')]], withCoords),
    ).toEqual([])
  })

  it('flags an overloaded day and proposes the lightest day that has room', () => {
    const day = [act('a', h(9), 240), act('b', h(14), 240), act('c', h(19), 240)]
    const issues = analyzeDays([day, []], none)
    expect(issues).toHaveLength(1)
    expect(issues[0].type).toBe('overloaded')
    expect(issues[0].fix).toMatchObject({ kind: 'move-day', activityId: 'c', toDay: 1 })
  })

  it('still flags an overloaded day when no other day has room', () => {
    const day = [act('a', h(9), 240), act('b', h(14), 240), act('c', h(19), 240)]
    const issues = analyzeDays([day, [act('x', h(9), 400)]], none)
    expect(issues).toHaveLength(1)
    expect(issues[0].fix).toBeUndefined()
  })

  it('reports activities without a start time and offers one', () => {
    const [issue] = analyzeDays([[act('a', null, 60)]], none)
    expect(issue.type).toBe('unscheduled')
    expect(issue.fix).toMatchObject({ kind: 'shift', startMin: h(9) })
  })

  it('keeps keys stable and changes them when the situation changes', () => {
    const first = analyzeDays([[act('a', h(9), 120), act('b', h(10), 60)]], none)[0].key
    const again = analyzeDays([[act('a', h(9), 120), act('b', h(10), 60)]], none)[0].key
    const changed = analyzeDays([[act('a', h(9), 120), act('b', h(9, 30), 60)]], none)[0].key
    expect(again).toBe(first)
    expect(changed).not.toBe(first)
  })
})
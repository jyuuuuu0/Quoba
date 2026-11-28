import { describe, expect, it } from 'vitest'
import { isMyName, resolveSourceId, toCitation, toSearchHit } from './normalize'

describe('resolveSourceId', () => {
  it('uses the datasource alias when it is a Quoba source', () => {
    expect(resolveSourceId('kakaotalk', '/x')).toBe('kakaotalk')
  })

  it('maps an AutoRAG template name to its Quoba source', () => {
    expect(resolveSourceId('kakao', '/x')).toBe('kakaotalk')
    expect(resolveSourceId('mailcrawl', '/x')).toBe('mail')
  })

  it('falls back to the first path segment, then to files', () => {
    expect(resolveSourceId(undefined, '/discord/guild/channel')).toBe('discord')
    expect(resolveSourceId(undefined, '/Users/me/Documents/plan.pdf')).toBe('files')
  })
})

describe('isMyName', () => {
  it('ignores case and spaces', () => {
    expect(isMyName('Dong Key', ['dongkey'])).toBe(true)
    expect(isMyName('지민', ['동키'])).toBe(false)
    expect(isMyName(undefined, ['동키'])).toBe(false)
  })
})

describe('toSearchHit', () => {
  it('reads the modified time AutoRAG stores for local files', () => {
    const hit = toSearchHit(
      {
        id: 'f1',
        content: 'notes',
        source: '/docs/a.md',
        score: 1,
        metadata: { sourceMtimeMs: 1764201600000 }
      },
      []
    )
    expect(hit.time).toBe(new Date(1764201600000).toISOString())
  })

  it('normalizes a Discord message', () => {
    const hit = toSearchHit(
      {
        id: 'discord:main:1',
        content: '  참고문헌 정리도 제가 할게요  ',
        source: '/discord/team/team-4',
        score: 0.8,
        metadata: {
          datasourceId: 'discord',
          authorName: '동키',
          channelName: 'team-4',
          timestamp: '2026-11-22T07:02:00.000Z'
        }
      },
      ['동키']
    )
    expect(hit).toMatchObject({
      sourceId: 'discord',
      author: '동키',
      isMe: true,
      place: 'team-4',
      time: '2026-11-22T07:02:00.000Z',
      text: '참고문헌 정리도 제가 할게요'
    })
  })

  it('reads epoch seconds and uses the file name as the place for local files', () => {
    const hit = toSearchHit(
      {
        id: 'f1',
        content: 'Deadline Nov 27',
        source: '/Users/me/notes/meeting.md',
        score: 1,
        metadata: { date: 1764201600 }
      },
      []
    )
    expect(hit.sourceId).toBe('files')
    expect(hit.place).toBe('meeting.md')
    expect(hit.time).toBe('2025-11-27T00:00:00.000Z')
    expect(hit.isMe).toBe(false)
  })
})

describe('toCitation', () => {
  it('keeps the first excerpt and resolves the source', () => {
    expect(
      toCitation({
        number: 1,
        title: '팀플 4조',
        summary: 'Promised the slides',
        evidence: [{ excerpt: '발표 자료는 제가 만들게요' }],
        source: '/kakaotalk/팀플 4조'
      })
    ).toEqual({
      number: 1,
      title: '팀플 4조',
      summary: 'Promised the slides',
      excerpt: '발표 자료는 제가 만들게요',
      location: '/kakaotalk/팀플 4조',
      sourceId: 'kakaotalk'
    })
  })
})

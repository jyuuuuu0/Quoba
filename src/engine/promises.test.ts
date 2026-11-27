import { describe, expect, it } from 'vitest'
import { extractDue, isPromise } from './promises'

describe('isPromise', () => {
  it.each([
    '발표 자료는 제가 만들게요',
    '참고문헌 정리도 제가 할게요',
    '시연 영상은 제가 찍을게요',
    '내일 일찍 갈게',
    '금요일까지 보내드리겠습니다',
    "I'll send the deck tonight",
    'Leave it to me',
    '資料は明日送ります'
  ])('accepts a commitment: %s', (text) => {
    expect(isPromise(text)).toBe(true)
  })

  it.each([
    '발표 자료 누가 할래?',
    '이거 해줄 수 있어? 해줘',
    'Can you send the deck?',
    'Who will book the room?',
    '誰がやりますか',
    '좋아요',
    '그렇게 해요',
    '쉽게 끝났네'
  ])('rejects a question or request: %s', (text) => {
    expect(isPromise(text)).toBe(false)
  })
})

describe('extractDue', () => {
  // Friday, Nov 20 2026, 21:14 local time.
  const saidAt = new Date(2026, 10, 20, 21, 14)

  it('reads relative days', () => {
    expect(extractDue('내일까지 할게요', saidAt)?.getDate()).toBe(21)
    expect(extractDue("I'll do it today", saidAt)?.getDate()).toBe(20)
  })

  it('reads the next weekday, a week ahead when it is today', () => {
    expect(extractDue('월요일까지 보낼게', saidAt)?.getDate()).toBe(23)
    expect(extractDue('금요일까지 보낼게', saidAt)?.getDate()).toBe(27)
  })

  it('reads written dates in each language', () => {
    expect(extractDue('11월 27일까지 할게요', saidAt)?.getDate()).toBe(27)
    expect(extractDue("I'll send it by Nov 27", saidAt)?.getDate()).toBe(27)
    expect(extractDue('11月27日に送ります', saidAt)?.getDate()).toBe(27)
  })

  it('rolls a date in early next year forward', () => {
    const december = new Date(2026, 11, 20)
    expect(extractDue('1/5까지 할게', december)?.getFullYear()).toBe(2027)
  })

  it('returns nothing when no deadline is mentioned', () => {
    expect(extractDue('제가 할게요', saidAt)).toBeUndefined()
  })
})

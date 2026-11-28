/**
 * Finds promises the user made ("제가 할게요", "I'll send it", "やっておきます") in their own messages
 * and the deadline they mentioned. Rules only, so it works without signing in.
 */

/** Phrases that commit the speaker to doing something, per language. */
const COMMITMENTS = [
  // Korean: 할게(요), 하겠습니다, 보낼게, 드릴게, 맡을게, 해둘게 …
  /(할게|할께|하겠|해\s?둘게|해\s?놓을게|볼게|보낼게|드릴게|드리겠|맡을게|맡겠|가져갈게|만들게|정리할게|올릴게|챙길게|알아볼게|준비할게|예약할게|연락할게|확인할게|처리할게)/,
  // English
  /\b(i'?ll|i will|i'?m going to|let me|i can (?:do|take|send|handle|make)|i'?ll take care|leave it to me|on it)\b/i,
  // Japanese: します, やります, 送ります, しておきます, 担当します …
  /(します|やります|送ります|しておきます|やっておきます|やっておく|担当します|対応します|準備します|確認します|連絡します)/
]

/** Questions and offers to others are not commitments. */
const NOT_COMMITMENTS = [
  /[?？]\s*$/,
  /(할까|할래|해줄래|해 줄래|해줘|해 줘|해주세요|해 주세요|할 사람|누가)/,
  /\b(can you|could you|will you|would you|shall we|who will)\b/i,
  /(しますか|しましょうか|お願いします|誰が)/
]

const HANGUL_BASE = 0xac00
const JONGSEONG_RIEUL = 8

/**
 * Korean future-intent endings on any verb: 찍을게요, 갈게, 만들게요. The syllable before 게 is 을
 * or ends in ㄹ, which leaves out adverbs such as 그렇게 or 쉽게. The ending must also close the
 * clause, which leaves out 길게 이어졌어요 or 알게 됐어요 where 게 is followed by another word.
 */
const INTENT_ENDING = /([가-힣])게(요)?(?=\s*(?:$|[.!~…,;()\]ㅋㅎㅠㅜ^]|\p{Extended_Pictographic}))/gu

function hasKoreanIntentEnding(sentence: string): boolean {
  for (const match of sentence.matchAll(INTENT_ENDING)) {
    const syllable = match[1]!
    if (syllable === '을') return true
    const code = syllable.charCodeAt(0) - HANGUL_BASE
    if (code >= 0 && code % 28 === JONGSEONG_RIEUL) return true
  }
  return false
}

export function isPromise(text: string): boolean {
  const sentence = text.trim()
  if (sentence.length < 3 || sentence.length > 400) return false
  if (NOT_COMMITMENTS.some((pattern) => pattern.test(sentence))) return false
  return hasKoreanIntentEnding(sentence) || COMMITMENTS.some((pattern) => pattern.test(sentence))
}

const WEEKDAYS: [RegExp, number][] = [
  [/일요일|sunday|日曜/i, 0],
  [/월요일|monday|月曜/i, 1],
  [/화요일|tuesday|火曜/i, 2],
  [/수요일|wednesday|水曜/i, 3],
  [/목요일|thursday|木曜/i, 4],
  [/금요일|friday|金曜/i, 5],
  [/토요일|saturday|土曜/i, 6]
]

function atEndOfDay(date: Date): Date {
  const end = new Date(date)
  end.setHours(23, 59, 0, 0)
  return end
}

/** The deadline mentioned in a promise, relative to when it was said. */
export function extractDue(text: string, saidAt: Date): Date | undefined {
  const day = (offset: number): Date => {
    const date = new Date(saidAt)
    date.setDate(date.getDate() + offset)
    return atEndOfDay(date)
  }

  if (/오늘|today|今日/i.test(text)) return day(0)
  if (/모레|day after tomorrow|明後日/i.test(text)) return day(2)
  if (/내일|tomorrow|明日/i.test(text)) return day(1)
  if (/다음\s?주|next week|来週/i.test(text)) {
    // "Next week Monday" means that weekday in the following calendar week (weeks start on Monday).
    const weekday = WEEKDAYS.find(([pattern]) => pattern.test(text))?.[1]
    if (weekday === undefined) return day(7)
    const toNextMonday = (8 - saidAt.getDay()) % 7 || 7
    return day(toNextMonday + ((weekday + 6) % 7))
  }

  // 11월 27일, 11/27, 11月27日, Nov 27
  const numeric = text.match(/(\d{1,2})\s?(?:월|\/|月)\s?(\d{1,2})\s?(?:일|日)?/)
  const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']
  const english = text.match(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+(\d{1,2})\b/i)
  const month = numeric ? Number(numeric[1]) - 1 : english ? months.indexOf(english[1]!.toLowerCase()) : -1
  const date = numeric ? Number(numeric[2]) : english ? Number(english[2]) : 0
  if (month >= 0 && month < 12 && date >= 1 && date <= 31) {
    const due = atEndOfDay(new Date(saidAt.getFullYear(), month, date))
    // "1/5" said in December means next January.
    if (due.getTime() < saidAt.getTime() - 86_400_000 * 30) due.setFullYear(due.getFullYear() + 1)
    return due
  }

  for (const [pattern, weekday] of WEEKDAYS) {
    if (pattern.test(text)) {
      const ahead = (weekday - saidAt.getDay() + 7) % 7
      return day(ahead === 0 ? 7 : ahead)
    }
  }
  return undefined
}

/** Searches run to collect candidate promises; results are then filtered by speaker and rules. */
export const PROMISE_QUERIES = [
  '제가 할게요',
  '내가 할게',
  '보내드릴게요',
  '제가 맡을게요',
  '정리해서 올릴게',
  "I'll send it",
  "I'll take care of it",
  'I will do it',
  'やっておきます',
  '送ります'
]

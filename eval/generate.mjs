// Builds a synthetic, fully labelled test set: four teammates chatting for three months.
// Every fact and promise is planted on purpose, so each question has a known answer and source line.
//
//   node eval/generate.mjs        → eval/data/{chats/*.txt, questions.json, promises.json}
import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const out = join(import.meta.dirname, 'data')
const ME = '동키'
const PEOPLE = [ME, '지민', '서연', '도윤']
const ROOMS = ['팀플 4조', '동아리 운영진', '스터디 모임']

// Deterministic random numbers so the set is identical on every run.
let seed = 20261128
function random() {
  seed = (seed * 1103515245 + 12345) % 2147483648
  return seed / 2147483648
}
const pick = (list) => list[Math.floor(random() * list.length)]

const TASKS = [
  ['발표 자료', '만들'],
  ['대본', '쓸'],
  ['참고문헌', '정리할'],
  ['회의록', '올릴'],
  ['장소 예약', '할'],
  ['설문지', '돌릴'],
  ['예산표', '정리할'],
  ['포스터', '만들'],
  ['시연 영상', '찍을'],
  ['데모 서버', '띄울']
]
const PLACES = ['도서관 3층', '본관 204호', '카페 루트', '창업센터 세미나실', '온라인 디스코드']
const ITEMS = ['노트북 충전기', 'HDMI 케이블', '빔 프로젝터', '보조배터리', '연장선']
const CHATTER = [
  'ㅋㅋㅋㅋ 오늘 진짜 피곤하다',
  '다들 밥 먹었어?',
  '오케이 확인했어',
  '내일 비 온대요',
  '좋아요 좋아요',
  '그거 링크 다시 보내줄 수 있어?',
  '이번 주 너무 바쁘다',
  '고생했어요 다들',
  '혹시 이거 누가 할래?',
  '회의 몇 시였지?'
]

const messages = []
let clock = new Date(2026, 8, 1, 9, 0).getTime()

function say(room, author, text) {
  clock += Math.floor(20 + random() * 400) * 60_000
  const message = { id: `m${messages.length + 1}`, room, author, time: new Date(clock), text }
  messages.push(message)
  return message
}

function dateWords(date) {
  return `${date.getMonth() + 1}월 ${date.getDate()}일`
}

const questions = []
const promises = []

// 1) Owners: who said they'd do a task. Half are the user, so they double as promises.
for (let index = 0; index < 40; index += 1) {
  const room = ROOMS[index % ROOMS.length]
  const [task, verb] = TASKS[index % TASKS.length]
  const owner = index % 2 === 0 ? ME : PEOPLE[1 + (index % 3)]
  say(room, pick(PEOPLE.filter((person) => person !== owner)), `${task} 누가 할래?`)
  const due = new Date(clock + (2 + (index % 9)) * 86_400_000)
  const message = say(room, owner, `${task}는 제가 ${dateWords(due)}까지 ${verb}게요 (${index + 1}차)`)
  questions.push({
    id: `owner-${index + 1}`,
    question: `${index + 1}차 ${task}는 누가 하기로 했어?`,
    gold: [message.id],
    answerKeywords: [owner === ME ? '나' : owner, owner],
    saidByMe: owner === ME
  })
  if (owner === ME)
    promises.push({ messageId: message.id, text: message.text, isPromise: true, due: due.toISOString() })
  if (random() < 0.5) say(room, pick(PEOPLE), pick(CHATTER))
}

// 2) Places and times of meetings.
for (let index = 0; index < 30; index += 1) {
  const room = ROOMS[index % ROOMS.length]
  const place = PLACES[index % PLACES.length]
  const when = new Date(clock + (1 + (index % 5)) * 86_400_000)
  const message = say(room, pick(PEOPLE), `${index + 1}번째 정기 회의는 ${dateWords(when)} ${place}에서 해요`)
  questions.push({
    id: `meeting-${index + 1}`,
    question: `${index + 1}번째 정기 회의 장소가 어디였지?`,
    gold: [message.id],
    answerKeywords: [place]
  })
  say(room, pick(PEOPLE), pick(CHATTER))
}

// 3) Who brings which item.
for (let index = 0; index < 30; index += 1) {
  const room = ROOMS[index % ROOMS.length]
  const item = ITEMS[index % ITEMS.length]
  const owner = PEOPLE[index % PEOPLE.length]
  const message = say(room, owner, `${index + 1}회차 행사 때 ${item}은 제가 가져갈게요`)
  questions.push({
    id: `item-${index + 1}`,
    question: `${index + 1}회차 행사에 ${item} 누가 가져오기로 했어?`,
    gold: [message.id],
    answerKeywords: [owner === ME ? '나' : owner, owner],
    saidByMe: owner === ME
  })
  if (owner === ME) promises.push({ messageId: message.id, text: message.text, isPromise: true })
}

// 4) Questions with no answer in the data: the right reply is "not found".
const UNANSWERABLE = [
  '졸업 작품 전시회 날짜가 언제야?',
  '해커톤 상금은 얼마였어?',
  '교수님 연구실 호수가 몇 호야?',
  '중간고사 범위 어디까지라고 했지?',
  '동아리 회비는 얼마로 정했어?',
  '여름 MT 장소 어디로 했어?',
  '서버 비밀번호 바꾼 사람 누구야?',
  '포트폴리오 마감이 언제였지?',
  '봉사 시간 몇 시간 채워야 해?',
  '수학여행 출발 시간이 몇 시야?',
  '팀 이름 최종으로 뭐로 정했어?',
  '로고 시안 몇 개 받았어?',
  '프린터 토너는 누가 사기로 했어?',
  '기숙사 점호 시간이 바뀌었어?',
  '체육대회 반 티셔츠 색은 뭐야?',
  '공모전 1차 결과 발표일이 언제야?',
  '면접 복장 정장이야?',
  '멘토링 신청 마감이 언제야?',
  '도서관 휴관일이 언제야?',
  '축제 부스 위치가 어디야?'
]
UNANSWERABLE.forEach((question, index) =>
  questions.push({ id: `none-${index + 1}`, question, gold: [], answerKeywords: [], unanswerable: true })
)

// 5) Hard negatives for promise detection: things the user says that are not promises.
const NOT_PROMISES = [
  '이거 누가 할래?',
  '발표 자료 해줄 수 있어?',
  '회의록 올려줘',
  '내일 할까?',
  '다들 할 수 있어?',
  '나 이번 주 바빠서 못 할 것 같아',
  '그건 서연이가 한다고 했잖아',
  '좋아요 그렇게 해요',
  '확인했어요',
  '혹시 장소 예약 누가 하기로 했지?'
]
for (const text of NOT_PROMISES) {
  const message = say(pick(ROOMS), ME, text)
  promises.push({ messageId: message.id, text, isPromise: false })
}

// Write one KakaoTalk-style export per room.
rmSync(out, { recursive: true, force: true })
mkdirSync(join(out, 'chats'), { recursive: true })
for (const room of ROOMS) {
  const lines = [`${room} 님과 카카오톡 대화`, '']
  for (const message of messages.filter((item) => item.room === room)) {
    const t = message.time
    const hour = t.getHours()
    const stamp = `${t.getFullYear()}. ${t.getMonth() + 1}. ${t.getDate()}. ${hour < 12 ? '오전' : '오후'} ${hour % 12 || 12}:${String(t.getMinutes()).padStart(2, '0')}`
    lines.push(`${stamp}, ${message.author} : ${message.text}`)
  }
  writeFileSync(join(out, 'chats', `${room}.txt`), `${lines.join('\n')}\n`)
}
writeFileSync(
  join(out, 'messages.json'),
  JSON.stringify(
    messages.map((m) => ({ ...m, time: m.time.toISOString() })),
    null,
    2
  )
)
writeFileSync(join(out, 'questions.json'), JSON.stringify(questions, null, 2))
writeFileSync(join(out, 'promises.json'), JSON.stringify(promises, null, 2))

const answerable = questions.filter((question) => !question.unanswerable).length
console.log(
  `${messages.length} messages, ${answerable} answerable + ${UNANSWERABLE.length} unanswerable questions, ` +
    `${promises.filter((p) => p.isPromise).length} promises + ${NOT_PROMISES.length} non-promises → ${out}`
)

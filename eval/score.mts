// Scores Quoba against the synthetic set from eval/generate.mjs and prints the numbers the plan targets.
//
//   node eval/score.mts              promise rules + retrieval (no sign-in needed)
//   node eval/score.mts --answers    also AI answers (needs a Dazzi sign-in)
//
// Requires Node.js 24 (runs TypeScript directly) and `npm install`.
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { extractDue, isPromise } from '../src/engine/promises.ts'

interface Message {
  id: string
  room: string
  author: string
  time: string
  text: string
}
interface Question {
  id: string
  question: string
  gold: string[]
  answerKeywords: string[]
  unanswerable?: boolean
}
interface PromiseLabel {
  messageId: string
  text: string
  isPromise: boolean
  due?: string
}

const root = import.meta.dirname
const data = join(root, 'data')
const read = <T,>(file: string): T => JSON.parse(readFileSync(join(data, file), 'utf8')) as T
const messages = read<Message[]>('messages.json')
const questions = read<Question[]>('questions.json')
const labels = read<PromiseLabel[]>('promises.json')
const byId = new Map(messages.map((message) => [message.id, message]))
const percent = (value: number): string => `${(value * 100).toFixed(1)}%`
const median = (values: number[]): number =>
  [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)] ?? 0

const report: Record<string, string | number> = {}

// 1) Promises: rules only, over every message the user wrote.
{
  const mine = messages.filter((message) => message.author === '동키')
  const truth = new Map(labels.map((label) => [label.messageId, label]))
  let truePositive = 0
  let falsePositive = 0
  let dueCorrect = 0
  let dueTotal = 0
  for (const message of mine) {
    const predicted = isPromise(message.text)
    const label = truth.get(message.id)
    if (predicted && label?.isPromise) truePositive += 1
    if (predicted && !label?.isPromise) falsePositive += 1
    if (label?.isPromise && label.due) {
      dueTotal += 1
      const due = extractDue(message.text, new Date(message.time))
      if (due && due.toDateString() === new Date(label.due).toDateString()) dueCorrect += 1
    }
  }
  const positives = labels.filter((label) => label.isPromise).length
  report['Promise recall'] = percent(truePositive / positives)
  report['Promise precision'] = percent(truePositive / Math.max(1, truePositive + falsePositive))
  report['Promise due date accuracy'] = percent(dueCorrect / Math.max(1, dueTotal))
}

// 2) Retrieval with AutoRAG Lite (no model): is the gold message in the top 5?
const lib = { ...(await import('@autorag/librarian/core')), ...(await import('@autorag/librarian')) }
const home = join(root, '.autorag')
rmSync(home, { recursive: true, force: true })
mkdirSync(home, { recursive: true })
const env = { ...process.env, AUTORAG_HOME: home }
lib.writeDefaultConfig(join(home, 'config.json'), { searchPaths: [join(data, 'chats')] }, { env, cwd: home })
const lite = lib.createAutoRAGLite({ env, cwd: home })
console.log('Indexing the test chats…')
await lite.refresh(true)

const answerable = questions.filter((question) => !question.unanswerable)
let found = 0
let reciprocal = 0
const latencies: number[] = []
const misses: string[] = []
for (const question of answerable) {
  const started = performance.now()
  const { results } = await lite.retrieve(question.question, { topK: 5 })
  latencies.push(performance.now() - started)
  const goldTexts = question.gold.map((id) => byId.get(id)!.text)
  const rank = results.findIndex((result) => goldTexts.some((text) => result.content.includes(text)))
  if (rank >= 0) {
    found += 1
    reciprocal += 1 / (rank + 1)
  } else misses.push(question.id)
}
report['Retrieval recall@5'] = percent(found / answerable.length)
report['Retrieval MRR'] = (reciprocal / answerable.length).toFixed(3)
report['Search latency (median)'] = `${Math.round(median(latencies))} ms`

// 3) Optional: AI answers through the full librarian agent.
/** Phrases an answer uses to say the documents do not contain the answer. */
const NOT_FOUND =
  /찾지 못|찾을 수 없|확인되지 않|확인할 수 없|정보가 없|내용이 없|언급(?:이|된 내용이) 없|not found|couldn'?t find|could not find|no (?:information|mention|record)|見つかりません|見つけられ/i
if (process.argv.includes('--answers')) {
  const config = lib.resolveConfig({ flags: {}, env, cwd: home })
  const model = await lib.resolveAgentModel(config, { env, cwd: home })
  const agent = new lib.AutoRAGAgent({
    ...lib.buildAgentOptions(config),
    model: model.model,
    ...(model.apiKey ? { apiKey: model.apiKey } : {}),
    ...(model.providerApiKeys ? { providerApiKeys: model.providerApiKeys } : {})
  })
  let correct = 0
  let honest = 0
  const answerLatencies: number[] = []
  for (const question of questions) {
    const started = performance.now()
    const response = await agent.searchDocuments(question.question)
    answerLatencies.push(performance.now() - started)
    if (question.unanswerable) {
      // Judge the answer text, not citations: an uncited guess is still a guess.
      if (NOT_FOUND.test(response.answer)) honest += 1
    } else if (question.answerKeywords.some((keyword) => response.answer.includes(keyword))) {
      correct += 1
    }
  }
  report['Answer accuracy'] = percent(correct / answerable.length)
  report['"Not found" on unanswerable'] = percent(honest / (questions.length - answerable.length))
  report['Answer latency (median)'] = `${Math.round(median(answerLatencies) / 100) / 10} s`
}

console.table(report)
mkdirSync(join(root, 'results'), { recursive: true })
const file = join(root, 'results', `${new Date().toISOString().replace(/[:.]/g, '-')}.json`)
writeFileSync(file, JSON.stringify({ report, retrievalMisses: misses }, null, 2))
console.log(`Saved ${file}`)

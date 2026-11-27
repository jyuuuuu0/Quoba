import type { AnswerCitation, SearchHit } from '@shared/engine'
import { isSourceId, SOURCES, type SourceId } from '@shared/sources'

/** The subset of AutoRAG's RetrievalResult that Quoba reads. */
export interface RawResult {
  id: string
  content: string
  source: string
  score: number
  metadata: Record<string, unknown>
}

const AUTHOR_KEYS = ['authorName', 'author', 'senderName', 'sender', 'from', 'userName', 'user', 'speaker']
const TIME_KEYS = ['publishedAt', 'timestamp', 'sentAt', 'date', 'createdAt', 'time', 'updatedAt']
const PLACE_KEYS = [
  'channelName',
  'chatName',
  'roomName',
  'chatTitle',
  'conversation',
  'subject',
  'title',
  'guildName'
]

function pickString(metadata: Record<string, unknown>, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = metadata[key]
    if (typeof value === 'string' && value.trim() !== '') return value.trim()
    if (value && typeof value === 'object' && 'name' in value && typeof value.name === 'string')
      return value.name
  }
  return undefined
}

function pickTime(metadata: Record<string, unknown>): string | undefined {
  for (const key of TIME_KEYS) {
    const value = metadata[key]
    if (typeof value !== 'string' && typeof value !== 'number') continue
    // Epoch seconds are much smaller than epoch milliseconds.
    const ms = typeof value === 'number' && value < 1e12 ? value * 1000 : value
    const date = new Date(ms)
    if (!Number.isNaN(date.getTime())) return date.toISOString()
  }
  return undefined
}

/** Maps an AutoRAG datasource id, template name or virtual path to a Quoba source. */
export function resolveSourceId(datasourceId: unknown, location: string): SourceId {
  if (typeof datasourceId === 'string') {
    if (isSourceId(datasourceId)) return datasourceId
    const byTemplate = SOURCES.find((source) => source.template === datasourceId)
    if (byTemplate) return byTemplate.id
  }
  const firstSegment = location.replace(/^[/\\]+/, '').split(/[/\\:]/)[0] ?? ''
  if (isSourceId(firstSegment)) return firstSegment
  const byTemplate = SOURCES.find((source) => source.template === firstSegment)
  return byTemplate?.id ?? 'files'
}

function fileName(location: string): string {
  const parts = location.split(/[/\\]/).filter(Boolean)
  return parts.at(-1) ?? location
}

/** Lower-cases and strips spaces so "Dong Key" and "dongkey" match. */
function normalizeName(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '')
}

export function isMyName(author: string | undefined, myNames: readonly string[]): boolean {
  if (!author) return false
  const normalized = normalizeName(author)
  return myNames.some((name) => name.trim() !== '' && normalizeName(name) === normalized)
}

export function toSearchHit(result: RawResult, myNames: readonly string[]): SearchHit {
  const { metadata } = result
  const sourceId = resolveSourceId(metadata['datasourceId'], result.source)
  const author = pickString(metadata, AUTHOR_KEYS)
  const self = metadata['isMine'] === true || metadata['fromMe'] === true || metadata['outgoing'] === true
  return {
    id: result.id,
    sourceId,
    place: pickString(metadata, PLACE_KEYS) ?? (sourceId === 'files' ? fileName(result.source) : undefined),
    author,
    isMe: self || isMyName(author, myNames),
    time: pickTime(metadata),
    text: result.content.trim(),
    location: result.source,
    score: result.score
  }
}

/** The subset of AutoRAG's SearchDocumentResult that Quoba reads. */
export interface RawAnswerResult {
  number: number
  title: string
  summary: string
  evidence: readonly { excerpt: string }[]
  source?: string
}

export function toCitation(result: RawAnswerResult): AnswerCitation {
  return {
    number: result.number,
    title: result.title,
    summary: result.summary,
    excerpt: result.evidence[0]?.excerpt,
    location: result.source,
    sourceId: result.source ? resolveSourceId(undefined, result.source) : undefined
  }
}

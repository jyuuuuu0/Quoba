import type { SourceId } from './sources'

/** What the user narrows a search to. Every field is optional: empty means everything. */
export interface SearchFilters {
  sources?: SourceId[]
  /** ISO date, inclusive. */
  since?: string
  /** ISO date, exclusive. */
  until?: string
  /** Only messages the user wrote. */
  saidByMe?: boolean
}

export interface SearchRequest {
  query: string
  filters?: SearchFilters
  limit?: number
}

/** One message, note or file passage, normalized across every source. */
export interface SearchHit {
  id: string
  sourceId: SourceId
  /** Chat room, channel, mail subject, note or file name. */
  place?: string
  /** Who wrote it, as the source reports it. */
  author?: string
  /** True when the author matches one of the user's names. */
  isMe: boolean
  /** ISO timestamp, when the source has one. */
  time?: string
  text: string
  /** Opaque location AutoRAG uses for this hit. Never a raw path shown to others. */
  location: string
  score: number
}

export interface SearchResponse {
  query: string
  hits: SearchHit[]
  /** Sources that did not run for this query, so results may be partial. */
  unsearched: string[]
  /** True when the index is older than the sources. */
  stale: boolean
}

export interface AnswerCitation {
  number: number
  title: string
  summary: string
  excerpt?: string
  location?: string
  sourceId?: SourceId
}

export type AnswerEvent =
  | { type: 'progress'; text: string }
  | { type: 'preliminary'; answer: string; citations: AnswerCitation[] }
  | { type: 'complete'; answer: string; citations: AnswerCitation[] }
  | { type: 'error'; code: AnswerErrorCode; message: string }

export type AnswerErrorCode = 'signed-out' | 'model-unavailable' | 'network' | 'unknown'

export interface IndexProgress {
  phase: string
  processed: number
  total: number
}

export interface EngineStatus {
  state: 'starting' | 'ready' | 'indexing' | 'error'
  lastIndexedAt?: string
  progress?: IndexProgress
  error?: string
}

export interface AuthStatus {
  signedIn: boolean
  email?: string
  provider: 'dazzi'
}

/** Result of checking whether a source can be connected on this computer. */
export interface SourceProbe {
  id: SourceId
  state: 'ready' | 'connected' | 'missing-tool' | 'needs-setup' | 'error'
  /** What the user has to do next, in plain words from AutoRAG. */
  detail?: string
}

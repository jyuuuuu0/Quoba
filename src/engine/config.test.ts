import { describe, expect, it } from 'vitest'
import { defaultSettings } from '@shared/settings'
import { buildDatasources, buildProbeDatasources, buildSearchPaths } from './config'

describe('buildDatasources', () => {
  it('writes only enabled, fully configured sources with their AutoRAG template', () => {
    const settings = defaultSettings('en')
    settings.sources = {
      kakaotalk: { enabled: true, description: 'Team chats' },
      discord: { enabled: false },
      obsidian: { enabled: true },
      github: { enabled: true, repos: ['jyuuuuu0/quoba'] },
      rss: { enabled: true, feeds: ['https://example.com/feed.xml'] },
      mail: { enabled: true, account: 'personal' }
    }
    expect(buildDatasources(settings)).toEqual({
      kakaotalk: { type: 'kakao', description: 'Team chats' },
      github: { type: 'github', connector: { repos: ['jyuuuuu0/quoba'], tokenEnv: 'GITHUB_TOKEN' } },
      rss: { type: 'rss', connector: { feeds: [{ url: 'https://example.com/feed.xml' }] } },
      mail: {
        type: 'mailcrawl',
        connector: { account: 'personal', mailbox: 'INBOX', binaryPath: 'mailcrawl' }
      }
    })
  })

  it('never puts a token value in the config', () => {
    const settings = defaultSettings('en')
    settings.sources = { github: { enabled: true, repos: ['a/b'] } }
    expect(JSON.stringify(buildDatasources(settings))).not.toMatch(/ghp_|github_pat_/)
  })
})

describe('buildSearchPaths', () => {
  it('returns unique folders only when local files are enabled', () => {
    const settings = defaultSettings('en')
    settings.sources = { files: { enabled: true, paths: ['/docs', '/docs', '/work'] } }
    expect(buildSearchPaths(settings)).toEqual(['/docs', '/work'])
    settings.sources = { files: { enabled: false, paths: ['/docs'] } }
    expect(buildSearchPaths(settings)).toEqual([])
  })
})

describe('buildProbeDatasources', () => {
  it('lists every CLI-backed source', () => {
    expect(Object.keys(buildProbeDatasources())).toEqual(
      expect.arrayContaining(['kakaotalk', 'discord', 'slack', 'telegram', 'whatsapp', 'mail', 'notion'])
    )
  })
})

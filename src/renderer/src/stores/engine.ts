import { create } from 'zustand'
import type { AuthStatus, EngineStatus } from '@shared/engine'
import { api } from '@/lib/api'

interface EngineState {
  status: EngineStatus
  auth: AuthStatus
  signingIn: boolean
  load: () => Promise<void>
  refresh: (force?: boolean) => Promise<void>
  signIn: () => Promise<void>
  cancelSignIn: () => Promise<void>
  signOut: () => Promise<void>
}

// Bumped by every `engine:status` event, so a snapshot fetched earlier cannot overwrite it.
let statusVersion = 0
// Only the latest sign-in attempt may clear `signingIn`.
let signInAttempt = 0

export const useEngine = create<EngineState>((set) => ({
  status: { state: 'starting' },
  auth: { provider: 'dazzi', signedIn: false },
  signingIn: false,
  load: async () => {
    const version = statusVersion
    await Promise.all([
      api.invoke('engine:status').then((status) => {
        if (version === statusVersion) set({ status })
      }),
      api.invoke('auth:status').then((auth) => set({ auth }))
    ])
  },
  refresh: async (force) => {
    set({ status: await api.invoke('engine:refresh', { force }) })
  },
  signIn: async () => {
    const attempt = ++signInAttempt
    set({ signingIn: true })
    try {
      set({ auth: await api.invoke('auth:login') })
    } finally {
      if (attempt === signInAttempt) set({ signingIn: false })
    }
  },
  cancelSignIn: async () => {
    signInAttempt++
    try {
      await api.invoke('auth:cancel')
    } finally {
      // The attempt counter already moved on, so nothing else would clear the flag.
      set({ signingIn: false })
    }
  },
  signOut: async () => {
    set({ auth: await api.invoke('auth:logout') })
  }
}))

api.on('engine:status', (status) => {
  statusVersion++
  useEngine.setState({ status })
})

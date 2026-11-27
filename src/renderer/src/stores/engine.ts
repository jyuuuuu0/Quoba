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

export const useEngine = create<EngineState>((set) => ({
  status: { state: 'starting' },
  auth: { provider: 'dazzi', signedIn: false },
  signingIn: false,
  load: async () => {
    const [status, auth] = await Promise.all([api.invoke('engine:status'), api.invoke('auth:status')])
    set({ status, auth })
  },
  refresh: async (force) => {
    set({ status: await api.invoke('engine:refresh', { force }) })
  },
  signIn: async () => {
    set({ signingIn: true })
    try {
      set({ auth: await api.invoke('auth:login') })
    } finally {
      set({ signingIn: false })
    }
  },
  cancelSignIn: async () => {
    await api.invoke('auth:cancel')
    set({ signingIn: false })
  },
  signOut: async () => {
    set({ auth: await api.invoke('auth:logout') })
  }
}))

api.on('engine:status', (status) => useEngine.setState({ status }))

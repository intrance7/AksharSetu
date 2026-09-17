import { create } from 'zustand'

export type IntroState = 'playing' | 'text-reveal' | 'done'

interface IntroStore {
  introState: IntroState
  setIntroState: (state: IntroState) => void
  introPlayed: boolean
  setIntroPlayed: (played: boolean) => void
}

export const useIntroStore = create<IntroStore>((set) => ({
  introState: 'playing', // Starts in playing state
  setIntroState: (state) => set({ introState: state }),
  introPlayed: false,
  setIntroPlayed: (played) => set({ introPlayed: played })
}))

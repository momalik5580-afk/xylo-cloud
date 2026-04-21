import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { UserRole, getPermissions, Permissions } from '@/lib/roles'

export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  avatar?: string
  role: UserRole
  departmentId?: string
  departmentCode?: string
  departmentName?: string
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  permissions: Permissions | null
  setAuth: (user: User, token: string) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      permissions: null,
      setAuth: (user, token) =>
        set({
          user,
          token,
          isAuthenticated: true,
          permissions: getPermissions(user.role),
        }),
      logout: () =>
        set({ user: null, token: null, isAuthenticated: false, permissions: null }),
    }),
    { name: 'xylo-auth-storage' }
  )
)

// ── License store ────────────────────────────
interface LicenseState {
  isActivated: boolean
  hotelName: string | null
  plan: string | null
  activateLicense: (hotelName: string, plan: string) => void
  deactivate: () => void
}

export const useLicenseStore = create<LicenseState>()(
  persist(
    (set) => ({
      isActivated: false,
      hotelName: null,
      plan: null,
      activateLicense: (hotelName, plan) =>
        set({ isActivated: true, hotelName, plan }),
      deactivate: () =>
        set({ isActivated: false, hotelName: null, plan: null }),
    }),
    { name: 'xylo-license-storage' }
  )
)

// ── Channel store (optimistic UI) ───────────
export interface ChannelMessage {
  id: string
  senderId: string
  senderName: string
  senderDept: string
  senderRole: string
  targetDept?: string | null   // null = broadcast to all
  type: 'message' | 'request' | 'urgent' | 'broadcast'
  content: string
  status: 'pending' | 'acknowledged' | 'done'
  createdAt: string
}

interface ChannelState {
  messages: ChannelMessage[]
  unread: number
  addMessage: (msg: ChannelMessage) => void
  setMessages: (msgs: ChannelMessage[] | ((prev: ChannelMessage[]) => ChannelMessage[])) => void
  markRead: () => void
  updateStatus: (id: string, status: ChannelMessage['status']) => void
}

export const useChannelStore = create<ChannelState>()((set) => ({
  messages: [],
  unread: 0,
  addMessage: (msg) =>
    set((s) => ({ messages: [...s.messages, msg], unread: s.unread + 1 })),
  setMessages: (msgs) => set((s) => ({
    messages: typeof msgs === 'function' ? (msgs as any)(s.messages) : msgs
  })),
  markRead: () => set({ unread: 0 }),
  updateStatus: (id, status) =>
    set((s) => ({
      messages: s.messages.map((m) => (m.id === id ? { ...m, status } : m)),
    })),
}))
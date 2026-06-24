export interface Player {
  jerseyNumber: string
  name: string
  tagLine: string
  createdAt?: number
  updatedAt?: number
}

export interface AuthUser {
  email: string
  player: Player | null
}

export interface PublicPlayer {
  jerseyNumber: string
  name: string
  tagLine: string
  createdAt: number
}

export interface AppConfig {
  resendTestMode: boolean
  testRecipient: string | null
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(path, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  const data = await res.json().catch(() => ({}))

  if (!res.ok) {
    throw new Error(data.error ?? 'Something went wrong')
  }

  return data as T
}

export const api = {
  getConfig: () => request<AppConfig>('/api/config'),

  sendOtp: (email: string) =>
    request<{ ok: true }>('/api/auth/send-otp', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  verifyOtp: (email: string, code: string) =>
    request<{ ok: true; email: string }>('/api/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ email, code }),
    }),

  me: () => request<AuthUser>('/api/auth/me'),

  logout: () => request<{ ok: true }>('/api/auth/logout', { method: 'POST' }),

  getTakenNumbers: () => request<{ numbers: string[] }>('/api/players/taken-numbers'),

  getAllPlayers: () => request<{ players: PublicPlayer[]; total: number }>('/api/players'),

  createPlayer: (player: Player) =>
    request<{ player: PublicPlayer }>('/api/players', {
      method: 'POST',
      body: JSON.stringify(player),
    }),

  updatePlayer: (player: Player) =>
    request<{ player: PublicPlayer }>('/api/players/me', {
      method: 'PUT',
      body: JSON.stringify(player),
    }),
}

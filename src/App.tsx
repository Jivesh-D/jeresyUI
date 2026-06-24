import { useCallback, useEffect, useMemo, useState } from 'react'
import { api } from './api'
import { Login } from './components/Login'
import { PlayerForm } from './components/PlayerForm'
import type { PublicPlayer } from './api'
import { type Player } from './types'
import './App.css'

function App() {
  const emptyPlayer = useMemo(() => ({ jerseyNumber: '', name: '', tagLine: '' }), [])
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState<string | null>(null)
  const [player, setPlayer] = useState<Player | null>(null)
  const [takenNumbers, setTakenNumbers] = useState<string[]>([])
  const [roster, setRoster] = useState<PublicPlayer[]>([])

  const refreshData = useCallback(async () => {
    try {
      const [taken, all] = await Promise.all([api.getTakenNumbers(), api.getAllPlayers()])
      setTakenNumbers(taken.numbers)
      setRoster(all.players)
    } catch {
      /* keep existing roster data if refresh fails */
    }
  }, [])

  const loadSession = useCallback(async () => {
    try {
      const session = await api.me()
      setEmail(session.email)
      setPlayer(session.player ?? null)
      await refreshData()
    } catch {
      setEmail(null)
      setPlayer(null)
    } finally {
      setLoading(false)
    }
  }, [refreshData])

  useEffect(() => {
    loadSession()
  }, [loadSession])

  useEffect(() => {
    if (!email) return
    const interval = setInterval(refreshData, 15_000)
    return () => clearInterval(interval)
  }, [email, refreshData])

  async function handleLogout() {
    await api.logout()
    setEmail(null)
    setPlayer(null)
  }

  async function handleSubmit(data: Player) {
    if (player) {
      const result = await api.updatePlayer(data)
      setPlayer(result.player)
    } else {
      const result = await api.createPlayer(data)
      setPlayer(result.player)
    }
    await refreshData()
  }

  if (loading) {
    return (
      <div className="app app-centered">
        <p className="loading-text">Loading…</p>
      </div>
    )
  }

  if (!email) {
    return (
      <div className="app app-centered">
        <Login onSuccess={loadSession} />
      </div>
    )
  }

  return (
    <div className="app">
      <header className="header">
        <div className="header-text">
          <h1>Team Jersey Order</h1>
          <p>
            Signed in as <strong>{email}</strong>
            {player ? ' — your jersey is registered.' : ' — pick your number before someone else does!'}
          </p>
        </div>
        <button type="button" className="btn btn-ghost" onClick={handleLogout}>
          Sign out
        </button>
      </header>

      <PlayerForm
        key={player ? `player-${player.jerseyNumber}` : 'new'}
        initial={player ?? emptyPlayer}
        takenNumbers={takenNumbers}
        isEditing={Boolean(player)}
        onSubmit={handleSubmit}
      />

      <section className="roster-section">
        <div className="roster-header">
          <h2>Team roster</h2>
          <span className="stat">
            <strong>{roster.length}</strong> claimed
          </span>
        </div>
        {roster.length === 0 ? (
          <p className="roster-empty">No jerseys claimed yet. Be the first!</p>
        ) : (
          <div className="roster-table-wrap">
            <table className="roster-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  <th>Tag Line</th>
                </tr>
              </thead>
              <tbody>
                {roster.map((p) => (
                  <tr key={p.jerseyNumber}>
                    <td className="roster-num">{p.jerseyNumber}</td>
                    <td>{p.name}</td>
                    <td className="roster-tag">{p.tagLine || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}

export default App

import { useState } from 'react'
import { JerseyPreview } from './JerseyPreview'
import { NumberPicker } from './NumberPicker'
import { JERSEY_SIZES, type Player } from '../types'

interface PlayerFormProps {
  initial: Player
  takenNumbers: string[]
  isEditing: boolean
  onSubmit: (player: Player) => Promise<void>
}

function isNumberTaken(num: string, takenNumbers: string[], ownNumber: string) {
  return takenNumbers.includes(num) && num !== ownNumber
}

export function PlayerForm({ initial, takenNumbers, isEditing, onSubmit }: PlayerFormProps) {
  const [player, setPlayer] = useState<Player>(initial)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const takenSet = new Set(
    takenNumbers.filter((n) => n !== initial.jerseyNumber),
  )

  function update(field: keyof Player, value: string) {
    setPlayer((prev) => ({ ...prev, [field]: value }))
    setSuccess('')
    setError('')
  }

  function selectJerseyNumber(raw: string) {
    const num = raw.replace(/\D/g, '').replace(/^0+/, '')
    if (!num) {
      update('jerseyNumber', '')
      return
    }
    const parsed = String(Math.min(99, Math.max(1, Number(num))))
    if (isNumberTaken(parsed, takenNumbers, initial.jerseyNumber)) {
      setError(`Jersey #${parsed} is already taken. Pick another number.`)
      return
    }
    update('jerseyNumber', parsed)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!player.jerseyNumber) {
      setError('Pick a jersey number first.')
      return
    }
    if (isNumberTaken(player.jerseyNumber, takenNumbers, initial.jerseyNumber)) {
      setError(`Jersey #${player.jerseyNumber} was just taken. Pick another number.`)
      return
    }
    if (!player.name.trim()) {
      setError('Enter your name.')
      return
    }
    if (!player.jerseySize) {
      setError('Select your jersey size.')
      return
    }

    setLoading(true)
    try {
      await onSubmit(player)
      setSuccess(isEditing ? 'Your jersey details have been updated.' : 'Your jersey number is locked in!')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setLoading(false)
    }
  }

  const canSubmit = Boolean(player.jerseyNumber && player.name.trim() && player.jerseySize)

  return (
    <form onSubmit={handleSubmit} className="player-form">
      {error && (
        <div className="alert" role="alert">
          {error}
        </div>
      )}
      {success && (
        <div className="alert alert-success" role="status">
          {success}
        </div>
      )}

      <div className="player-form-layout">
        <div className="form-section">
          <h2>Pick your jersey number</h2>
          <p className="section-hint">First come, first served — numbers already taken are disabled.</p>

          <label className="field jersey-number-field">
            <span>Jersey number</span>
            <input
              type="text"
              inputMode="numeric"
              placeholder="Type or pick below (1–99)"
              value={player.jerseyNumber}
              maxLength={2}
              disabled={loading}
              onChange={(e) => selectJerseyNumber(e.target.value)}
            />
          </label>

          <NumberPicker
            value={player.jerseyNumber}
            takenNumbers={takenSet}
            onChange={selectJerseyNumber}
            disabled={loading}
          />

          <h2>Your details</h2>
          <div className="form-fields details-fields">
            <label className="field field-highlight">
              <span>Name</span>
              <input
                type="text"
                className="highlight-input"
                placeholder="e.g. Smith"
                value={player.name}
                maxLength={20}
                onChange={(e) => update('name', e.target.value)}
                disabled={loading}
              />
            </label>

            <label className="field field-highlight">
              <span>Tag Line</span>
              <span className="field-hint">Printed below your name on the jersey</span>
              <input
                type="text"
                className="highlight-input"
                placeholder="e.g. Captain"
                value={player.tagLine}
                maxLength={24}
                onChange={(e) => update('tagLine', e.target.value)}
                disabled={loading}
              />
            </label>

            <div className="field field-highlight">
              <span>Jersey size</span>
              <div className="size-picker" role="group" aria-label="Jersey size">
                {JERSEY_SIZES.map((size) => (
                  <button
                    key={size}
                    type="button"
                    className={`size-cell${player.jerseySize === size ? ' selected' : ''}`}
                    disabled={loading}
                    aria-pressed={player.jerseySize === size}
                    onClick={() => update('jerseySize', size)}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="claim-actions">
            <button type="submit" className="btn btn-primary" disabled={loading || !canSubmit}>
              {loading ? 'Saving…' : isEditing ? 'Update my jersey' : 'Claim jersey number'}
            </button>
            {!canSubmit && !loading && (
              <p className="submit-hint">Select a jersey number, enter your name, and pick a size to continue.</p>
            )}
          </div>
        </div>

        <div className="preview-section">
          <h2>Preview</h2>
          <JerseyPreview
            jerseyNumber={player.jerseyNumber}
            name={player.name}
            tagLine={player.tagLine}
          />
        </div>
      </div>
    </form>
  )
}
